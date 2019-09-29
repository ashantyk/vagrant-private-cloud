const LIST_HANDER = require('./handler/list');
const DOWNLOAD_HANDER = require('./handler/download');
const UPLOAD_HANDER = require('./handler/upload');
const AUTH_HANDLER = require('./handler/auth');
const config = require('config');

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
    }
];
//
// const express = require('express');
// const fs = require('fs');
// const config = require('config');
//
// const CATALOG_FOLDER = config.get('storage.path');
//
// module.exports = function(app) {
//
//     app.all('/catalog/:folder', function (request, response, next) {
//
//         fs.stat(CATALOG_FOLDER + "/" + request.params.folder, function(error, stats){
//
//             if (error) {
//                 response.status(404).json({"error": "Not found"});
//                 return next("Catalog not found!");
//             }
//
//             if (!stats.isDirectory()) {
//                 response.status(404).json({"error": "Not found"});
//                 return next("Catalog not found!");
//             }
//
//             next();
//
//         });
//
//     });
//
//     app.get('/catalog/:folder', require('./handler/list'));
//     app.post('/catalog/:folder', require('./handler/upload'));
//     app.get('/catalog/:folder/:file', function(request, response) {
//         request.url = "/" + request.params.file;
//         return express.static(CATALOG_FOLDER + "/" + request.params.folder).apply(this, arguments);
//     });
//
// };
