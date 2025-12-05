module.exports = async function (request, response) {

    let catalogName = request.params.folder;
    let fileName = request.params.file;

    let catalogExists = await this.storage.catalogExists(catalogName);

    if (!catalogExists) {
        await this.storage.createCatalog(catalogName);
    }

    let catalogIsWritable = await this.storage.catalogIsWriteable(catalogName);

    if (!catalogIsWritable) {
        throw new Error(`Catalog '${catalogName}' is not writeable!`);
    }

    try {
        const multipart = await request.file();
        await this.storage.writeInCatalog(catalogName, fileName, multipart.file);
    } catch (error) {
        request.log.debug('Upload parse failed: ' + (error.message || error));
        return response.code(400).send({"error": 'Upload failed!'});
    }

    request.log.debug('Upload completed');
    return response.code(200).send({"success": true});
};
