const express = require('express');
const fs = require('fs');
const config = require('config');

const CATALOG_FOLDER = config.get('storage.path');

module.exports = function(app) {

    app.all('/catalog/:folder', function (request, response, next) {

        fs.stat(CATALOG_FOLDER + "/" + request.params.folder, function(error, stats){

            if (error) {
                response.status(404).json({"error": "Not found"});
                return next("Catalog not found!");
            }

            if (!stats.isDirectory()) {
                response.status(404).json({"error": "Not found"});
                return next("Catalog not found!");
            }

            next();

        });

    });

    app.get('/catalog/:folder', require('./handler/list'));
    app.post('/catalog/:folder', require('./handler/upload'));
    app.get('/catalog/:folder/:file', function(request, response) {
        request.url = "/" + request.params.file;
        return express.static(CATALOG_FOLDER + "/" + request.params.folder).apply(this, arguments);
    });

};
