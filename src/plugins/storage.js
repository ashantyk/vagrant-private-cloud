const fastifyPlugin = require('fastify-plugin');
const fs = require('fs');
const fsp = require('fs').promises;
const fsc = require('fs').constants;
const util = require('util');
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);
const crypto = require('crypto');

const BOX_FILENAME_PATTERN = /^(virtualbox|vmware|docker|hyperv)-([0-9\.]+)\.box$/;
const DEFAULT_HASH_TYPE = 'sha1';
const HASH_STORE = {};

class StorageHelper {

    constructor(fastify, options) {
        this.fastify = fastify;
        this.options = options;
    }

    async warmUp() {

        this.fastify.log.info("Warming up...");

        let catalogNames = await this.getCatalogNames();

        for (let catalogName of catalogNames) {

            let fileNames = await this.getCatalogFiles(catalogName);
            let catalogPath = this.getCatalogPath(catalogName);

            for (let fileName of fileNames) {
                HASH_STORE[path] = await this.computeFileHash(catalogPath + "/" + fileName);
            }

        }

        this.fastify.log.info("Warm-up done.");

    }

    getCatalogPath(catalogName) {
        return this.options.folder + "/" + catalogName;
    }

    async getCatalogNames() {

        let folderNames = await fsp.readdir(this.options.folder);
        let catalogNames = [];

        for (let folderName of folderNames) {

            let folderPath = this.options.folder + "/" + folderName;

            let stat = await fsp.stat(folderPath);

            if (!stat.isDirectory()) {
                continue;
            }

            catalogNames.push(folderName);

        }

        return catalogNames;

    }

    async catalogExists (catalogName) {
        let path = this.getCatalogPath(catalogName);
        try {
            await fsp.access(path, fsc.F_OK);
        } catch (error) {
            return false;
        }
        return true;
    }

    async fileExists (catalogName, fileName) {
        let path = this.getCatalogPath(catalogName) + "/" + fileName;
        try {
            await fsp.access(path, fsc.F_OK);
        } catch (error) {
            return false;
        }
        return true;
    }

    async getFileStreamFromCatalog(catalogName, fileName) {
        const path = this.getCatalogPath(catalogName) + "/" + fileName;
        return fs.createReadStream(path, {encoding: 'binary'})
    }

    async getFileSizeFromCatalog(catalogName, fileName) {
        const path = this.getCatalogPath(catalogName) + "/" + fileName;
        const stats = await fsp.stat(path);
        return stats.size;
    }

    async catalogIsWriteable (catalogName) {
        let path = this.getCatalogPath(catalogName);
        try {
            await fsp.access(path, fsc.W_OK);
        } catch (error) {
            return false;
        }
        return true;
    }

    async createCatalog (catalogName) {
        let path = this.getCatalogPath(catalogName);
        try {
            await fsp.mkdir(path);
        } catch (error) {
            return false;
        }
        return true;
    }

    async removeFromCatalog (catalogName, fileName) {
        let path = this.getCatalogPath(catalogName) + "/" + fileName;
        await fsp.unlink(path);
        delete HASH_STORE[path];
    }

    async deleteCatalog (catalogName) {

        if(!await this.catalogExists(catalogName)) {
            return false;
        }

        let path = this.getCatalogPath(catalogName);
        let fileNames = await fsp.readdir(path);

        for (let fileName of fileNames) {
            let filePath = path + "/" + fileName;
            await fsp.unlink(filePath);
            delete HASH_STORE[filePath];
        }

        await fsp.rmdir(path);

    }

    async getCatalogItems(catalogName) {

        let path = this.getCatalogPath(catalogName);
        let fileNames = await this.getCatalogFiles(catalogName);
        let items = [];

        for (let name of fileNames) {

            let filePath = path + "/" + name;

            if (typeof HASH_STORE[filePath] !== 'string') {
                continue;
            }

            let matches = BOX_FILENAME_PATTERN.exec(name);

            if (!matches || !matches.length || matches.length !== 3) {
                continue;
            }

            let [fileName, provider, version] = matches;

            items.push({
                file: fileName,
                provider: provider,
                version: version,
                hashType: DEFAULT_HASH_TYPE,
                hash: HASH_STORE[filePath]
            });

        }

        return items;
    }

    async getCatalogFiles(catalogName) {

        let path = this.getCatalogPath(catalogName);
        let fileNames = await fsp.readdir(path);
        let items = [];

        for (let name of fileNames) {

            let filePath = path + "/" + name;

            if (typeof HASH_STORE[filePath] !== 'string') {
                continue;
            }

            let stat = await fsp.stat(filePath);

            if (!stat.isFile()) {
                continue;
            }

            if (!BOX_FILENAME_PATTERN.test(name)) {
                continue;
            }

            items.push(name);

        }

        return items;
    }

    async writeInCatalog(catalogName, fileName, fileStream) {
        let path = this.getCatalogPath(catalogName) + "/" + fileName;
        let writeStream = fs.createWriteStream(path);
        await pipeline(fileStream, writeStream);
        HASH_STORE[path] = await this.computeFileHash(path);
    }

    computeFileHash(path) {

        return new Promise((resolve, reject) => {

            let hashSum = crypto.createHash(DEFAULT_HASH_TYPE);

            try {

                let stream = fs.ReadStream(path);

                stream.on('data', function (data) {
                    hashSum.update(data)
                });

                stream.on('end', function () {
                    const hash = hashSum.digest('hex');
                    return resolve(hash);
                });

                stream.on('error', function (error) {
                    return reject(error);
                })

            } catch (error) {
                return reject('Failed to calculate hash: ' + (error.message || error));
            }

        });

    }

}

module.exports = fastifyPlugin(async function storage (fastify, options) {
    let storagePlugin = new StorageHelper(fastify, options);
    await storagePlugin.warmUp();
    fastify.decorate('storage', storagePlugin);
}, {
    name: 'storage',
    fastify: '2.x',
});
