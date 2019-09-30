module.exports = async function (request, response) {

    let catalogName = request.params.folder;

    let exists = await this.storage.catalogExists(catalogName);

    if (!exists) {
        return response.code(404).send({'error': 'Catalog not found!'});
    }

    let catalogContents = {
        "name": catalogName,
        "versions": []
    };

    let catalogItems = await this.storage.getCatalogItems(catalogName);

    if (catalogItems.length) {
        catalogItems.forEach((item) => {
            // TODO
        });
    }

    response.code(200).send(catalogContents);

};