const request = require('supertest');
const app = require('../../src/server.js');
const config = require('config');
const url = require('url');
const fs = require('fs');
const assert = require('assert');

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');

describe('GET /catalog/:folder', function() {

    before(function(done){

        app.ready((error) => {

            if (error) {
                return done(error);
            }

            request(app.server)
                .post('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
                .auth(SECRET, SECRET)
                .attach('box', './test/dummyFile.box')
                .expect(200, function (error, response) {
                    fs.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, fs.constants.R_OK, function (error) {
                        done(error || undefined);
                    });
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

                assert.equal(response.body.name, CATALOG_FOLDER);
                assert.equal(Array.isArray(response.body.versions), true);
                assert.equal(response.body.versions.length, 1);

                let versionPackage = response.body.versions[0];

                assert.equal(versionPackage.version, "2019.09.29");
                assert.equal(Array.isArray(versionPackage.providers), true);
                assert.equal(versionPackage.providers.length, 1);

                let box = versionPackage.providers[0];
                assert.equal(box.name, 'virtualbox');
                assert.equal(box.checksum_type, 'sha1');
                assert.equal(box.checksum, '57c477904efee53b94c5d9b282a616dbf148423c');
                let packageUrl = url.parse(box.url);
                assert.equal(packageUrl.path.indexOf(CATALOG_FOLDER) !== -1, true);
                assert.equal(packageUrl.path.indexOf(CATALOG_FOLDER_FILE) !== -1, true);

                done();

            });

    });

});