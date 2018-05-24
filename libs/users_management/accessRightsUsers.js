/*
 * Модуль проверяющий права доступа пользователя по группе принадлежности
 * возвращает объект состоящий из свойства:значения (например edit:true)
 * 
 * @param {*} redis - дискриптор соединения с БД
 * @param {*} userId - имя пользователя
 * @param {*} typeSetting - название настроек группы
 * @param {*} func - функцию обратного вызова
 * 
 * Версия 0.1, дата релиза 02.02.2016
 * */

'use strict';

let async = require('async');
let writeLogFile = require('../writeLogFile');

module.exports.getAccessRight = function(redis, userId, typeSetting, func) {
    async.waterfall([
        function(callback) {
            redis.hget('user_authntication:' + userId, 'group', function(err, group) {
                if (err) callback(err);
                else callback(null, group);
            });
        },
        function(userGroup, callback) {
            redis.hget('user_group:' + userGroup, typeSetting, function(err, settings) {
                if (err) callback(err);
                else callback(null, settings);
            });
        }
    ], function(err, result) {
        if (err || result === null) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            let obj = {};
            try {
                obj = JSON.parse(result);
            } catch (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                return func({});
            }

            if (typeof obj.data === 'undefined') func({});
            else func(obj.data);
        }
    });
};