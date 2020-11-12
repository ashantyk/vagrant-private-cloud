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

    let streamRange = {
        'total' : fileSize,
        'start' : 0,
        'end'   : fileSize,
        'chunk' : null
    };
    let readStreamOptions = {};

    if (request.headers.range) {

        let positions = request.headers.range.replace(/bytes=/, "").split(",")[0].split("-");
        streamRange.start = parseInt(positions[0], 10);
        streamRange.end = positions[1] ? parseInt(positions[1], 10) : streamRange.total - 1;

        if(streamRange.end < streamRange.start || streamRange.end >= streamRange.total){
            return response.code(416).send({"error": "Range Not Satisfiable!"});
        }

        streamRange.chunk = (streamRange.end - streamRange.start) + 1;
        readStreamOptions.start = streamRange.start;
        readStreamOptions.end = streamRange.end;

    }

    response
        .type('application/octet-stream')
        .header('Accept-Ranges', 'bytes');

    if (streamRange.chunk) {
        response.header('Content-Range', "bytes " + streamRange.start + "-" + streamRange.end + "/" + streamRange.total);
        response.header('Content-Length', streamRange.chunk)
    } else {
        response.header('Content-Length', streamRange.total)
    }

    let fileStream = await this.storage.getFileStreamFromCatalog(catalogName, fileName, readStreamOptions);
    return response.code(streamRange.chunk ? 206 : 200).send(fileStream);

};