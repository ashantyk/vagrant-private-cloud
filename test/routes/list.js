const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs/promises');
const assert = require("assert");

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29-2.box";
const SECRET = config.get('upload.secret');

describe('GET /catalog/:folder', () => {

    let dummyFileContents = "";
    const headers = {
        authorization: 'Basic ' + Buffer.from("someUser:" + SECRET).toString('base64')
    };

    beforeAll(async () => {

        await app.ready();

        dummyFileContents = await fs.readFile('./test/dummyFile.box', {encoding: 'utf-8'});

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

    it('responds with 404 for invalid catalog', async () => {
        const response = await app.inject({
            method: 'GET',
            path: '/catalog//folderThatDoesntExist',
        });
        assert.equal(response.statusCode, 404);
    });

    it('responds with listing', async () => {

        const response = await app.inject({
            method: 'GET',
            path: '/catalog/' + CATALOG_FOLDER,
        });

        assert.equal(response.statusCode, 200);
        assert.match(response.headers['content-type'], /application\/json/);

        const body = JSON.parse(response.body);
        assert.equal(body.name, CATALOG_FOLDER);
        assert.ok(Array.isArray(body.versions), '"versions" must be an array"')
        assert.equal(body.versions.length, 1);

        const versionPackage = body.versions.pop();
        assert.equal(versionPackage.version, "2019.09.29-2");
        assert.ok(Array.isArray(versionPackage.providers), '"providers" must be an array"')
        assert.equal(versionPackage.providers.length, 1);

        const box = versionPackage.providers.pop();
        assert.equal(box.name, 'virtualbox');
        assert.equal(box.checksum_type, 'sha1');
        assert.equal(box.checksum, '57c477904efee53b94c5d9b282a616dbf148423c');

        const packageUrl = new URL(box.url);
        assert.ok(packageUrl.pathname.indexOf(CATALOG_FOLDER) !== -1);
        assert.ok(packageUrl.pathname.indexOf(CATALOG_FOLDER_FILE) !== -1);

    });

});

