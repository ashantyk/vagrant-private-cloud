const server = require('fastify');
const multipartPlugin = require('fastify-multipart');
const storagePlugin = require('./plugins/storage.js');
const config = require('config');
const routes = require('./routes.js');

const LOGGER_LEVEL = config.get('logger.level');
const LOGGER_FILE = config.get('logger.file');
const STORAGE_FOLDER = config.get('storage.path');
const UPLOAD_MAX_FILE_SIZE = config.get('upload.maxSize');

const fastify = server({
    logger: {
        level: LOGGER_LEVEL,
        file: LOGGER_FILE
    },
    ignoreTrailingSlash: true,
    disableRequestLogging: LOGGER_LEVEL !== 'debug',
    modifyCoreObjects: false
});

fastify.register(storagePlugin, {
    folder: STORAGE_FOLDER
});

fastify.register(multipartPlugin, {
    limits: {
        fieldNameSize: 10,    // Max field name size in bytes
        fieldSize: 30,        // Max field value size in bytes
        fields: 2,            // Max number of non-file fields
        fileSize: UPLOAD_MAX_FILE_SIZE, // For multipart forms, the max file size
        files: 1,             // Max number of file fields
        headerPairs: 50       // Max number of header key=>value pairs
    }
});

routes.forEach((route) => {
    fastify.route(route);
});

module.exports = fastify;
