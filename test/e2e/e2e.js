const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs');
const child_process = require('child_process');
const stream = require('stream');
const assert = require("assert");
const path = require('path');

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');
const CATALOG_URL = '/catalog/' + CATALOG_FOLDER + "/manifest.json";
const BOX_URL = '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE;
const CWD = __dirname;
const VAGRANT_FILE_PATH = path.resolve(CWD + "/Vagrantfile");
const ALPINE_BOX_URL = "https://vagrantcloud.com/alpine/boxes/alpine64/versions/3.7.0/providers/virtualbox.box";
const ALPINE_BOX_PATH = path.resolve(CWD + "/alpine.box");
const SERVER_HOST = config.get('server.host');
const SERVER_PORT = config.get('server.port');

describe('End-to-end testing', () => {

    jest.setTimeout(60_000);

    beforeAll(async () => {
        await app.listen({
            port: SERVER_PORT,
            host: SERVER_HOST,
        });
        await cleanUp();
    });

    it("Download Alpine box (if necessary)", async () => {
        if(fs.existsSync(ALPINE_BOX_PATH)) {
            return; // exit method if file already exist
        }

        const response = await fetch(ALPINE_BOX_URL);
        const writeStream = fs.createWriteStream(ALPINE_BOX_PATH);
        await stream.promises.finished(stream.Readable.fromWeb(response.body).pipe(writeStream));
    });

    it("Upload Alpine box to Vagrant Private Cloud server", async () => {

        const payload = new FormData();
        payload.append('box', await fs.openAsBlob(ALPINE_BOX_PATH), 'alpine.box');

        const headers = {
            authorization: 'Basic ' + Buffer.from("someUser:" + SECRET).toString('base64')
        };

        const response = await app.inject({
            method: 'POST',
            path: BOX_URL,
            payload: payload,
            headers: { ...headers, 'content-type': 'application/x-www-form-urlencoded' },
        });

        assert.equal(response.statusCode, 200);
        await fs.promises.access(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, fs.constants.R_OK);
        const localStat = await fs.promises.stat(ALPINE_BOX_PATH);
        const serverStat = await fs.promises.stat(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE);
        assert.ok(serverStat.size !== 0, 'Uploaded file size should not be zero');
        assert.ok(serverStat.size === localStat.size, 'Uploaded file size should math original file size');
    });

    it("Create Vagrantfile", async () => {

        const address = app.server.address();

        if (!address) {
            throw new Error('Failed to detect server address');
        }

        const content = `# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure("2") do |config|
    config.vm.box = "${CATALOG_FOLDER}"
    config.vm.box_url = "http://${address.address.replace("0.0.0.0", "127.0.0.1")}:${SERVER_PORT}${CATALOG_URL}"
    config.vm.box_check_update = true
end
`;
        await fs.promises.writeFile(VAGRANT_FILE_PATH, content);
    });

    it('Test catalog URL', async () => {

        const address = app.server.address();

        if (!address) {
            throw new Error('Failed to detect server address');
        }

        const catalogUrl = `http://${address.address.replace("0.0.0.0", "127.0.0.1")}:${SERVER_PORT}${CATALOG_URL}`
        const response = await fetch(catalogUrl);
        const data = await response.json();

        if (!data?.versions?.length) {
            throw new Error('No boxes found for catalog URL');
        }

    });

    it("Run 'vagrant up'", () => {
        return new Promise((resolve, reject) => {
            const result = child_process.exec(`vagrant up`, {cwd: CWD}, (error, stdout, stderr) => {
                if (error) {
                    reject(new Error(stderr));
                } else {
                    resolve();
                }
            });
        });
    });

    afterAll(async () => {
        if (app.server.address()) {
            await app.close();
        }
        await cleanUp();
    });

});

const cleanUp = async () => {

    if (fs.existsSync(VAGRANT_FILE_PATH)) {
        fs.unlinkSync(VAGRANT_FILE_PATH);
    }

    const execOptions = {
        cwd: CWD
    };

    try {
        child_process.execSync(`vagrant destroy --force`, execOptions);
    } catch (error) {
        // do nothing
    }

    try {
        child_process.execSync(`vagrant box remove ${CATALOG_FOLDER} --all --force`, execOptions);
    } catch (error) {
        // do nothing
    }

};
