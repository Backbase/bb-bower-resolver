/* global require */
var homeDir = process.env[(process.platform === 'win32') ? 'USERPROFILE' : 'HOME'];
var path = require('path');
var fs = require('fs-extra-promise');
var jxon = require('jxon');
var _ = require('lodash');
var shelljs = require('shelljs');

jxon.config({
  valueKey: '_',                // default: 'keyValue'
  attrKey: '$',                 // default: 'keyAttributes'
  attrPrefix: '$',              // default: '@'
  lowerCaseTags: false,         // default: true
  trueIsEmpty: false,           // default: true
  autoDate: false,              // default: true
  ignorePrefixedNodes: false,   // default: true
  parseValues: false            // default: true
});

var settings;

// try accessing file directly
try {
    settings = fs.readFileSync(path.join(homeDir, '.m2/settings.xml')).toString();
} catch(err) {
// if it fails, try with maven
    var tmpFile = require('tmp').fileSync().name;

    if (shelljs.exec('mvn help:effective-settings -DshowPasswords=true -Doutput=' + tmpFile, {silent: true}).code !== 0) {
        throw new Error('error getting maven config');
    } else {
        settings = fs.readFileSync(tmpFile).toString();
        fs.removeSync(tmpFile);
    }
}

exports.servers = {};

var jx = jxon.stringToJs(settings).settings;

if (!_.isArray(jx.profiles.profile)) jx.profiles.profile = [jx.profiles.profile];

jx.profiles.profile.forEach(function(profile) {
    var repo;
    if (repo = _.get(profile, 'repositories.repository')) {
        if (!_.isArray(repo)) repo = [repo];
        repo.forEach(function(v) {
            exports.servers[v.id] = {url: v.url};
        });
    }
});

if (!_.isArray(jx.servers.server)) jx.servers.server = [jx.servers.server];

jx.servers.server.forEach(function(v) {
    if (exports.servers[v.id] && v.username && v.password) {
        exports.servers[v.id].username = v.username;
        exports.servers[v.id].password = v.password;
    }
});

if (jx.proxies && jx.proxies.proxy) {
    if (!_.isArray(jx.proxies.proxy)) jx.proxies.proxy = [jx.proxies.proxy];
    exports.proxies = {};
    var proxy;
    jx.proxies.proxy.forEach(function(p) {
        proxy = p.protocol + '://';
        if (p.username && p.password) proxy += encodeURIComponent(p.username) + ':' + encodeURIComponent(p.password) + '@';
        proxy += p.host;
        if (p.port) proxy += ':' + p.port;
        exports.proxies[p.id] = proxy;
    });
}
