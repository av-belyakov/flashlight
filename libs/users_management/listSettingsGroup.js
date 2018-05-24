/*
 * вывод в виде объекта всех настроек группы для выбранного пользователя
 *
 * Версия 0.1, дата релиза 12.01.2016
 * */

'use strict';

const controllers = require('../../controllers/index');
const writeLogFile = require('../../libs/writeLogFile');

/*
* проверяем права группы на ЧТЕНИЕ, принимает следующие параметры
* - req объект запроса
* - settingType тип настроек (пользователи, группы, источники и т.д.)
* - callback функция обратного вызова которой передается либо true либо false
* */
exports.checkReadSettings = function (req, settingType, callback) {
    //идентификатор пользователя
    let userName = req.session.passport.user;

    getSettingsForDb(userName, settingType, 'read', function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        callback(result);
    });
};

/*
 * проверяем права группы на СОЗДАНИЕ, принимает следующие параметры
 * - req объект запроса
 * - settingType тип настроек (пользователи, группы, источники и т.д.)
 * - callback функция обратного вызова которой передается либо true либо false
 * */
exports.checkCreateSettings = function (req, settingType, callback) {
    //идентификатор пользователя
    let userName = req.session.passport.user;

    getSettingsForDb(userName, settingType, 'create', function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        callback(result);
    });
};

/*
 * проверяем права группы на РЕДАКТИРОВАНИЕ, принимает следующие параметры
 * - req объект запроса
 * - settingType тип настроек (пользователи, группы, источники и т.д.)
 * - callback функция обратного вызова которой передается либо true либо false
 * */
exports.checkEditSettings = function (req, settingType, callback) {
    //идентификатор пользователя
    let userName = req.session.passport.user;

    getSettingsForDb(userName, settingType, 'edit', function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        callback(result);
    });
};

/*
 * проверяем права группы на УДАЛЕНИЕ, принимает следующие параметры
 * - req объект запроса
 * - settingType тип настроек (пользователи, группы, источники и т.д.)
 * - callback функция обратного вызова которой передается либо true либо false
 * */
exports.checkDeleteSettings = function (req, settingType, callback) {
    //идентификатор пользователя
    let userName = req.session.passport.user;

    getSettingsForDb(userName, settingType, 'delete', function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        callback(result);
    });
};

/*
* чтение из БД, принимает следующие параметры
* - userName имя пользователя
* - settingType тип настроек
* - action действие настроек (просмотр, редактированиеб удаление или добавление)
* - func функция обратного вызова (два параметра err и результат, если ошибки нет то null)
* */
function getSettingsForDb (userName, settingType, action, func) {
    var redis = controllers.connectRedis();
    redis.hget('user_authntication:' + userName, 'group', function (err, group) {
        if(err) return func(err);

        redis.hget('user_group:' + group, settingType, function (err, obj) {
            if(err) return func(err);

            let finalyObj = JSON.parse(obj);
            func(null, finalyObj.data[action][0]);
        });
    });
}


// !!!! ПОКА ВРЕМЕННАЯ ФУНКЦИЯ !!!!!
exports.getListSettingsGroup = function (redis, req, func) {
    let userId = req.session.passport.user;
    redis.hget('user_authntication:' + userId, 'group', function (err, group) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());

        redis.hgetall('user_group:' + group, function (err, obj) {
            if(err) writeLogFile.writeLog('\tError: ' + err.toString());
            func(obj);
        });
    });
};