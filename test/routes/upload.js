const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs/promises');
const assert = require('assert');

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');
const DUMMY_FILE = './test/dummyFile.box';

describe('POST /catalog/:folder/:file', () => {

    let dummyPayload = new FormData();
    const headers = {
        authorization: 'Basic ' + Buffer.from("someUser:" + SECRET).toString('base64')
    };

    beforeAll(async () => {
        await app.ready();
        const dummyFileContents = await fs.readFile(DUMMY_FILE, {encoding: 'utf-8'});
        dummyPayload.append('box', new Blob([dummyFileContents]), 'dummy.box');
    });

    afterAll(async () => {
        try {
            await fs.unlink(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE);
            await fs.rmdir(STORAGE_FOLDER + '/' + CATALOG_FOLDER);
        } catch (error) {
            // ignore
        }
    });

    it('responds with OK message', async () => {

        const response = await app.inject({
            method: 'POST',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            headers: headers,
            payload: dummyPayload
        });

        assert.equal(response.statusCode, 200);
        await fs.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, fs.constants.R_OK);

        const localPath = __dirname + '/../dummyFile.box'
        const serverPath = __dirname + '/../../storage/' + CATALOG_FOLDER + '/' + CATALOG_FOLDER_FILE;

        const localStat = await fs.stat(localPath);
        const serverStat = await fs.stat(serverPath);
        assert.ok(serverStat.size !== 0, 'Uploaded file size should not be zero');
        assert.ok(serverStat.size === localStat.size, 'Uploaded file size should math original file size');

    });

    it('responds with 401 when no auth is set', async () => {
        const response = await app.inject({
            method: 'POST',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            payload: dummyPayload
        });

        assert.equal(response.statusCode, 401);
    });

    it('responds with 401 when wrong auth is set', async () => {
        const response = await app.inject({
            method: 'POST',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            payload: dummyPayload,
            headers: {
                authorization: 'Basic ' + Buffer.from("wrongUser:wrongSecret").toString('base64')
            }
        });

        assert.equal(response.statusCode, 401);
    });

});
