/*
 * Управление пользователями
 *
 * - добавление
 * - редактирование
 * - удаление
 *
 * Версия 0.1, дата релиза 15.02.2016
 * */

'use strict';

const async = require('async');

const showNotify = require('../../libs/showNotify');
const controllers = require('../../controllers');
const writeLogFile = require('../../libs/writeLogFile');
const hashPassword = require('../../libs/hashPassword');

const redis = controllers.connectRedis();

//добавление пользователя
exports.addUser = function(socketIo, obj) {
    let loginIsTrue = /\b^[a-zA-Z0-9]{4,}$\b/.test(obj.login);
    let groupIsTrue = /\b^[a-zA-Z0-9]{4,}$\b/.test(obj.group);
    let userNameIsTrue = /^[а-яё\s]+$/i.test(obj.userName);

    if (loginIsTrue && groupIsTrue && userNameIsTrue) {
        let password = hashPassword.getHashPassword(obj.password, 'this is flashlight');

        redis.hmset('user_authntication:userid_' + obj.login, {
            'date_register': +new Date(),
            'date_change': +new Date(),
            'login': obj.login,
            'password': password,
            'group': obj.group,
            'user_name': obj.userName,
            'settings': '{ "remoteHosts" : [] }'
        }, function(err) {
            if (err) {
                showNotify(socketIo, 'danger', 'Не возможно создать нового пользователя <strong>' + obj.login + '</strong>');
                writeLogFile.writeLog('\tError: ' + err.toString());
            } else {
                showNotify(socketIo, 'info', 'Пользователь <strong>' + obj.login + '</strong> добавлен успешно');
            }
        });
    } else {
        showNotify(socketIo, 'danger', 'Не возможно создать нового пользователя <strong>' + obj.login + '</strong> так как переданные данные не корректны');
    }
};

//редактирование информации о пользователе
exports.editUser = function(socketIo, obj) {
    let loginIsTrue = /\b^[a-zA-Z0-9]{4,}$\b/.test(obj.login);
    let groupIsTrue = /\b^[a-zA-Z0-9]{4,}$\b/.test(obj.group);
    let userNameIsTrue = /^[а-яё\s]+$/i.test(obj.userName);

    if (loginIsTrue && groupIsTrue && userNameIsTrue) {
        let password = hashPassword.getHashPassword(obj.password, 'this is flashlight');

        async.parallel([
            function(callback) {
                redis.hset('user_authntication:userid_' + obj.login, 'date_change', +new Date, function(err) {
                    if (err) callback(err);
                    else callback(null, true);
                });
            },
            function(callback) {
                redis.hset('user_authntication:userid_' + obj.login, 'password', password, function(err) {
                    if (err) callback(err);
                    else callback(null, true);
                });
            },
            function(callback) {
                if (obj.login === 'administrator') return callback(null, true);

                redis.hset('user_authntication:userid_' + obj.login, 'group', obj.group, function(err) {
                    if (err) callback(err);
                    else callback(null, true);
                });

            },
            function(callback) {
                redis.hset('user_authntication:userid_' + obj.login, 'user_name', obj.userName, function(err) {
                    if (err) callback(err);
                    else callback(null, true);
                });
            }
        ], function(err, arrayResult) {
            if (err) {
                showNotify(socketIo, 'danger', `Ошибка: невозможно редактировать информацию о пользователе <strong>${obj.login}</storng>`);
                writeLogFile.writeLog('\tError: ' + err.toString());
                return;
            }

            let isTrue = arrayResult.every((item) => item);

            if (isTrue) showNotify(socketIo, 'info', `Информация о пользователе <strong>${obj.login}</strong> изменена успешно`);
            else showNotify(socketIo, 'info', 'Не вся иинформация о пользователе была успешно изменена');
        });
    } else {
        showNotify(socketIo, 'danger', 'Не возможно создать нового пользователя <strong>' + obj.login + '</strong> так как переданные данные не корректны');
    }
};

//удаление пользователя
exports.deleteUser = function(socketIo, obj) {
    let loginIsTrue = /\b^[a-zA-Z0-9]{4,}$\b/.test(obj.login);

    if (loginIsTrue) {
        redis.del('user_authntication:userid_' + obj.login, function(err) {
            if (err) {
                showNotify(socketIo, 'danger', `Ошибка: невозможно удалить пользователя <strong>${obj.login}</storng>`);
                writeLogFile.writeLog('\tError: ' + err.toString());
            } else {
                showNotify(socketIo, 'info', `Пользователь <strong>${obj.login}</strong> успешно удален`);
            }
        });
    }
};