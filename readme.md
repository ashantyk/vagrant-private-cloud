# Vagrant Private Cloud

A NodeJS web server for uploading and delivering vagrant boxes.

## Getting Started

1. Clone this repository
2. Create a `config/development.json` or `config/production.json` file and override `upload.secret` with your own secret (and eventually `server.port`)
3. Run `npm install`
4. Start the server with `node index.js`

### Prerequisites

You will need the following software requirements to be able to run this framework:
* **NodeJS** - *10+*

## Uploading and using boxes
To upload your own boxes you need to make a POST request to `http://host[:port]/{yourCatalogName}/{provider}-{version}.box` (e.g: `http://vagrant.repo.com/hydra/virtualbox-2019.09.09.box`).
You also need to specify the `upload.secret` as the password for the basic-auth header (Authorization: Basic {base64(someUser:SECRET)}).
 
To use your box with Vagrant you only need to set `config.vm.box_url` in your `Vagrantfile` to your catalog URL (e.g.: `http://host[:port]/{yourCatalogName}/manifest.json`). 

## Authors

* **Gabriel Barbieru** - [gbarbieru@bitdefender.com](mailto:gbarbieru@bitdefender.com)

## License

This project is licensed under the MIT License