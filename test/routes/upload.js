const request = require('supertest');
const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs');
const assert = require('assert');

const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');

describe('POST /catalog/:folder/:file', function() {

    it('responds with OK message', function(done) {

        request(app.server)
            .post('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .auth(SECRET, SECRET)
            .attach('box', './test/dummyFile.box')
            .expect(200, done);

    });

});