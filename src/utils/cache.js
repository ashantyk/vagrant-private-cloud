const config = require("config");
const redis = require("ioredis");
const fs = require("fs");
const path = require('path');
const crypto = require('crypto');

const STORAGE_FOLDER = config.get('storage.path');
const WARM_UP_ENABLED = config.get('cache.warmUp');

let catalogs = [];

class Cache {

    static warmUp(){

        if(!WARM_UP_ENABLED) {
            return;
        }

        let storageFoldersNames = fs.readdirSync(STORAGE_FOLDER);

        storageFoldersNames.forEach(function(name){

            let catalogPath = path.join(STORAGE_FOLDER, name);
            let stat = fs.statSync(catalogPath);

            if(stat.isDirectory()) {
                catalogs.push(name);
                Cache.warmUpFilesInFolder(catalogPath);
            }
        });

    }

    static warmUpFilesInFolder(catalogPath) {

        let files = fs.readdirSync(catalogPath);

        files.forEach(function(fileName){

            let stat = fs.statSync(catalogPath + "/" + path);
            if(stat.isDirectory()) {
                return;
            }


        });


    }

}

module.exports = Cache;
