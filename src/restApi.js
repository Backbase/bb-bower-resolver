var path = require('path');
var lpName = require('./lpNameResolver');
var request = require('request');
var tmp = require('tmp');
var Q = require('q');
var _ = require('lodash');
var fs = require('fs-extra-promise');
var chalk = require('chalk');
var url = require('url');
var DecompressZip = require('decompress-zip');
var mavenConfig = require('./mavenConfig');
var bowerConfig = require('bower-config').read();

var repoConfig = getRepoConfig();

function getRepoConfig() {

    var cfg;

    _.each(mavenConfig, function(v, k) {
        var parsedUrl = url.parse(v.url);
        if (parsedUrl.host === 'repo.backbase.com') {
            v.url = 'https://repo.backbase.com';
            cfg = v;
            return false;
        }
    });

    cfg = cfg || {};
    var bbConfig = bowerConfig.backbase;
    if (bbConfig) _.assign(cfg, bbConfig);

    if (!cfg.username || !cfg.password) {
        throw new Error('Error while getting artifactory configuration. No credentials for repo.backbase.com were found');
    }

    if (/(\{.*\})/.test(cfg.password)) {
        throw new Error('Encrypted passwords are not supported. Define your password in .bowerrc backbase object.');
    }

    cfg.url = cfg.url || 'https://repo.backbase.com';
    cfg.repoPath = cfg.repoPath || 'backbase-development-staged-release/com/backbase/launchpad/components/';

    return cfg;
}

exports.test = function(testArtifacts) {
    var defer = Q.defer();
    if (testArtifacts) {
        repoConfig.url = 'https://artifacts.backbase.com';
        repoConfig.repoPath = 'backbase-development-internal-releases/com/backbase/launchpad/components/';
    }
    var cpath = '/api/storage/' + repoConfig.repoPath + 'lpm/foundation-base';
    finalUrl = url.resolve(repoConfig.url, cpath);
    console.log('Testing ' + chalk.gray(finalUrl));

    request
    .get(finalUrl, {
        auth: {
            username: repoConfig.username,
            password: repoConfig.password
        }
    })
    .on('error', function(err) {
        if (testArtifacts) defer.reject();
        else defer.resolve(exports.test(true));
    })
    .on('response', function(res) {
        if (res.statusCode === 200) {
            defer.resolve();
        } else {
            if (testArtifacts) defer.reject();
            else defer.resolve(exports.test(true));
        }
    });
    return defer.promise;
};

exports.getVersions = function(source) {
    var src = lpName.resolve(source);
    var cpath = 'api/storage/' + repoConfig.repoPath + src.project;
    var finalUrl = url.resolve(repoConfig.url, path.join(cpath, src.name));

    var defer = Q.defer();
    request({
        method: 'get',
        url: finalUrl,
        auth: {
            username: repoConfig.username,
            password: repoConfig.password
        }
    }, function(err, res, body) {
        if (err) {
            console.log('Error getting versions', chalk.gray(finalUrl));
            defer.reject(err);
        } else {
            if (res.statusCode === 404) {
                console.log(chalk.red(404 + ' ' + res.statusMessage), chalk.yellow(source));
                defer.reject(url);
            } else {
                body = JSON.parse(body);
                if (!body.children) console.log(url);
                var out = [];
                body.children.forEach(function(v) {
                    v = v.uri.slice(1);
                    out.push({
                        target: v,
                        version: v
                    });
                });
                defer.resolve(out);
            }
        }
    });

    return defer.promise;
};

exports.download = function(source, version) {
    var tmpDir = tmp.dirSync().name;
    var src = lpName.resolve(source);
    var cpath = repoConfig.repoPath + src.project;
    var file = src.name + '-' + version + '.zip';
    var finalUrl = url.resolve(repoConfig.url, path.join(cpath, src.name, version, file));
    var destFile = path.join(tmpDir, file);

    var defer = Q.defer();
    request
    .get(finalUrl, {
        auth: {
            username: repoConfig.username,
            password: repoConfig.password
        },
        gzip: true
    })
    .on('error', function(err) {
        console.log('Error getting artifact', chalk.gray(finalUrl));
        defer.reject(err);
    })
    .on('response', function(res) {
        if (res.statusCode === 404) {
            console.log(chalk.red(404 + ' ' + res.statusMessage), chalk.yellow(src.name), version);
            defer.reject(url);
        }
    })
    .pipe(
        fs.createWriteStream(destFile)
        .on('close', function() {
            var exDir = path.join(tmpDir, src.name);
            var unzipper = new DecompressZip(destFile);
            unzipper.on('error', function (err) {
                defer.reject(err);
            });
            unzipper.on('extract', function () {
                defer.resolve(exDir);
            });
            unzipper.extract({
                path: exDir
            });
        })
    );
    return defer.promise;
};

