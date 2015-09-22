/* global require, exports */
var lpName = require('./lpNameResolver');
var Q = require('q');
var shelljs = require('shelljs');
var tmp = require('tmp');

exports.getVersions = function(source) {
};

exports.download = function(source, version) {
    var tmpDir = tmp.dirSync().name;
    var src = lpName.resolve(source);
    var artifact = 'com.backbase.launchpad.components.' + src.project + ':' + src.name + ':' + version + ':zip';

    var cmd = 'mvn org.apache.maven.plugins:maven-dependency-plugin:2.8:unpack' +
        ' -Dartifact=' + artifact + ' -DoutputDirectory=' + tmpDir;
    console.log(cmd);
    var exe = shelljs.exec(cmd);
};
