/*
 * Страница вывода ошибок полученных от удаленных хостов
 *
 * Верися 0.1, дата релиза 19.01.2016
 * */

'use strict';

const async = require('async');

const controllers = require('../../controllers/index');
const writeLogFile = require('../../libs/writeLogFile');

const informationForHeader = require('../../libs/informationForHeader');
const listParametersSearchSources = require('../../libs/listParametersSearchSources');
const informationCountSourcesWithErrors = require('../../libs/informationCountSourcesWithErrors');

module.exports = function (req, res, socketIo) {
    let redis = controllers.connectRedis();

    async.parallel({
        header: function (callback) {
            /*
             * передача данных необходимых для заголовка страниц
             * - Ф.И.О. пользователя
             * - является ли он администратором
             * - пункты меню
             * */
            informationForHeader.informationHeaderObject(redis, req, function (obj) {
                callback(null, obj);
            });
        },
        parametersSearch: function (callback) {
            /*
             * набор парамтров для поиска
             * */
            listParametersSearchSources(redis, function (obj) {
                callback(null, obj);
            })
        },
        informationCountSourcesWithErrors: function (callback) {
            /*
             * информация о количестве источников с ошибками
             * */
            informationCountSourcesWithErrors(redis, function (obj) {
                callback(null, obj);
            })
        }
    }, function (err, endObject) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());

        endObject.openModalWindow = (endObject.header.userIsAdmin) ? true : false;
        res.render('menu/errors_log', endObject);
    });
};