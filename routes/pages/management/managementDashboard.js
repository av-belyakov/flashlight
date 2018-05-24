/*
 * Страница управления информационными панелями выводимыми на главную страницу
 *
 * Верися 0.1, дата релиза 22.03.2016
 * */

'use strict';

const async = require('async');

const controllers = require('../../../controllers/index');
const writeLogFile = require('../../../libs/writeLogFile');

const showUsersSources = require('../../../libs/users_management/showUsersSources');
const accessRightsUsers = require('../../../libs/users_management/accessRightsUsers');
const informationForHeader = require('../../../libs/informationForHeader');
const informationForPageManagementDashboard = require('../../../libs/management_settings/informationForPageManagementDashboard');

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
            accessRightsUsers.getAccessRight(redis, userId, 'management_dashboard', function(obj) {
                callback(null, obj);
            });
        },
        itemSources: function(callback) {
            showUsersSources.getSources(redis, userId, function(obj) {
                callback(null, obj);
            });
        },
        mainContent: function(callback) {
            informationForPageManagementDashboard.getShortInformationForTable(redis, req, function(obj) {
                callback(null, obj);
            });
        }
    }, function(err, endObject) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        endObject.openModalWindow = (endObject.header.userIsAdmin) ? true : false;
        res.render('menu/settings/settings_dashboard', endObject);
    });
};