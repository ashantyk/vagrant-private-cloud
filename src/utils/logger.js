const winston = require('winston');
const config = require('config');

const LOGGER_LEVEL = config.get('logger.level');
const LOGGER_FILE = config.get('logger.file');

const logger = winston.createLogger({
    level: LOGGER_LEVEL,
    format: winston.format.json(),
    transports: []
});

if (process.env.NODE_ENV !== 'test') {
    logger.add(new winston.transports.File({
        filename: LOGGER_FILE
    }));
}

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

module.exports = logger;
