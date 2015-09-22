/* global require */
var homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
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

var jx = jxon.stringToJs(settings).settings;

jx.profiles.profile.forEach(function(profile) {
    var repo;
    if (repo = _.get(profile, 'repositories.repository')) {
        if (!(repo instanceof Array)) repo = [repo];
        repo.forEach(function(v) {
            exports[v.id] = {url: v.url};
        });
    }
});

jx.servers.server.forEach(function(v) {
    exports[v.id].username = v.username;
    exports[v.id].password = v.password;
});


// try {
//     var secure = fs.readFileSync(path.join(homeDir, '.m2/settings-security.xml')).toString();
//     jx = jxon.stringToJs(secure).settingsSecurity;
//     var master = jx.master;
//     var crypto = require('crypto');
//     console.log(crypto.getHashes());
//     var enpass = exports['artifacts.backbase.com'].password.toString('binary');
//     var pass = crypto.pbkdf2Sync(enpass, master, 1000, 512, 'sha256');
//     console.log('>', pass.toString());
// } catch(err) {
//     console.log(err);
// }
