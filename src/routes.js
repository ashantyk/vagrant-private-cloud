const config = require('config');

const LIST_HANDER = require('./handler/list');
const DOWNLOAD_HANDER = require('./handler/download');
const UPLOAD_HANDER = require('./handler/upload');
const DELETE_HANDER = require('./handler/delete');
const AUTH_HANDLER = require('./handler/auth');

module.exports = [
    {
        method: 'GET',
        url: "/",
        handler: (request, response) => {
            response.code(403).send({error:"Invalid URL"});
        }
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
            secret: config.get('upload.secret')
        },
        preValidation: AUTH_HANDLER,
        handler: UPLOAD_HANDER
    },
    {
        method: 'DELETE',
        url: '/catalog/:folder/:file',
        config: {
            secret: config.get('upload.secret')
        },
        preValidation: AUTH_HANDLER,
        handler: DELETE_HANDER
    }
];