const express = require('express');
const config = require('config');
const logger = require('./utils/logger.js');
const router = require('./router.js');
const cache = require('./utils/cache.js');

const SERVER_HOST = config.get('server.host');
const SERVER_PORT = config.get('server.port');

cache.warmUp();

const app = express();

// set routes
router(app);

app.set("x-powered-by", false);

app.listen(SERVER_PORT, SERVER_HOST, function(){
    logger.debug(`Service started on ${SERVER_HOST}:${SERVER_PORT}`);
});

module.exports = app;