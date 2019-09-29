const fastifyPlugin = require('fastify-plugin');

const CATALOG_PREFIX = 'vagrant:catalog:';
const CATALOG_ITEM_PREFIX = 'vagrant:catalog_item:';

class DatabaseHelper {

    constructor(fastify) {
        this.fastify = fastify;
    }

    async catalogExists (catalogName) {
        let exists = await this.fastify.redis.get(CATALOG_PREFIX + catalogName);
        return !!exists;
    }

    async getCatalogItems (catalogName) {
        let keys = await this.fastify.redis.keys(CATALOG_ITEM_PREFIX + catalogName + ":*");

        debugger;
    }

}

module.exports = fastifyPlugin(async function storage (fastify, options) {
    fastify.decorate('db', new DatabaseHelper(fastify, options));
});