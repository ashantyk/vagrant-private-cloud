const pump = require('pump');
const fs = require('fs').promises;
const config = require('config');

const STORAGE_FOLDER = config.get('storage.path');

module.exports = async function (request, response) {

    let catalogName = request.params.folder;
    let fileName = request.params.file;
    let fastify = this;

    const callback = function (error) {
        if (error) {
            request.log.debug('Upload failed: ' + (error.message || error));
            response.code(400).send({"error": 'Upload failed!'});
        } else {
            request.log.debug('Upload completed');
            response.code(200).send({"success": true});
        }
    };

    const handler = async function(field, fileStream, filename, encoding, mimetype) {

        let exists = await fastify.storage.catalogExists(catalogName);

        if (!exists) {
            await fastify.storage.createCatalog(catalogName);
        }

        let writable = fastify.storage.catalogIsWriteable(catalogName);

        if (!writable) {
            throw new Error(`Catalog '${catalogName}' is not writeable!`);
        }

        await fastify.storage.writeInCatalog(catalogName, fileName, fileStream);

    };

    request.multipart(handler, callback);
    return false;

};