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

    let fastify = this;

    return new Promise(function(resolve, reject){

        const callback = function (error) {
            if (error) {
                request.log.debug('Upload parse failed: ' + (error.message || error));
                response.code(400).send({"error": 'Upload failed!'});
                reject(error);
            }
        };

        const handler = async function(field, fileStream, filename, encoding, mimetype) {
            fastify.log.info(`Receiving file: ${filename}`);
        };

        let mp = request.multipart(handler, callback);

        mp.on('file', async function(field, fileStream, filename, encoding, mimetype){
            try {
                await fastify.storage.writeInCatalog(catalogName, fileName, fileStream);
            } catch (error) {
                return reject(error);
            }
            request.log.debug('Upload completed');
            response.code(200).send({"success": true});
            resolve();
        });

    });

};