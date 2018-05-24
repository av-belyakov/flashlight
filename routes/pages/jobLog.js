/*
 * Страница для вывода информации о заданиях на фильтрацию сетевого трафика
 *
 * Верися 0.1, дата релиза 19.01.2016
 * */

'use strict';

const async = require('async');

const controllers = require('../../controllers/index');
const writeLogFile = require('../../libs/writeLogFile');

const accessRightsUsers = require('../../libs/users_management/accessRightsUsers');

const listParametersSearch = require('../../libs/listParametersSearch');
const informationForHeader = require('../../libs/informationForHeader');
const informationForPageLogFilter = require('../../libs/management_log_filter/informationForPageLogFilter');

module.exports = function(req, res) {
    let redis = controllers.connectRedis();
    const userId = req.session.passport.user;

    async.parallel({
        header: function(callback) {
            /*
             * передача данных необходимых для заголовка страниц
             * - Ф.И.О. пользователя
             * - является ли он администратором
             * - пункты меню
             * */
            informationForHeader.informationHeaderObject(redis, req, function(obj) {
                callback(null, obj);
            });
        },
        accessRights: function(callback) {
            /*
             * параметры доступа
             * */
            accessRightsUsers.getAccessRight(redis, userId, 'management_tasks_filter', function(obj) {
                callback(null, obj);
            });
        },
        parametersSearch: function(callback) {
            /*
             * набор параметров для поиска
             * */
            listParametersSearch.jobLog(redis, function(obj) {
                callback(null, obj);
            });
        },
        tableContent: function(callback) {
            /*
             * таблица с информацией о заданиях на фильтрацию
             * */
            let objReq = {
                userId: req.sessionID,
                objSearchInformation: {},
                isNewReq: true,
                chunkNumber: 0
            };
            informationForPageLogFilter.getAllInformation(redis, objReq, function(obj) {
                callback(null, obj);
            });
        }
    }, function(err, endObject) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        endObject.openModalWindow = (endObject.header.userIsAdmin) ? true : false;
        res.render('menu/job_log', endObject);
    });
};