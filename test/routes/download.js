const app = require('../../src/server.js');
const fs = require('fs/promises');
const config = require('config');
const assert  = require('assert');

const STORAGE_FOLDER = config.get('storage.path');
const SECRET = config.get('upload.secret');
const CATALOG_FOLDER = 'testFolder';
const CATALOG_FOLDER_FILE = 'testFile';
const DUMMY_FILE = './test/dummyFile.box';

describe('GET /catalog/:folder/:file', () => {

    let dummyFileContents = "";
    const headers = {
        authorization: 'Basic ' + Buffer.from("someUser:" + SECRET).toString('base64')
    };

    beforeAll(async () => {

        dummyFileContents = await fs.readFile(DUMMY_FILE, {encoding: 'utf-8'});

        await app.ready();

        const form = new FormData();
        form.append('box', new Blob([dummyFileContents]), 'dummy.box');

        const response = await app.inject({
            method: 'POST',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            headers: { ...headers, 'content-type': 'application/x-www-form-urlencoded' },
            payload: form
        });

        assert.strictEqual(response.statusCode, 200, 'Expected status code 200, got ' + response.statusCode);
        await fs.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, fs.constants.R_OK);

    });

    afterAll(async () => {
        await app.inject({
            method: 'DELETE',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            headers: headers
        });
        await app.close();
    });

    it('responds with file', async () => {
        const response = await app.inject({
            method: 'GET',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE
        });

        assert.strictEqual(response.statusCode, 200);
        assert.match(response.headers['content-type'], /binary\/octet-stream/);
        assert.strictEqual(response.headers['content-length'], dummyFileContents.length.toString());
        assert.strictEqual(response.body, dummyFileContents);
    });

    it('responds with 404 for invalid catalog', async () => {
        const response = await app.inject({
            method: 'GET',
            path: '/catalog/folderThatDoesntExist/' + CATALOG_FOLDER_FILE
        });

        assert.strictEqual(response.statusCode, 404);
    });

    it('responds with 404 for invalid catalog file', async () => {
        const response = await app.inject({
            method: 'GET',
            path: '/catalog/' + CATALOG_FOLDER + '/someInexistentFile'
        });

        assert.strictEqual(response.statusCode, 404);
    });

    it('responds with 206 for resuming download', async () => {
        const EXPECTED_RANGE_START = 0;
        const EXPECTED_CONTENT_LENGTH = 12;

        const response = await app.inject({
            method: 'GET',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            headers: {
                range: `bytes=${EXPECTED_RANGE_START}-${EXPECTED_CONTENT_LENGTH-1}`
            }
        });

        assert.strictEqual(response.statusCode, 206);
        assert.match(response.headers['content-type'], /binary\/octet-stream/);
        assert.strictEqual(response.headers['content-length'], EXPECTED_CONTENT_LENGTH.toString());
        assert.strictEqual(response.body, dummyFileContents.substr(EXPECTED_RANGE_START, EXPECTED_CONTENT_LENGTH));
    });

    it('responds with 416 for invalid ranges (exceeded end range)', async () => {
        const response = await app.inject({
            method: 'GET',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            headers: {
                range: `bytes=0-${dummyFileContents.length}`
            }
        });

        assert.strictEqual(response.statusCode, 416);
    });

    it('responds with 416 for invalid ranges (exceeded start range)', async () => {
        const response = await app.inject({
            method: 'GET',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            headers: {
                range: `bytes=${dummyFileContents.length+1}-${dummyFileContents.length-1}`
            }
        });

        assert.strictEqual(response.statusCode, 416);
    });

    it('responds with 416 for invalid ranges (range start > end)', async () => {
        const response = await app.inject({
            method: 'GET',
            path: '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE,
            headers: {
                range: `bytes=10-9`
            }
        });

        assert.strictEqual(response.statusCode, 416);
    });

});

