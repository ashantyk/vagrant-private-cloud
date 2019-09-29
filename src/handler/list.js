

const getList = function(request, response, next) {



};

const respond = function(request, response, next){

    let catalog = {
        "name": request.params.folder,
        "versions": []
    };

    response.status(200).json(catalog);
    next();

};

module.exports = [
    respond
];