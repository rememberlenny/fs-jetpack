"use strict";

describe('read & write |', function () {

    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('./support/spec_helper');
    var jetpack = require('..');

    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);

    var path = "file.txt";

    it('writes and reads file as string', function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
        };

        var expectations = function (content) {
            expect(content).toBe('ąbć');
        };

        // SYNC
        preparations();
        jetpack.write(path, 'ąbć');
        var content = jetpack.read(path); // defaults to 'utf8'
        expectations(content);
        content = jetpack.read(path, 'utf8'); // explicitly said
        expectations(content);

        // ASYNC
        preparations();
        jetpack.writeAsync(path, 'ąbć')
        .then(function () {
            return jetpack.readAsync(path); // defaults to 'utf8'
        })
        .then(function (content) {
            expectations(content);
            return jetpack.readAsync(path, 'utf8'); // explicitly said
        })
        .then(function (content) {
            expectations(content);
            done();
        });
    });

    it('writes and reads file as Buffer', function (done) {

        var bytes = [11, 22, 33];
        var buf = new Buffer(bytes);

        var preparations = function () {
            helper.clearWorkingDir();
        };

        var expectations = function (content) {
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content.length).toBe(bytes.length);
            expect(content[0]).toBe(bytes[0]);
            expect(content[1]).toBe(bytes[1]);
            expect(content[2]).toBe(bytes[2]);
        };

        // SYNC
        preparations();
        jetpack.write(path, buf);
        var content = jetpack.read(path, 'buf');
        expectations(content);

        // ASYNC
        preparations();
        jetpack.writeAsync(path, buf)
        .then(function () {
            return jetpack.readAsync(path, 'buf')
        })
        .then(function (content) {
            expectations(content);
            done();
        });
    });

    it('writes and reads file as JSON', function (done) {

        var obj = {
            utf8: "ąćłźż"
        };

        var preparations = function () {
            helper.clearWorkingDir();
        };

        var expectations = function () {
            expect(content).toEqual(obj);
        };

        // SYNC
        preparations();
        jetpack.write(path, obj);
        var content = jetpack.read(path, 'json');
        expectations(content);

        // ASYNC
        preparations();
        jetpack.writeAsync(path, obj)
        .then(function () {
            return jetpack.readAsync(path, 'json')
        })
        .then(function (content) {
            expectations(content);
            done();
        });
    });

    it('written JSON data can be indented', function (done) {

        var obj = {
            utf8: "ąćłźż"
        };

        var preparations = function () {
            helper.clearWorkingDir();
        };

        var expectations = function (content) {
            var sizeA = fse.statSync('a.json').size;
            var sizeB = fse.statSync('b.json').size;
            var sizeC = fse.statSync('c.json').size;
            expect(sizeB).toBeGreaterThan(sizeA);
            expect(sizeC).toBeGreaterThan(sizeB);
        };

        // SYNC
        preparations();
        jetpack.write('a.json', obj, { jsonIndent: 0 });
        jetpack.write('b.json', obj); // Default indent = 2
        jetpack.write('c.json', obj, { jsonIndent: 4 });
        expectations();

        // ASYNC
        preparations();
        jetpack.writeAsync('a.json', obj, { jsonIndent: 0 })
        .then(function () {
            return jetpack.writeAsync('b.json', obj); // Default indent = 2
        })
        .then(function () {
            return jetpack.writeAsync('c.json', obj, { jsonIndent: 4 });
        })
        .then(function () {
            expectations();
            done();
        });
    });

    it('gives nice error message when JSON parsing failed', function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
            fse.outputFileSync('a.json', '{ "abc: 123 }'); // Malformed JSON
        };

        var expectations = function (err) {
            expect(err.message).toContain('JSON parsing failed while reading');
        };

        // SYNC
        preparations();
        try {
            jetpack.read('a.json', 'json');
        } catch (err) {
            expectations(err);
        }

        // ASYNC
        preparations();
        jetpack.readAsync('a.json', 'json')
        .catch(function (err) {
            expectations(err);
            done();
        });
    });

    it('writes and reads file as JSON with Date parsing', function (done) {

        var obj = {
            utf8: "ąćłźż",
            date: new Date()
        };

        var preparations = function () {
            helper.clearWorkingDir();
        };

        var expectations = function (content) {
            expect(content).toEqual(obj);
        };

        // SYNC
        preparations();
        jetpack.write(path, obj);
        var content = jetpack.read(path, 'jsonWithDates');
        expectations(content);

        // ASYNC
        preparations();
        jetpack.writeAsync(path, obj)
        .then(function () {
            return jetpack.readAsync(path, 'jsonWithDates')
        })
        .then(function (content) {
            expectations(content);
            done();
        });
    });

    it("write can create nonexistent parent directories", function (done) {

        var preparations = function () {
            helper.clearWorkingDir();
        };

        var expectations = function () {
            expect('a/b/c.txt').toBeFileWithContent('abc');
        };

        // SYNC
        preparations();
        jetpack.write('a/b/c.txt', 'abc');
        expectations();

        // ASYNC
        preparations();
        jetpack.writeAsync('a/b/c.txt', 'abc')
        .then(function () {
            expectations();
            done();
        });
    });

    it("read returns null if file doesn't exist", function (done) {

        var expectations = function (content) {
            expect(content).toBe(null);
        };

        // SYNC
        var content = jetpack.read('nonexistent.txt');
        expectations(content);

        // ASYNC
        jetpack.readAsync('nonexistent.txt')
        .then(function (content) {
            expectations(content);
            done();
        });
    });

    it("read throws if given path is directory", function (done) {

        var preparations = function () {
            fse.mkdirsSync('dir');
        };

        var expectations = function (err) {
            expect(err.code).toBe('EISDIR');
        };

        preparations();

        // SYNC
        try {
            var content = jetpack.read('dir');
            throw 'to make sure this code throws';
        } catch (err) {
            expectations(err);
        }

        // ASYNC
        jetpack.readAsync('dir')
        .catch(function (err) {
            expectations(err);
            done();
        });
    });

});