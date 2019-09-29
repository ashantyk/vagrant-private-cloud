const request = require('supertest');
const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs');
const assert = require('assert');

const CATALOG_PATH = config.get('storage.path');
const CATALOG_FOLDER = 'testFolder';
const CATALOG_FOLDER_FILE = 'virtualbox-2019.09.27.box';
const CATALOG_FOLDER_FILE_CONTENTS = 'randomBytesData';

describe('GET /catalog/:folder', function() {

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

    it('responds with listing', function(done) {

        request(app)
            .get('/catalog/' + CATALOG_FOLDER)
            //.expect('Content-Type', /application\/json/)
            .expect(200, function(error, response){
                debugger;
                assert.equal(error, null);
                done();
            });

    });

    it('responds with 404 for invalid catalog', function(done) {

        request(app)
            .get('/catalog/folderThatDoesntExist')
            .expect(404, done);

    });


});