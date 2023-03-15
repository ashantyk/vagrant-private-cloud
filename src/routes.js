const config = require('config');

const LIST_HANDER = require('./handler/list');
const DOWNLOAD_HANDER = require('./handler/download');
const UPLOAD_HANDER = require('./handler/upload');
const DELETE_HANDER = require('./handler/delete');
const AUTH_HANDLER = require('./handler/auth');

const WRITE_OPERATIONS_SECRET = config.get('upload.secret');

module.exports = [
    {
        method: 'HEAD',
        url: '/catalog/:folder/manifest.json',
        handler: (request, reply) => {
            reply.code(200).serializer(JSON.stringify).header("Content-Type", "application/json").send("");
        }
    },
    {
        method: 'HEAD',
        url: '/catalog/:folder',
        handler: (request, reply) => {
            reply.code(200).serializer(JSON.stringify).header("Content-Type", "application/json").send("");
        }
    },
    {
        method: 'GET',
        url: "/",
        handler: (request, response) => {
            response.code(403).send({error:"Invalid URL"});
        }
    },

    {
        method: 'GET',
        url: '/catalog/:folder/manifest.json',
        handler: LIST_HANDER
    },
    {
        method: 'GET',
        url: '/catalog/:folder',
        handler: LIST_HANDER
    },
    {
        method: 'GET',
        url: '/catalog/:folder/:file',
        handler: DOWNLOAD_HANDER
    },
    {
        method: 'POST',
        url: '/catalog/:folder/:file',
        config: {
            secret: WRITE_OPERATIONS_SECRET
        },
        preValidation: AUTH_HANDLER,
        handler: UPLOAD_HANDER
    },
    {
        method: 'DELETE',
        url: '/catalog/:folder/:file',
        config: {
            secret: WRITE_OPERATIONS_SECRET
        },
        preValidation: AUTH_HANDLER,
        handler: DELETE_HANDER
    }
];