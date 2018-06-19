/*
 * Формирование данных для главной страници приложения
 *
 * Верися 0.1, дата релиза 21.09.2016
 * */

'use strict';

const async = require('async');

const controllers = require('../../controllers');
const writeLogFile = require('../../libs/writeLogFile');

const getListSources = require('../../libs/helpers/getListSources.js');
const informationForHeader = require('../../libs/informationForHeader');
const shortNameIdRemoteHosts = require('../../libs/shortNameIdRemoteHosts');
const informationForMainPage = require('../../libs/informationForMainPage');
const informationForLeftContent = require('../../libs/informationForLeftContent');

module.exports = function(req, res, socketIo) {
    let redis = controllers.connectRedis();

    let userId = req.session.passport.user;
    redis.setex('socketio_id:' + req.sessionID, 259200, userId, function(err) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
    });

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
        shortNameRemoteHosts: function(callback) {
            /* информация соответствия идентификатора удаленного хоста краткому имени */
            shortNameIdRemoteHosts.getShortNameForIdRemoteHosts(redis, function(obj) {
                callback(null, obj);
            });
        },
        mainContent: function(callback) {
            informationForMainPage.getInformationForWidgets(userId, function(obj) {
                callback(null, obj);
            });
        },
        leftContentTaskFilter: function(callback) {
            informationForLeftContent.listFilterHosts(redis, function(obj) {
                callback(null, obj);
            });
        },
        leftContentTurnTaskDownload: function(callback) {
            informationForLeftContent.listTurnDownloadFiles(redis, function(obj) {
                callback(null, obj);
            });
        },
        leftContentImplementationTaskDownload: function(callback) {
            informationForLeftContent.listImplementationDownloadFiles(redis, function(obj) {
                callback(null, obj);
            });
        },
        rightContent: function(callback) {
            getListSources((err, objListSources) => {
                callback(null, objListSources);
            });
        }
    }, function(err, endObject) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        endObject.openModalWindow = (endObject.header.userIsAdmin) ? true : false;
        res.render('index', endObject);
    });
};