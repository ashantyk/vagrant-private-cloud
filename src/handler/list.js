module.exports = async function (request, response) {

    let catalogName = request.params.folder.replace(/\.json$/, "");

    let exists = await this.storage.catalogExists(catalogName);

    if (!exists) {
        return response.code(404).send({'error': 'Catalog not found!'});
    }

    let catalogContents = {
        "name": catalogName,
        "description": catalogName,
        "versions": []
    };

    let catalogItems = await this.storage.getCatalogItems(catalogName);

    if (catalogItems.length) {

        let versions = {};

        catalogItems.forEach((item) => {

            if (typeof versions[item.version] === 'undefined') {
                versions[item.version] = {
                    'version' : item.version,
                    'providers' : []
                }
            }

            versions[item.version].providers.push({
                'name' : item.provider,
                'url': "http://" + request.hostname + "/catalog/" + catalogName + "/" + item.file,
                'checksum_type' : item.hashType,
                'checksum': item.hash
            })

        });

        catalogContents.versions = Object.values(versions);

    }

    response
        .code(200)
        .header("Content-Type", "application/json")
        .serializer((data) => {
            return JSON.stringify(data, null, 4);
        })
        .send(catalogContents);

};