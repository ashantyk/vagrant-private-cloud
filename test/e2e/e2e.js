const request = require('supertest');
const app = require('../../src/server.js');
const config = require('config');
const fs = require('fs');
const child_process = require('child_process');
const got = require('got');
const stream = require('stream');
const assert = require('assert');

const STORAGE_FOLDER = config.get('storage.path');
const CATALOG_FOLDER = "testFolder";
const CATALOG_FOLDER_FILE = "virtualbox-2019.09.29.box";
const SECRET = config.get('upload.secret');
const CATALOG_URL = '/catalog/' + CATALOG_FOLDER + "/manifest.json";
const BOX_URL = '/catalog/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE;
const CWD = __dirname;
const VAGRANT_FILE_PATH=CWD + "/Vagrantfile";
const ALPINE_BOX_URL="https://vagrantcloud.com/alpine/boxes/alpine64/versions/3.7.0/providers/virtualbox.box";
const ALPINE_BOX_PATH=CWD + "/alpine.box"

describe('End-to-end testing', function() {

    this.bail(true);
    this.timeout(30000);

    before((done) => {
        app.ready((error) => {
            if(error) {
                done(error);
            } else {
                cleanUp(done);
            }
        });
    });

    it("Download Alpine box (if necessary)", (done) => {
        if(fs.existsSync(ALPINE_BOX_PATH)) {
            return done();
        }
        stream.pipeline([
            got.stream(ALPINE_BOX_URL),
            fs.createWriteStream(ALPINE_BOX_PATH)
        ], done);
    });

    it("Upload Alpine box to Vagrant Private Cloud server", (done) => {
        // TODO: check if we really need to upload it
        request(app.server)
            .post(BOX_URL)
            .auth(SECRET, SECRET)
            .attach('box', ALPINE_BOX_PATH)
            .expect(200, function(error, response) {
                fs.accessSync(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE, fs.constants.R_OK);
                const localStat = fs.statSync(ALPINE_BOX_PATH);
                const serverStat = fs.statSync(STORAGE_FOLDER + '/' + CATALOG_FOLDER + "/" + CATALOG_FOLDER_FILE);
                assert.notEqual(serverStat.size, 0, "Uploaded file seems empty!");
                assert.equal(serverStat.size, localStat.size, "Size does not match!");
                done();
            });
    });

    it("Create Vagrantfile", async () => {
        if (!app.server.listening) {
            await app.listen(config.get('server.port'), config.get('server.host'));
        }
        await app.ready();
        const server = app.server.address();

        const content = `# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure("2") do |config|
    config.vm.box = "${CATALOG_FOLDER}"
    config.vm.box_url = "http://${server.address.replace("0.0.0.0", "127.0.0.1")}:${server.port}${CATALOG_URL}"
    config.vm.box_check_update = true
end
`;
        fs.writeFileSync(VAGRANT_FILE_PATH, content);
    });

    it("Run 'vagrant up'", (done) => {
        const result = child_process.exec(`vagrant up`, {cwd: CWD}, done);
    });

    after((done) => {
        cleanUp(done);
    });

});

const cleanUp = (callback) => {

    if (fs.existsSync(VAGRANT_FILE_PATH)) {
        fs.unlinkSync(VAGRANT_FILE_PATH);
    }

    const execOptions = {
        cwd: CWD
    };

    child_process.exec(`vagrant destroy --force`, execOptions ,(error) => {
        child_process.exec(`vagrant box remove ${CATALOG_FOLDER} --all --force`, execOptions, (error) => {
            callback();
        });
    });

};
