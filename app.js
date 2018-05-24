/**
 * Основной скрипт запуска приложения Flashlight
 *
 * Версия 0.1, дата релиза 07.09.2016
 */

'use strict';

const fs = require('fs');
const https = require('https');
const figlet = require('figlet');
const express = require('express');

const app = express();
const config = require('./configure');
const checkDirectoryDownloadFilesIsExist = require('./libs/checkDirectoryDownloadFilesIsExist');

const options = {};

const credentials = {
    key: fs.readFileSync('keys/flashlight_private_key.pem'),
    cert: fs.readFileSync('keys/flashlight_cert.pem')
};

checkDirectoryDownloadFilesIsExist(function(err) {
    if (err) return console.log(err);

    const server = https.createServer(credentials, app);
    const io = require('socket.io').listen(server, options);

    server.listen({
        port: config.get('httpServer:port'),
        host: config.get('httpServer:host')
    }, function() {
        figlet.text('The flashlight', function(err, data) {
            if (err) {
                console.log(err);
            } else {
                console.log(data);
                console.log('Debug: express server listening on port ' + config.get('httpServer:port') + ', host ' + config.get('httpServer:host'));
            }
        });
    });

    //настраиваем сервер
    require('./middleware')(app, express, io);
});