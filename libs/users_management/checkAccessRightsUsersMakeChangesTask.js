/*
 * Проверка соответствия пользователя выполняющего действие
 * пользователю который инициировал задачу фильтрации или задачу
 * по выгрузке файлов
 *
 * а также проверка прав доступа по матрице доступа
 *
 * Версия 0.4, релиз 22.06.2017
 * */

'use strict';

const async = require('async');

const writeLogFile = require('../writeLogFile');

module.exports = function(socketIo, redis, taskIndex, func) {
    if (typeof socketIo.request === 'undefined') return func(new Error('Error socketIo, incorrect request'));
    if (typeof socketIo.request.headers === 'undefined') return func(new Error('Error socketIo,there is no title'));
    if (typeof socketIo.request.headers.cookie === 'undefined') return func(new Error('Error socketIo, missing the cookie'));

    if (!(~socketIo.request.headers.cookie.indexOf(';'))) return func(new Error('Error socketIo, incorrect cookie'));
    let cookie = socketIo.request.headers.cookie.split('; ');

    let id = '';
    for (let i = 0; i < cookie.length; i++) {
        if (~cookie[i].indexOf('connect.sid')) {
            if (!(~cookie[i].indexOf('.'))) return func(new Error('Error socketIo, incorrect cookie'));
            id = cookie[i].slice(16).split('.');
        }
    }

    if (id.length < 2) return func(new Error('Error socketIo, incorrect cookie'));

    async.waterfall([
        function(callback) {
            redis.get('socketio_id:' + id[0], function(err, userId) {
                if (err) callback(err);
                else callback(null, userId);
            });
        },
        //получаем логин пользователя запустившего фильтрацию
        function(userId, callback) {
            redis.hmget('task_filtering_all_information:' + taskIndex, 'userLogin', 'userLoginImport', function(err, user) {
                if (err) callback(err);
                else callback(null, userId, user[0], user[1]);
            });
        },
        /* ывполняем проверку пользователя который начал фильтрацию и импорт файлов */
        function(userId, userLogin, userLoginImport, callback) {
            try {
                let user = userId.split('_')[1];
                let userIsFilter = (user === userLogin) ? true : false;
                let userIsImport = (user === userLoginImport) ? true : false;

                callback(null, userIsFilter, userIsImport, userId);
            } catch (err) {
                callback(err);
            }

        },
        //проверка пользователя выполнять определенные действия с импортом файлов
        function(userIsFilter, userIsImport, userId, callback) {
            redis.hget('user_authntication:' + userId, 'group', function(err, userGroup) {
                if (err) callback(err);
                else callback(null, userIsFilter, userIsImport, userGroup);
            });
        }
    ], function(err, userIsFilter, userIsImport, userGroup) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            return func(err);
        }
        redis.hget('user_group:' + userGroup, 'management_tasks_import', function(err, result) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                func(err);
            } else {
                try {
                    let obj = JSON.parse(result);

                    func(null, {
                        'userIsFilter': userIsFilter,
                        'userIsImport': userIsImport,
                        'taskImportCancel': obj.data.cancel[0],
                        'taskImportStop': obj.data.stop[0],
                        'taskImportResume': obj.data.resume[0]
                    });
                } catch (err) {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    func(err);
                }
            }
        });
    });
};