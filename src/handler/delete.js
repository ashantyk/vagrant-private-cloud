module.exports = async function (request, response) {

    let catalogName = request.params.folder;
    let fileName = request.params.file;

    let catalogExists = await this.storage.catalogExists(catalogName);

    if (!catalogExists) {
        return response.code(404).send({"error": "Catalog does not exist!"});
    }

    let catalogIsWriteable = this.storage.catalogIsWriteable(catalogName);

    if (!catalogIsWriteable) {
        return response.code(403).send({"error": "Catalog is not writeable!"});
    }

    let fileExists = await this.storage.fileExists(catalogName, fileName);

    if (!fileExists) {
        return response.code(404).send({"error": "File does not exist in catalog!"});
    }

    await this.storage.removeFromCatalog(catalogName, fileName);
    return response.code(200).send({"message": `The file '${fileName}' was removed from catalog '${catalogName}'.`});

};