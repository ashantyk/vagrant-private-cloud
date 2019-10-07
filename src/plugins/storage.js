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

    /**
     * Class constructor
     *
     * @param {object} fastify
     * @param {object} options {
     *     @type {string} folder
     * }
     */
    constructor(fastify, options) {
        this.fastify = fastify;
        this.options = options;
    }

    /**
     * Storage warm-up - calculate hashes for catalog files at server start
     *
     * @returns {Promise<void>}
     */
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

    /**
     * Get relative file system path for a catalog folder
     *
     * @param {string} catalogName
     * @returns {string}
     */
    getCatalogPath(catalogName) {
        return this.options.folder + "/" + catalogName;
    }

    /**
     * Get available catalog names
     *
     * @returns {Promise<string[]>}
     */
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

    /**
     * Check if catalog exists
     *
     * @param {string} catalogName
     * @returns {Promise<boolean>}
     */
    async catalogExists (catalogName) {
        let path = this.getCatalogPath(catalogName);
        try {
            await fsp.access(path, fsc.F_OK);
        } catch (error) {
            return false;
        }
        return true;
    }

    /**
     * Check if file exists in catalog
     *
     * @param {string} catalogName
     * @param {string} fileName
     * @returns {Promise<boolean>}
     */
    async fileExists (catalogName, fileName) {
        let path = this.getCatalogPath(catalogName) + "/" + fileName;
        try {
            await fsp.access(path, fsc.F_OK);
        } catch (error) {
            return false;
        }
        return true;
    }

    /**
     * Get ReadStream from a catalog file
     *
     * @param {string} catalogName
     * @param {string} fileName
     * @returns {Promise<ReadStream>}
     */
    async getFileStreamFromCatalog(catalogName, fileName) {
        const path = this.getCatalogPath(catalogName) + "/" + fileName;
        return fs.createReadStream(path, {encoding: 'binary'})
    }

    /**
     * Get size for a catalog file
     *
     * @param {string} catalogName
     * @param {string} fileName
     * @returns {Promise<number>}
     */
    async getFileSizeFromCatalog(catalogName, fileName) {
        const path = this.getCatalogPath(catalogName) + "/" + fileName;
        const stats = await fsp.stat(path);
        return stats.size;
    }

    /**
     * Check if  catalog is writeable
     *
     * @param {string} catalogName
     * @returns {Promise<boolean>}
     */
    async catalogIsWriteable (catalogName) {
        let path = this.getCatalogPath(catalogName);
        try {
            await fsp.access(path, fsc.W_OK);
        } catch (error) {
            return false;
        }
        return true;
    }

    /**
     * Create catalog
     *
     * @param {string} catalogName
     * @returns {Promise<boolean>}
     */
    async createCatalog (catalogName) {
        let path = this.getCatalogPath(catalogName);
        try {
            await fsp.mkdir(path);
        } catch (error) {
            return false;
        }
        return true;
    }

    /**
     * Remove file from catalog
     *
     * @param {string} catalogName
     * @param {string} fileName
     * @returns {Promise<void>}
     */
    async removeFromCatalog (catalogName, fileName) {
        let path = this.getCatalogPath(catalogName) + "/" + fileName;
        await fsp.unlink(path);
        delete HASH_STORE[path];
    }

    /**
     * Delete entire catalog
     *
     * @param {string} catalogName
     * @returns {Promise<boolean>}
     */
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

    /**
     * Get catalog items
     *
     * @param {string} catalogName
     * @returns {Promise<object[]>}
     */
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

    /**
     * Get catalog file names
     *
     * @param {string} catalogName
     * @returns {Promise<string[]>}
     */
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

    /**
     * Write file in catalog using a file stream
     *
     * @param {string} catalogName
     * @param {string} fileName
     * @param {ReadableStream} fileStream
     * @returns {Promise<void>}
     */
    async writeInCatalog(catalogName, fileName, fileStream) {
        let path = this.getCatalogPath(catalogName) + "/" + fileName;
        let writeStream = fs.createWriteStream(path);
        await pipeline(fileStream, writeStream);
        HASH_STORE[path] = await this.computeFileHash(path);
    }

    /**
     * Compute hash (sha1) for a file
     *
     * @param {string} path
     * @returns {Promise<string>}
     */
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
