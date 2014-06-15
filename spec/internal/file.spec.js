"use strict";

describe('internal/file', function () {
    
    var fse = require('fs-extra');
    var pathUtil = require('path');
    var helper = require('../helper');
    var internalFile = require('../../lib/internal/file');
    
    beforeEach(helper.beforeEach);
    afterEach(helper.afterEach);
    
    var path = 'file.txt';
    
    it('writes and reads file as string', function (done) {
        // SYNC
        internalFile.write(path, 'abc');
        var content = internalFile.read(path);
        expect(content).toBe('abc');
        
        // ASYNC
        internalFile.writeAsync(path, 'abc')
        .then(function () {
            return internalFile.readAsync(path)
        })
        .then(function (content) {
            expect(content).toBe('abc');
            done();
        });
    });
    
    it('writes and reads file as Buffer', function (done) {
        var bytes = [11, 22, 33];
        var buf = new Buffer(bytes);
        
        // SYNC
        internalFile.write(path, buf);
        var content = internalFile.read(path, { returnAs: 'buf' });
        expect(Buffer.isBuffer(content)).toBe(true);
        expect(content.length).toBe(bytes.length);
        expect(content[0]).toBe(bytes[0]);
        expect(content[2]).toBe(bytes[2]);
        
        // ASYNC
        internalFile.writeAsync(path, buf)
        .then(function () {
            return internalFile.readAsync(path, { returnAs: 'buf' })
        })
        .then(function (content) {
            expect(Buffer.isBuffer(content)).toBe(true);
            expect(content.length).toBe(bytes.length);
            expect(content[0]).toBe(bytes[0]);
            expect(content[2]).toBe(bytes[2]);
            done();
        });
    });
    
    it('writes and reads file as JSON', function (done) {
        var obj = {
            utf8: "ąćłźż"
        };
        
        // SYNC
        internalFile.write(path, obj);
        var content = internalFile.read(path, { returnAs: 'json' });
        expect(content).toEqual(obj);
        
        // ASYNC
        internalFile.writeAsync(path, obj)
        .then(function () {
            return internalFile.readAsync(path, { returnAs: 'json' })
        })
        .then(function (content) {
            expect(content).toEqual(obj);
            done();
        });
    });
    
    it('writes and reads file as JSON with Date parsing', function (done) {
        var obj = {
            utf8: "ąćłźż",
            date: new Date()
        };
        
        // SYNC
        internalFile.write(path, obj);
        var content = internalFile.read(path, { returnAs: 'jsonWithDates' });
        expect(content).toEqual(obj);
        
        // ASYNC
        internalFile.writeAsync(path, obj)
        .then(function () {
            return internalFile.readAsync(path, { returnAs: 'jsonWithDates' })
        })
        .then(function (content) {
            expect(content).toEqual(obj);
            done();
        });
    });
    
    it('removes a file', function (done) {
        // SYNC
        fse.writeFileSync(path, 'abc');
        
        internalFile.remove(path);
        
        expect(fse.existsSync(path)).toBe(false);
        
        // ASYNC
        fse.writeFileSync(path, 'abc');
        
        internalFile.removeAsync(path)
        .then(function () {
            expect(fse.existsSync(path)).toBe(false);
            done();
        });
    });
    
    describe('safe file operations', function () {
        
        var newPath = path + '.__new__';
        var bakPath = path + '.__bak__';
        
        it("writes file safely if file doesn't exist", function (done) {
            // SYNC
            internalFile.write(path, 'abc', { safe: true });
            
            expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
            // after successful write old files should disappear
            expect(fse.existsSync(newPath)).toBe(false);
            expect(fse.existsSync(bakPath)).toBe(false);
            
            // ASYNC
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // after successful write temp files should disappear
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
                done();
            });
        });
        
        it('writes file safely if file already exists', function (done) {
            // SYNC
            fse.writeFileSync(path, 'xyz');
            
            internalFile.write(path, 'abc', { safe: true });
            
            expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
            // after successful write temp files should disappear
            expect(fse.existsSync(newPath)).toBe(false);
            expect(fse.existsSync(bakPath)).toBe(false);
            
            // ASYNC
            // the fact that files from previous, failed operation are already there should have no effect
            fse.writeFileSync(path, 'xyz');
            
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // after successful write old files should disappear
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
                done();
            });
        });
        
        it('writes file safely after rubbish from unsuccessful previous write attempt', function (done) {
            // SYNC
            // the fact that files from previous, failed operation are already there should have no effect
            fse.writeFileSync(newPath, 'new');
            fse.writeFileSync(bakPath, 'bak');
            
            internalFile.write(path, 'abc', { safe: true });
            
            expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
            // NEW file should disappear after successful attempt.
            expect(fse.existsSync(newPath)).toBe(false);
            // This file should stay there, the code didn't knew it is there, because it not renamed
            // the MAIN file to BAK. It doesn't matter because correctly written MAIN file is there.
            expect(fse.existsSync(bakPath)).toBe(true);
            
            // ASYNC
            // the fact that files from previous, failed operation are already there should have no effect
            fse.writeFileSync(newPath, 'new');
            fse.writeFileSync(bakPath, 'bak');
            
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // NEW file should disappear after successful attempt.
                expect(fse.existsSync(newPath)).toBe(false);
                // This file should stay there, the code didn't knew it is there, because it not renamed
                // the MAIN file to BAK. It doesn't matter because correctly written MAIN file is there.
                expect(fse.existsSync(bakPath)).toBe(false);
                done();
            });
        });
        
        it('totally nuts case when all files are there', function (done) {
            // SYNC
            // NEW, BAK and MAIN files present, just for sake of argument ;)
            fse.writeFileSync(path, 'xyz');
            fse.writeFileSync(newPath, 'new');
            fse.writeFileSync(bakPath, 'bak');
            
            internalFile.write(path, 'abc', { safe: true });
            
            expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
            // after successful write temp files should disappear
            expect(fse.existsSync(newPath)).toBe(false);
            expect(fse.existsSync(bakPath)).toBe(false);
            
            // ASYNC
            // NEW, BAK and MAIN files present, just for sake of argument ;)
            fse.writeFileSync(path, 'xyz');
            fse.writeFileSync(newPath, 'new');
            fse.writeFileSync(bakPath, 'bak');
            
            internalFile.writeAsync(path, 'abc', { safe: true })
            .then(function () {
                expect(fse.readFileSync(path, { encoding: 'utf8' })).toBe('abc');
                // after successful write old files should disappear
                expect(fse.existsSync(newPath)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
                done();
            });
        });
        
        it("reads file from bak location if main file doesn't exist", function (done) {
            // SYNC
            fse.writeFileSync(bakPath, 'bak');
            var content = internalFile.read(path, { safe: true });
            expect(content).toBe('bak');
            
            // ASYNC
            fse.writeFileSync(bakPath, 'bak');
            internalFile.readAsync(path, { safe: true })
            .then(function (content) {
                expect(content).toBe('bak');
                done();
            });
        });
        
        it("reads file from main location if both files exist", function (done) {
            // SYNC
            fse.writeFileSync(path, 'abc');
            fse.writeFileSync(bakPath, 'bak');
            var content = internalFile.read(path, { safe: true });
            expect(content).toBe('abc');
            
            // ASYNC
            fse.writeFileSync(path, 'abc');
            fse.writeFileSync(bakPath, 'bak');
            internalFile.readAsync(path, { safe: true })
            .then(function (content) {
                expect(content).toBe('abc');
                done();
            });
        });
        
        it("throws if neither of those two files exist", function (done) {
            // SYNC
            try {
                internalFile.read(path, { safe: true });
                throw 'To make sure this code will throw.';
            } catch(err) {
                if (err.code !== 'ENOENT') {
                    throw 'Not that error!';
                }
            }
            
            // ASYNC
            internalFile.readAsync(path, { safe: true })
            .catch(function (err) {
                expect(err.code).toEqual("ENOENT");
                done();
            });
        });
        
        it('removes also bak file if present', function (done) {
            // SYNC
            fse.writeFileSync(path, 'abc');
            fse.writeFileSync(bakPath, 'bak');
            
            internalFile.remove(path, { safe: true });
            
            expect(fse.existsSync(path)).toBe(false);
            expect(fse.existsSync(bakPath)).toBe(false);
            
            // ASYNC
            fse.writeFileSync(path, 'abc');
            fse.writeFileSync(bakPath, 'bak');
            
            internalFile.removeAsync(path, { safe: true })
            .then(function () {
                expect(fse.existsSync(path)).toBe(false);
                expect(fse.existsSync(bakPath)).toBe(false);
                done();
            });
        });
        
        it('absence of bak file in safe mode does not cause any error', function (done) {
            // SYNC
            fse.writeFileSync(path, 'abc');
            
            internalFile.remove(path, { safe: true });
            
            expect(fse.existsSync(path)).toBe(false);
            
            // ASYNC
            fse.writeFileSync(path, 'abc');
            
            internalFile.removeAsync(path, { safe: true })
            .then(function () {
                expect(fse.existsSync(path)).toBe(false);
                done();
            });
        });
        
    });
    
});