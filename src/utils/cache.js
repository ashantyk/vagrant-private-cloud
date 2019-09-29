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

            let path = path.join(STORAGE_FOLDER, name);
            let stat = fs.statSync(path);

            if(stat.isDirectory()) {
                catalogs.push(name);
            }

            Cache.warmUpFilesInFolder(path);

        });

    }

    static warmUpFilesInFolder(path) {

        let files = fs.readdirSync(path);

        files.forEach(function(fileName){

            let stat = fs.statSync(path);
            if(stat.isDirectory()) {
                return;
            }


        });


    }

}

module.exports = Cache;
