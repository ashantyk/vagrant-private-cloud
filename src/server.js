const express = require('express');
const config = require('config');

const app = express();

app.get('/', function (req, res) {
    res.send('Hello World')
});

app.listen(config.get('server.port'), config.get('server.host'));
