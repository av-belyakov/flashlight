/*
 * Страница управления заначами приложения
 *
 * Верися 0.1, дата релиза 05.02.2018
 * */

'use strict';

const async = require('async');

const controllers = require('../../../controllers/index');
const writeLogFile = require('../../../libs/writeLogFile');

const getListSources = require('../../../libs/helpers/getListSources');
const accessRightsUsers = require('../../../libs/users_management/accessRightsUsers');
const informationForHeader = require('../../../libs/informationForHeader');
const informationForManagementTask = require('../../../libs/management_settings/informationForPageManagementTask');

module.exports = function(req, res, socketIo) {
    let redis = controllers.connectRedis();
    let userId = req.session.passport.user;

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
            accessRightsUsers.getAccessRight(redis, userId, 'management_task', function(obj) {
                callback(null, obj);
            });
        },
        shortInformation: function(callback) {
            /*informationForPageManagementUsers.getItemGroups(redis, function(obj) {
                callback(null, obj);
            });*/
            callback(null, {});
        },
        listSources: function(callback) {
            getListSources((err, obj) => {
                if (err) callback(err);
                else callback(null, obj);
            });

            /*informationForManagementAdmin.getListSources(redis, (err, obj) => {
                if (err) callback(err);
                else callback(null, obj);
            });*/
        },
        shortStatisticInfo: function(callback) {
            informationForManagementTask.getShortStatisticInfo(redis, (err, obj) => {
                if (err) callback(err);
                else callback(null, obj);
            });
            //callback(null, {});
        },
        mainContent: function(callback) {
            /*informationForPageManagementUsers.getInformationForMainTable(redis, req, function(obj) {
                callback(null, obj);
            });*/
            callback(null, {});
        }
    }, function(err, endObject) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        //для вывода модального окна смены пользователя
        endObject.openModalWindow = endObject.header.userIsAdmin;
        res.render('menu/settings/settings_task', endObject);
    });
};