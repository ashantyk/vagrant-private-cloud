const config = require('config');
const server = require("./src/server.js");

const SERVER_HOST = config.get('server.host');
const SERVER_PORT = config.get('server.port');

const start = async () => {
    try {
        const address = await server.listen({
            port: SERVER_PORT,
            host: SERVER_HOST,
        });
        server.log.info(`Server started listening on ${address}`);
        console.log(`Server started listening on ${address}`);
    } catch (error) {
        server.log.error(error);
        console.error(error);
        process.exit(1);
    }
}

start();
