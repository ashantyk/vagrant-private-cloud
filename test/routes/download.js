const request = require('supertest');
const app = require('../../src/server.js');
const fs = require('fs');
const assert = require('assert');
const config = require('config');

const STORAGE_FOLDER = config.get('storage.path');
const SECRET = config.get('upload.secret');
const CATALOG_FOLDER = 'testFolder';
const CATALOG_FOLDER_FILE = 'testFile';
const DUMMY_FILE = './test/dummyFile.box';
const DUMMY_FILE_CONTENTS = fs.readFileSync(DUMMY_FILE, {encoding: 'utf-8'});

describe('GET /catalog/:folder/:file', function() {

    before(function(done){

        request(app.server)
            .post('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .auth(SECRET, SECRET)
            .attach('box', DUMMY_FILE)
            .expect(200, function(error, response) {
                fs.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, fs.constants.R_OK, function(error){
                    done(error || undefined);
                });
            });

    });

    after(function(done){

        request(app.server)
            .delete('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .auth(SECRET, SECRET)
            .expect(200, done);

    });

    it('responds with file', function(done) {

        request(app.server)
            .get('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .expect('Content-Type', /binary\/octet-stream/)
            .expect('Content-Length', DUMMY_FILE_CONTENTS.length.toString())
            .expect(200, function(error, response){
                assert.equal(error, null);
                assert.equal(response.text || response.body.toString(), DUMMY_FILE_CONTENTS);
                done();
            });

    });

    it('responds with 404 for invalid catalog', function(done) {

        request(app.server)
            .get('/catalog/folderThatDoesntExist/' + CATALOG_FOLDER_FILE)
            .expect(404, done);

    });

    it('responds with 404 for invalid catalog file', function(done) {

        request(app.server)
            .get('/catalog/' + CATALOG_FOLDER + '/someInexistentFile')
            .expect(404, done);

    });

});