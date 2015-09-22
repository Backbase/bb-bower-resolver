var startsWith = [
    'widget-',
    'module-',
    'container-',
    'page-',
    'template-',
    'collection-'
];
var fullName = [
    'base',
    'core',
    'ui',
    'config',
    'theme',
    'theme-default',
    'theme-breeze',
    'chrome-templates',
    'content-templates'
];

exports.check = function(source) {
    for (var i = 0; i < startsWith.length; i++) {
        if (source.indexOf(startsWith[i]) === 0) {
            //console.log(src);
            return true;
        }
    }
    if (fullName.indexOf(source) !== -1) {
        //console.log(src);
        return true;
    }
    // console.log(src);
    return false;
}

exports.resolve = function(source) {
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
    if (['ui', 'config', 'theme', 'theme-default', 'theme-breeze'].indexOf(source) !== -1) {
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

