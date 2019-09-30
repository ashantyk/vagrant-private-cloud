const server = require('fastify');
const serverStaticPlugin = require('fastify-static');
const storagePlugin = require('./plugins/storage.js');
const multipartPlugin = require('fastify-multipart');
const config = require('config');
const path = require('path');
const routes = require('./routes.js');

const SERVER_HOST = config.get('server.host');
const SERVER_PORT = config.get('server.port');
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

fastify.register(serverStaticPlugin, {
    root: path.join(__dirname, "../" , STORAGE_FOLDER),
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

fastify.listen(SERVER_PORT, SERVER_HOST);

module.exports = fastify;