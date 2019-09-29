const request = require('supertest');
const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs');
const assert = require('assert');

const CATALOG_PATH = config.get('storage.path');
const CATALOG_FOLDER = 'testFolder';
const CATALOG_FOLDER_FILE = 'testFile';
const CATALOG_FOLDER_FILE_CONTENTS = 'test';

describe('GET /catalog/:folder/:file', function() {

    before(function(){

        try {
            fs.mkdirSync(CATALOG_PATH + "/" + CATALOG_FOLDER);
        } catch (error) {
            if (error.code !== "EEXIST") {
                throw error;
            }
        }

        fs.writeFileSync(CATALOG_PATH + "/" + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, CATALOG_FOLDER_FILE_CONTENTS);

    });

    after(function(){
        fs.unlinkSync(CATALOG_PATH + "/" + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE);
        fs.rmdirSync(CATALOG_PATH + "/" + CATALOG_FOLDER);
    });

    it('responds with file', function(done) {

        request(app)
            .get('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .expect('Content-Type', /application\/octet-stream/)
            .expect('Content-Length', CATALOG_FOLDER_FILE_CONTENTS.length.toString())
            .expect(200, function(error, response){
                assert.equal(error, null);
                assert.equal(response.body.toString(), CATALOG_FOLDER_FILE_CONTENTS);
                done();
            });

    });

    it('responds with 404 for invalid catalog', function(done) {

        request(app)
            .get('/catalog/folderThatDoesntExist/' + CATALOG_FOLDER_FILE)
            .expect(404, done);

    });

    it('responds with 404 for invalid catalog file', function(done) {

        request(app)
            .get('/catalog/' + CATALOG_FOLDER + '/someInexistentFile')
            .expect(404, done);

    });

});