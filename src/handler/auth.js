module.exports = async function (request, response) {

    if (!request.headers.authorization) {
        return response.code(401).send();
    }

    let [type, hash] = request.headers.authorization.split(" ");

    if (type !== "Basic") {
        return response.code(400).send();
    }

    let credentials = Buffer.from(hash, 'base64').toString('utf-8');
    let [username, password] = credentials.split(":");

    if (password !== response.context.config.secret) {
        return response.code(401).send();
    }

};