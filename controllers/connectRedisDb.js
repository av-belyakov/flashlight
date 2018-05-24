/*
 * Устанавливаем соединение с DB Redis
 *
 * Версия 0.2, дата релиза 14.11.2016
 * */

'use strict';

const redis = require('redis');

const config = require('../configure');
const writeLogFile = require('../libs/writeLogFile');

module.exports = function() {
    let client = redis.createClient(config.get('UnixSocketPath'));
    //выполняем авторизацию в БД
    client.auth(config.get('dbRedis:password'), function(err) {
        if (err) writeLogFile.writeLog('\tError: client not authorized in the database Redis');
    });

    client.on('error', function(err) {
        if (err) {
            console.log('Error: cannot connect to database Redis ' + err.toString());
            writeLogFile.writeLog('\tError: cannot connect to database Redis ' + err.toString());
        }
    });
    return function() {
        return client;
    };
};