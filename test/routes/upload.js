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

describe('POST /catalog/:folder/:file', function() {

    it('responds with OK message', function(done) {

        const localPath = __dirname + '/../dummyFile.box'
        const serverPath = __dirname + '/../../storage/' + CATALOG_FOLDER + '/' + CATALOG_FOLDER_FILE;

        request(app.server)
            .post('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .auth(SECRET, SECRET)
            .attach('box', localPath)
            .expect(200, function(error, response) {
                fs.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, fs.constants.R_OK, (error) => {
                    if(error) {
                        return done(error);
                    }
                    const localStat = fs.statSync(localPath);
                    const serverStat = fs.statSync(serverPath);
                    assert.notEqual(serverStat.size, 0, "Uploaded file seems empty!");
                    assert.equal(serverStat.size, localStat.size, "Size does not match!");
                    done();
                });
            });

    });

    it('responds with 401 when no auth is set', function(done) {

        request(app.server)
            .post('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .attach('box', './test/dummyFile.box')
            .expect(401, done);

    });

    it('responds with 401 when wrong auth is set', function(done) {

        request(app.server)
            .post('/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
            .auth(SECRET + "wrong", SECRET + "wrong")
            .attach('box', './test/dummyFile.box')
            .expect(401, done);

    });

    after(async function(){
        try {
            await fsp.unlink(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE);
            await fsp.rmdir(STORAGE_FOLDER + '/' + CATALOG_FOLDER);
        } catch (error) {}
    })

});