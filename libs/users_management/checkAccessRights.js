/*
 * Функция проверки прав пользователя на выполнения действий по настройки приложения
 *
 * ФУНКИЦЯ ОБРАБАТЫВАЕТ СОБЫТИЯ СГЕНЕРИРОВАННЫЕ ПОЛЬЗОВАТЕЛЕМ
 *
 * принимает следующие параметры:
 * - socketIo линк КЛИЕНТСКОГО соединения с использованием библиотеки socket.io
 * - settingManagement раздел в котором выполняется управление
 * - settingType тип действия (удаление, редактирование и т.д.)
 * - func функция обратного вызова
 *
 * Версия 0.2 дата релиза 22.06.2017
 * */

'use strict';

let async = require('async');

let writeLogFile = require('../writeLogFile');
let controllers = require('../../controllers');

module.exports = function(socketIo, settingManagement, settingType, func) {
    let redis = controllers.connectRedis();

    try {
        if (typeof socketIo.request === 'undefined') throw (new Error('socketIo, incorrect request'));
        if (typeof socketIo.request.headers === 'undefined') throw (new Error('socketIo,there is no title'));
        if (typeof socketIo.request.headers.cookie === 'undefined') throw (new Error('socketIo, missing the cookie'));

        if (!(~socketIo.request.headers.cookie.indexOf(';'))) throw (new Error('socketIo, incorrect cookie'));
        let cookie = socketIo.request.headers.cookie.split('; ');

        let index = -1;
        for (let i = 0; i < cookie.length; i++) {
            if (~cookie[i].indexOf('connect.sid')) {
                index = i;
                break;
            }
        }

        if ((index === -1) || !(~cookie[index].indexOf('.'))) throw (new Error('socketIo, incorrect cookie'));
        let id = cookie[index].slice(16).split('.');

        async.waterfall([
            function(callback) {
                redis.get('socketio_id:' + id[0], function(err, user) {
                    if (err) callback(err);
                    else callback(null, user);
                });
            },
            function(user, callback) {
                redis.hget('user_authntication:' + user, 'group', function(err, group) {
                    if (err) callback(err);
                    else callback(null, group);
                });
            },
            function(group, callback) {
                redis.hget('user_group:' + group, settingManagement, function(err, setting) {
                    if (err) callback(err);
                    else callback(null, setting);
                });
            }
        ], function(err, result) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                return func(false);
            }

            let obj = JSON.parse(result);

            if (obj === null || !obj.hasOwnProperty('data')) func(false);
            else func(obj.data[settingType][0]);
        });
    } catch (err) {
        writeLogFile.writeLog('\tError: ' + err.toString());
        func(false);
    }
};