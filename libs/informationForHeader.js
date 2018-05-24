/*
 * Подготовка информации необходимой для шапки страницы
 *
 * на выходе получается объект содержащий:
 * username - Ф.И.О. пользователя
 * userIsAdmin - является пользователь администратором (true/false)
 * menuSettings - пункты меню (могут отличатся, зависят от группы пользователя)
 *
 * Версия 0.2, дата релиза 25.01.2017
 * */

'use strict';

const async = require('async');
const crypto = require('crypto');

const hashPassword = require('./hashPassword');
const writeLogFile = require('./writeLogFile');

module.exports.informationHeaderObject = function(redis, req, func) {
    async.parallel({
        username: getUserName,
        userIsAdmin: showUserIsAdmin,
        menuSettings: getMenuSettings,
        numberUploadedFiles: getNumberUploadedFiles
    }, function(err, resultObj) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
        func(resultObj);
    });

    function getUserName(callback) {
        redis.hget('user_authntication:' + req.session.passport.user, 'user_name', function(err, userName) {
            if (err) callback(err);
            else callback(null, userName);
        });
    }

    function showUserIsAdmin(callback) {
        let salt = 'this is flashlight';
        let md5string = crypto.createHash('md5')
            .update('administrator')
            .digest('hex');
        if (req.session.passport.user === 'userid_administrator') {
            redis.hget('user_authntication:userid_administrator', 'password', function(err, password) {
                if (err) return callback(err);
                if (password === hashPassword.getHashPassword(md5string, salt)) return callback(null, true);

                callback(null, false);
            });
        } else {
            callback(null, false);
        }
    }

    function getMenuSettings(callback) {
        redis.hget('user_authntication:' + req.session.passport.user, 'group', function(err, group) {
            if (err) return callback(err);

            redis.hget('user_group:' + group, 'menu', function(err, menu) {
                if (err) return callback(err);

                let objTmp = JSON.parse(menu);
                let objMenu = {};

                let objData = objTmp.data;
                for (let item in objData) {
                    let array = objData[item];

                    if (array[0] === true) objMenu[item] = array[1];
                }
                callback(null, objMenu);
            });
        });
    }

    function getNumberUploadedFiles(callback) {
        redis.zrange('task_filtering_upload_not_considered', [0, -1], function(err, listTaskUpload) {
            if (err) return callback(err);
            else callback(null, listTaskUpload.length);
        });
    }
};