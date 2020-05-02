module.exports = async function (request, response) {

    let catalogName = request.params.folder;
    let fileName = request.params.file;

    let catalogExists = await this.storage.catalogExists(catalogName);

    if (!catalogExists) {
        return response.code(404).send({"error": "Catalog does not exist!"});
    }

    let fileExists = await this.storage.fileExists(catalogName, fileName);

    if (!fileExists) {
        return response.code(404).send({"error": "File does not exist in catalog!"});
    }

    let fileSize = await this.storage.getFileSizeFromCatalog(catalogName, fileName);
    let fileStream = await this.storage.getFileStreamFromCatalog(catalogName, fileName);

    return response
        .type('binary/octet-stream')
        .header('Content-Length', fileSize)
        .code(200)
        .send(fileStream);

};