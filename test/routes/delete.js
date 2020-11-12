const request = require('supertest');
const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs');
const fsp = require('fs').promises;
const assert = require('assert');

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');

describe('DELETE /catalog/:folder/:file', function() {

    before(async function(){
        try {
            await fsp.mkdir(STORAGE_FOLDER + '/' + CATALOG_FOLDER);
            await fsp.copyFile('test/dummyFile.box', STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
        } catch (error) {

        }
        await app.ready();
    });



    it('responds with 404 for invalid catalog name', function(done) {

        request(app.server)
            .delete('/catalog/invalidCatalogName/' + CATALOG_FOLDER_FILE)
            .auth(SECRET, SECRET)
            .expect(404, done);

    });

    it('responds with 404 for invalid file name', function(done) {

        request(app.server)
            .delete('/catalog/' + CATALOG_FOLDER + '/inexistentFileName')
            .auth(SECRET, SECRET)
            .expect(404, done);

    });


    it('responds with 200 for valid request', function(done) {

        request(app.server)
            .delete('/catalog/' + CATALOG_FOLDER + '/' + CATALOG_FOLDER_FILE)
            .auth(SECRET, SECRET)
            .expect(200, async function (error, response) {
                try {
                    await fsp.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + '/' + CATALOG_FOLDER_FILE, fs.constants.R_OK);
                } catch (error) {
                    if (error.code === 'ENOENT') {
                        return done();
                    } else {
                        return done(error.message);
                    }
                }
                done("File was not deleted!");
            });

    });

    after(async function() {
        try {
            await fsp.rmdir(STORAGE_FOLDER + '/' + CATALOG_FOLDER);
        } catch (error) {}
    });

});