/* jslint node: true */
"use strict";

var fs   = require('fs');
var path = require('path');
var util = require('util');

var valides   = {};
var ignored   = [];
var invalides = [];

var HTTPMETHODS = {
    "options": true,
    "get":     true,
    "head":    true,
    "post":    true,
    "put":     true,
    "delete":  true,
    "trace":   true,
    "all":     true
};

var defaultExt     = ['.js'];
var extentions     = [];
var defaultFolder  = path.join(__dirname, '../../routes');
var ignoreFileName = './.routeignore';
var ignoreFiles    = [];

//regexp
var reIgnoreFiles      = null;
var reEscComments      = /\\#/g;
var reUnescapeComments = /\^\^/g; // note that '^^' is used in place of escaped comments
var reComments         = /#.*$/;
var reTrim             = /^(\s|\u00A0)+|(\s|\u00A0)+$/g;
var reEscapeChars      = /[.|\-[\]()\\]/g;
var reAsterisk         = /\*/g;


/**
 * Function for initialisation rules of '.routeignore' file.
 * @param {String} dir — full path of routes folder
 */
function initIgnore (dir) {
    var ignoreFile = path.join(dir, ignoreFileName);
    if (fs.existsSync(ignoreFile)) {
        var ignore = fs.readFileSync(ignoreFile).toString().split(/\n/);
        
        for (var i = 0; i < ignore.length; i++) {
            var rule = ignore[i];
            if(rule){
                var noEscape = rule.substr(0,1) === ':';
                if (noEscape) {
                    rule = rule.substr(1);
                }
                addIgnoreRule(rule, noEscape);
            }
        }
    }
}

/**
 * Function which adds a single rule of '.routeignore' file.
 * @param {String} line — single line of '.routeignore' file
 * @param {Boolean} noEscape — boolean for noEscape
 */
function addIgnoreRule(line, noEscape) {
    if (!noEscape) {
        if (line = line.replace(reEscComments, '^^').replace(reComments, '').replace(reUnescapeComments, '#').replace(reTrim, '')) {
            ignoreFiles.push(line.replace(reEscapeChars, '\\$&').replace(reAsterisk, '.*'));
        }
    } else if (line = line.replace(reTrim, '')) {
        ignoreFiles.push(line);
    }
    reIgnoreFiles = new RegExp(ignoreFiles.join('|'));
}

/**
 * Function which inspects invalid files.
 * @param {String} file — full path of route file
 * @param {String} route — route path
 */
function inspectInvalid (file, route) {
    invalides.push(file + '\twith route: ' + route);
}

/**
 * Function for recursively scan and initializing of route files inside 'dir' folder and subfolders.
 * @param {Object} app — express application object
 * @param {String} dir — full path of scanned directory
 */
function initRoutes(app, dir) {
    var allFiles = fs.readdirSync(dir);
    var subdirs = [];

    for (var i = 0, l = allFiles.length; i < l; i++) {
        var p = path.join(dir, allFiles[i]);

        if (reIgnoreFiles && reIgnoreFiles.test(p)) {
            ignored.push(p);
        } else {
            if (fs.statSync(p).isDirectory()) {
                subdirs.push(p);
            } else {
                if (extentions.some(function (ext) { return ext === path.extname(p); })) {
                    addRoute(app, p);
                } else {
                    ignored.push(p);
                }
            }
        }
    }

    for (var j = 0, len = subdirs.length; j < len; j++) {
        initRoutes(app, subdirs[j]);
    }
}

/**
 * Function which returns array of valid HTTP methods.
 * @param {Array} methods — array of HTTP methods
 * @return {Array} result — array of valid HTTP methods
 */
function getValidMethods(methods){
    var result = [];
    if (methods && util.isArray(methods)) {
        for (var i = 0, l = methods.length; i < l; i++) {
            var m = methods[i].toLowerCase();
            if (HTTPMETHODS[m]) result.push(m);
            // TODO: invalides.push
        }
    } else {
        result = ['get'];
    }

    return result;
}


/**
 * Function which validates route parameters.
 * @param {String} route — route path
 * @param {Function} fn — callback function for route
 * @param {Array} methods — array of HTTP methods for route
 * @param {String} file — full path of route file
 * @return {Boolean} valid — validation result
 */
function isRouteValid(route, fn, methods, file) {
    var valid = typeof route === 'string' &&
        typeof fn === 'function' &&
        methods.length > 0 &&
        !valides[route];

    if (valid) valides[route] = file;
    else inspectInvalid(file, route);

    return valid;
}

/**
 * Function which requires route-file and run 'applyRoute' function for every valid route into the file.
 * @param {Object} app — express application object
 * @param {String} file — full path of route file
 */
function addRoute (app, file){
    var r = require(file);
    var methods;

    if (r !== undefined && typeof r === 'object') {
        for (var route in r) {
            var action = r[route];

            if (typeof action === 'function') {
                methods = ['get'];
                if (isRouteValid(route, action, methods, file)) {
                    applyRoute(app, route, action, methods);
                }
            } else if (typeof action.callback === 'function') {
                methods = getValidMethods(action.methods);
                if (isRouteValid(route, action.callback, methods, file)) {
                    var _route = (action.regexp && util.isRegExp(action.regexp)) ? action.regexp : route;
                    applyRoute(app, _route, action.callback, methods, action.middleware);
                }
            } else inspectInvalid(file, route);
        }
    }
}

/**
 * Function which applies a single route for express application object.
 * @param {Object} app — express application object
 * @param {String} route — route path or RegExp
 * @param {Function} fn — callback function for route
 * @param {Array} methods — array of HTTP methods for route
 * @param {Function|Array} middleware — middleware function of array of middleware functions
 */
function applyRoute (app, route, fn, methods, middleware) {
    for (var i = 0, l = methods.length; i < l; i++) {
        var method = methods[i];
        app[method](route, middleware || [], fn);
        console.log(' #', method.toUpperCase(), route);
    }
}

/**
 * Function which prints into console array with extra strings before and after element of array.
 * @param {Array} array — array of strings for printing into console
 * @param {String} before — string which will be printed before array element
 * @param {String} after — string which will be printed after array element
 */
function printArray (array, before, after) {
    if (util.isArray(array)) {
        for (var i = 0, l = array.length; i < l; i++) {
            console.log(before || "", array[i], after || "");
        }
    } else if (typeof array === 'object') {
        for (var route in array) {
            console.log(before || "", array[route], '\twith route:', route, after || "");
        }
    }
}

/**
 * Function which prints statistic information about ignored files, invalid and valid route-files into console.
 */
function printStatInfo(){
    console.log('\nStatistic info:');
    console.log(' [routed]:');
    printArray(valides, '\t');
    console.log(' [invalid]:');
    printArray(invalides, '\t');
    console.log(' [ignored]:');
    printArray(ignored, '\t');
}

module.exports = function router (app, opts) {
    if (!app) {
        throw new Error('The first parameter is required and must be an express application.');
    }
    
    if (!opts) opts = {};
    var dir     = (opts.directory) ? opts.directory : defaultFolder;
    var verbose = (opts.verbose) ? opts.verbose : false;
    extentions  = (!util.isArray(opts.ext)) ? opts.ext ? [opts.ext] : defaultExt : opts.ext;

    initIgnore(dir);
    
    console.log('Initialized routes:');
    initRoutes(app, dir);
    
    if (verbose) printStatInfo();
    console.log('Done.');
};