var tmp = require('tmp');
var Q = require('q');
var chalk = require('chalk');
var lpName = require('./lpNameResolver');
var bowerConfig = require('bower-config').read();
var request = require('request');
var url = require('url');
var restApi = require('./restApi');
var semver = require('semver');

var initPromise;
var resolverType; // defined after init();

module.exports = function resolver (bower) {

  return {

    match: function (source) {
        return init()
        .then(function() {
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

// if registry is defined, check if it is available and use it if it is
// otherwise get credentials from maven and
// if password is not encrypted, get deps from artifactory via rest api
function init() {
    if (initPromise) return initPromise;
    // init just once
    var defer = Q.defer();
    if (bowerConfig.registry.search[0] !== 'https://bower.herokuapp.com') {
        // if registry is working skip
        var finalUrl = url.resolve(bowerConfig.registry.search[0], '/packages/base');
        request.get(finalUrl, function(err, res) {
            if (!err && res.statusCode === 200) {
                defer.resolve('skip');
                log('Using registry ' + bowerConfig.registry.search[0]);
            } else {
                defer.resolve(getArtifactoryType());
            }
        });
    } else {
        defer.resolve(getArtifactoryType());
    }

    return initPromise = defer.promise
    .then(function(type) {
        resolverType = type;
    });
}

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
