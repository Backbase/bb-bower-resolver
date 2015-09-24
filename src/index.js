var tmp = require('tmp');
var Q = require('q');
var chalk = require('chalk');
var lpName = require('./lpNameResolver');
var bowerConfig = require('bower-config').read();
var request = require('request');
var url = require('url');
var semver = require('semver');
var restApi = require('./restApi');

var defer = Q.defer();
var resolverType;

init();

// if registry is defined, check if it is available and use it if it is
// otherwise get credentials from maven and
// if password is not encrypted, get deps from artifactory via rest api
function init() {
    var registry = bowerConfig.registry.search[0];
    if (registry !== 'https://bower.herokuapp.com') {
        // if registry is working skip
        var finalUrl = url.resolve(registry, '/packages/base');
        request.get(finalUrl, {timeout: 500}, function(err, res) {
            if (!err && res.statusCode === 200) {
                defer.resolve('skip');
                log('Registry ' + chalk.gray(registry) + ' available. Skipping...');
            } else {
                log('Registry ' + chalk.gray(registry) + ' not available.');
                defer.resolve(getArtifactoryType());
            }
        });
    } else {
        defer.resolve(getArtifactoryType());
    }
}

module.exports = function resolver (bower) {

  return {

    match: function (source) {
        return defer.promise
        .then(function(type) {
            resolverType = type;
            if (resolverType === 'skip') return false;
            return lpName.check(source);
        });
    },

    releases: function (source) {
        return resolverType.getVersions(source);
    },

    fetch: function (endpoint, cached) {
        if (cached && cached.version) {
            return;
        }
        if (!semver.valid(endpoint.target)) {
            log(endpoint.target + ' is not valid semver for component \'' + endpoint.source + '\'');
            throw new Error();
        }
        return resolverType.download(endpoint.source, endpoint.target)
        .then(function(dir) {
            return {
                tempPath: dir,
                removeIgnores: true
            };
        })
        .catch(function(err) {
            console.log('download error');
            console.log(err);
            return;
        });
    }
  };
};


function getArtifactoryType() {
    return restApi.test()
    .then(function() {
        log('Using Artifactory API');
        return restApi;
    })
    .catch(function() {
        log('Repository access failed. Skipping...');
        return 'skip';
    });

}

function log(str) {
    console.log(chalk.yellow('Backbase resolver:'), str);
}
