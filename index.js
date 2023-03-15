const config = require('config');
const server = require("./src/server.js");

const SERVER_HOST = config.get('server.host');
const SERVER_PORT = config.get('server.port');

server.listen({
    port: SERVER_PORT,
    host: SERVER_HOST
}).then((address) => {
    server.log.warn(`Server started listening on ${address}`);
}).catch(error => {
    server.log.error(error)
});
