var path   = require('path');
var fs     = require('fs');
var should = require('should');
var assert = require('assert');

var getValidMethods = require('../lib/getValidMethods');

describe('Test getValidMethods function', function() {
    var validMethods = ['all', 'options', 'get', 'head', 'post', 'put', 'delete', 'trace'];
    var wrongValues  = [null, NaN, '', 'text', 12, 3, /regex/gi, {"a": 1}];
    var route        = "route";
    var file         = "file";

    it("should exists", function() {
        should.exist(getValidMethods);
    });

    describe('if ignoreInvalid is `true`', function() {
        var ignoreInvalid = true;


        it("should return an array `['get']` if arguments is absent or methods is undefined", function() {
            var invalid = [];
            getValidMethods().should.eql(['get']);
            getValidMethods(undefined).should.eql(['get']);
            invalid.should.have.lengthOf(0);
        });

        it("should return an array `['get']` if input methods isn't undefined and isn't array", function() {
            var invalid = [];
            for (var i = 0; i < wrongValues.length; i++) {
                getValidMethods(wrongValues[i], route, file, invalid, ignoreInvalid).should.eql(['get']);
            }
            invalid.should.have.lengthOf(wrongValues.length);
        });

        it("should return an array `['get']` if input methods is empty array", function() {
            var invalid = [];
            getValidMethods([], route, file, invalid, ignoreInvalid).should.eql(['get']);
            invalid.should.have.lengthOf(0);
        });

        it("should return an array `['get']` if input methods is array of all invalid values", function() {
            var invalid = [];
            getValidMethods(wrongValues, route, file, invalid, ignoreInvalid).should.eql(['get']);
            invalid.should.have.lengthOf(wrongValues.length);
        });

        it("should return an array of valid HTTP methods if input methods is array that contain some valid values", function() {
            var invalid = [];
            var input = ['gett', 'post', 'Head', 'wrrrong', 2, 'PUT', null]; // 'post', 'head', 'put' are valid methods
            var result = getValidMethods(input, route, file, invalid, ignoreInvalid);
            result.should.be.an.instanceOf(Array);
            
            result.should.have.lengthOf(3);
            for (var i = 0; i < result.length; i++) {
                validMethods.should.include(result[i]);
            }
            invalid.should.have.lengthOf(4);
        });

        it("should return an array of valid HTTP methods if input methods is array that contain all valid values", function() {
            var invalid = [];
            var input = ['get', 'options', 'delete', 'trace'];
            var result = getValidMethods(input, route, file, invalid, ignoreInvalid);
            result.should.be.an.instanceOf(Array);
            
            result.should.have.lengthOf(input.length);
            for (var i = 0; i < result.length; i++) {
                validMethods.should.include(result[i]);
            }
            invalid.should.have.lengthOf(0);
        });
    });
    
    describe('if ignoreInvalid is `false`', function() {
        var ignoreInvalid = false;

        it("should return an array `['get']` if arguments is absent or methods is undefined", function() {
            var invalid = [];
            getValidMethods().should.eql(['get']);
            getValidMethods(undefined).should.eql(['get']);
            invalid.should.have.lengthOf(0);
        });

        it("should throw an error if input methods isn't undefined and isn't array", function() {
            var invalid = [];
            for (var i = 0; i < wrongValues.length; i++) {
                (function() {
                    getValidMethods(wrongValues[i], route, file, invalid, ignoreInvalid);
                }).should.throw();
            }
            invalid.should.have.lengthOf(wrongValues.length);
        });

        it("should return an array `['get']` if input methods is empty array", function() {
            var invalid = [];
            getValidMethods([], route, file, invalid, ignoreInvalid).should.eql(['get']);
            invalid.should.have.lengthOf(0);
        });

        it("should throw an error if input methods is array of all invalid values", function() {
            var invalid = [];
            for (var i = 0; i < wrongValues.length; i++) {
                (function() {
                    getValidMethods(wrongValues[i], route, file, invalid, ignoreInvalid);
                }).should.throw();
            }
            invalid.should.have.lengthOf(wrongValues.length);
        });

        it("should throw an error if input methods is array that contain some invalid values", function() {
            var invalid = [];
            var input = ['gett', 'post', 'Head', 'wrrrong', 2, 'PUT', null]; // 'post', 'head', 'put' are valid methods
            (function() {
                var result = getValidMethods(input, route, file, invalid, ignoreInvalid);
            }).should.throw();
            invalid.should.have.lengthOf(1);
        });

        it("should return an array of valid HTTP methods if input methods is array that contain all valid values", function() {
            var invalid = [];
            var input = ['get', 'options', 'delete', 'trace'];
            var result;
            (function() {
                result = getValidMethods(input, route, file, invalid, ignoreInvalid);
            }).should.not.throw();
            result.should.be.an.instanceOf(Array);
            
            result.should.have.lengthOf(input.length);
            for (var i = 0; i < result.length; i++) {
                validMethods.should.include(result[i]);
            }
            invalid.should.have.lengthOf(0);
        });
    });
});