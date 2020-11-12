const config = require('config');
const server = require("./src/server.js");

const SERVER_HOST = config.get('server.host');
const SERVER_PORT = config.get('server.port');

server.listen(SERVER_PORT, SERVER_HOST);
