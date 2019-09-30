const request = require('supertest');
const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs');
const assert = require('assert');

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');

describe('GET /catalog/:folder', function() {

    before(function(done){

        request(app.server)
            .post('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .auth(SECRET, SECRET)
            .attach('box', './test/dummyFile.box')
            .expect(200, function(error, response){
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

    it('responds with 404 for invalid catalog', function(done) {

        request(app.server)
            .get('/catalog/folderThatDoesntExist')
            .expect('Content-Type', /application\/json/)
            .expect(404, done);

    });

    it('responds with listing', function(done) {

        request(app.server)
            .get('/catalog/' + CATALOG_FOLDER)
            .expect('Content-Type', /application\/json/)
            .expect(200, function(error, response){
                assert.equal(error, null);
                done();
            });

    });

});