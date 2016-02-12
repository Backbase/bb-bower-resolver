var resources = require('./resources.json');
var _ = require('lodash');

exports.check = function (source, config) {
    return _.find(config || resources.check, function (config) {
        var startsWithRegex = new RegExp('^(' + config.startsWith.join('|')+')');
        return !!~config.fullName.indexOf(source) || startsWithRegex.test(source);
    });
}

exports.resolve = function (source) {
    var predefined;

    _.find(resources.resolve, function (config) {
        var startsWithRegExp = new RegExp('^' + config.startsWith.join('|'));
        if (startsWithRegExp.test(source)) {
            predefined = {
                name: source.replace(startsWithRegExp, ''),
                project: config.project,
                repoPath: config.repoPath
            };
        }
    });

    if (predefined) {
        return predefined;
    }

    if (source.indexOf('widget-') === 0) {
        return {
            project: 'lpw',
            name: source
        };
    }
    if (source.indexOf('module-') === 0) {
        return {
            project: 'lpm',
            name: source
        };
    }
    if (source.indexOf('collection-') === 0) {
        return {
            project: 'lpc',
            name: source
        };
    }
    if (['mock', 'ui', 'config', 'theme', 'theme-default', 'theme-breeze'].indexOf(source) !== -1) {
        return {
            project: 'lpm',
            name: source
        };
    }
    if (['base', 'core'].indexOf(source) !== -1) {
        return {
            project: 'lpm',
            name: 'foundation-' + source
        };
    }
    // if (source.indexOf('container-') === 0 || source.indexOf('page-') === 0 || source.indexOf('template-') === 0) {
    //     return {
    //         project: 'lpi',
    //         name: source
    //     };
    // }
    return {
        project: 'lpi',
        name: source
    };
}

