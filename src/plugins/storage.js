const fastifyPlugin = require('fastify-plugin');
const fs = require('fs');
const fsp = require('fs').promises;
const fsc = require('fs').constants;
const pump = require('pump-promise');

class StorageHelper {

    constructor(fastify, options) {
        this.fastify = fastify;
        this.options = options;
    }

    getCatalogPath(catalogName) {
        return this.options.folder + "/" + catalogName;
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
    }

    async deleteCatalog (catalogName) {
        let path = this.getCatalogPath(catalogName);
        // TODO
        // remove individual files
        // remove folder

    }

    async getCatalogItems(catalogName) {
        return [];
        // TODO
    }

    async writeInCatalog(catalogName, fileName, fileStream) {
        let path = this.getCatalogPath(catalogName) + "/" + fileName;
        let writeStream = fs.createWriteStream(path);
        await pump(fileStream, writeStream);
    }

}

module.exports = fastifyPlugin(async function storage (fastify, options) {
    fastify.decorate('storage', new StorageHelper(fastify, options));
});