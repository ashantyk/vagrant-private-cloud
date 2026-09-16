const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs/promises');
const assert  = require('assert');

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');

describe('DELETE /catalog/:folder/:file', () => {

    const headers = {
        authorization: 'Basic ' + Buffer.from("someUser:" + SECRET).toString('base64')
    };

    beforeAll(async () => {
        try {
            await fs.mkdir(STORAGE_FOLDER + '/' + CATALOG_FOLDER, {
                recursive: true,
            });
            await fs.copyFile('test/dummyFile.box', STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE)
        } catch (error) {
            // ignore
        }
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
        try {
            await fs.rmdir(STORAGE_FOLDER + '/' + CATALOG_FOLDER);
        } catch (error) {
            // ignore
        }
    });

    it('responds with 404 for invalid catalog name', async () => {
        const response = await app.inject({
            method: 'DELETE',
            path: '/catalog/invalidCatalogName/' + CATALOG_FOLDER_FILE,
            headers: headers
        });
        assert.equal(response.statusCode, 404);
    });

    it('responds with 404 for invalid file name', async () => {
        const response = await app.inject({
            method: 'DELETE',
            path: '/catalog/' + CATALOG_FOLDER + '/inexistentFileName',
            headers: headers
        });
        assert.equal(response.statusCode, 404);
    });

    it('responds with 200 for valid request', async () => {
        const response = await app.inject({
            method: 'DELETE',
            path: '/catalog/' + CATALOG_FOLDER + '/' + CATALOG_FOLDER_FILE,
            headers: headers
        });
        assert.equal(response.statusCode, 200);

        try {
            await fs.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + '/' + CATALOG_FOLDER_FILE, fs.constants.R_OK);
            throw new Error('File was not deleted!');
        } catch (error) {
            if (error.code !== 'ENOENT') {
                throw error;
            }
        }

    });

});
