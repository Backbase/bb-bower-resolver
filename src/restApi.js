var path = require('path');
var lpName = require('./lpNameResolver');
var request = require('request');
var tmp = require('tmp');
var Q = require('q');
var fs = require('fs-extra-promise');
var chalk = require('chalk');
var url = require('url');
var DecompressZip = require('decompress-zip');
var mavenConfig = require('./mavenConfig');
var bowerConfig = require('bower-config').read();
var repoConfig = mavenConfig[bowerConfig.backbase.repoId];

for (var k in bowerConfig.backbase) repoConfig[k] = bowerConfig.backbase[k];
var urc = url.parse(repoConfig.url);
var finalUrl = urc.protocol + '//' + urc.host;
if (urc.port) finalUrl += ':' + urc.port;
repoConfig.url = finalUrl;

exports.test = function() {
    var defer = Q.defer();
    var cpath = '/api/storage/' + repoConfig.repoPath + 'lpm/foundation-base';
    finalUrl = url.resolve(repoConfig.url, cpath);

    request
    .get(finalUrl, {
        auth: {
            username: repoConfig.username,
            password: repoConfig.password
        }
    })
    .on('error', function(err) {
        defer.reject();
    })
    .on('response', function(res) {
        if (res.statusCode === 200) {
            defer.resolve();
        } else {
            defer.reject();
        }
    });
    return defer.promise;

}

exports.getVersions = function(source) {
    var cfg = repoConfig;
    var src = lpName.resolve(source);
    var cpath = 'api/storage/' + cfg.repoPath + src.project;
    // backbase-development-staged-release
    finalUrl = url.resolve(cfg.url, path.join(cpath, src.name));

    var defer = Q.defer();
    request({
        method: 'get',
        url: finalUrl,
        auth: {
            username: cfg.username,
            password: cfg.password
        }
    }, function(err, res, body) {
        if (err) defer.reject(err);
        else {
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
}

exports.download = function(source, version) {
    var tmpDir = tmp.dirSync().name;
    var cfg = repoConfig;
    var src = lpName.resolve(source);
    var cpath = cfg.repoPath + src.project;
    // backbase-development-staged-release
    var file = src.name + '-' + version + '.zip';
    finalUrl = url.resolve(cfg.url, path.join(cpath, src.name, version, file));
    var destFile = path.join(tmpDir, file);

    var defer = Q.defer();
    request
    .get(finalUrl, {
        auth: {
            username: cfg.username,
            password: cfg.password
        },
        gzip: true
    })
    .on('error', function(err) {
        console.log(url);
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
    // https://artifacts.backbase.com/backbase-development-internal-releases/com/backbase/launchpad/components/lpw-widget-accounts/2.1.0/lpw-widget-accounts-2.1.0.zip
}
