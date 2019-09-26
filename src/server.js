const express = require('express');
const config = require('config');
const logger = require('./utils/logger.js');
const router = require('./router.js');

const SERVER_HOST = config.get('server.host');
const SERVER_PORT = config.get('server.port');

const app = express();

router(app);

app.set("x-powered-by", false);

app.listen(SERVER_PORT, SERVER_HOST, function(){
    logger.debug(`Service started on ${SERVER_HOST}:${SERVER_PORT}`);
});
