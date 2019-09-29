const pump = require('pump');
const fs = require('fs');
const config = require('config');

const STORAGE_FOLDER = config.get('storage.path');

module.exports = async function (request, response) {

    let catalogName = request.params.folder;
    let fileName = request.params.file;

    const callback = function (error) {
        if (error) {
            request.log.debug('Upload failed: ' + (error.message || error));
            response.code(400).send({"error": 'Upload failed!'});
        } else {
            request.log.debug('Upload completed');
            response.code(200).send({"success": true});
        }
    };

    const handler = function(field, fileStream, filename, encoding, mimetype) {

        let diskFolderPath = STORAGE_FOLDER + "/" + catalogName;
        let diskFilePath = diskFolderPath + "/" + filename;

        pump(fileStream, fs.createWriteStream(diskFilePath), callback);

    };

    request.multipart(handler, callback);

};