/*
 * Страница управления удаленными источниками
 *
 * Верися 0.1, дата релиза 19.01.2016
 * */

'use strict';

const async = require('async');

const controllers = require('../../../controllers/index');
const writeLogFile = require('../../../libs/writeLogFile');

const accessRightsUsers = require('../../../libs/users_management/accessRightsUsers');
const informationForHeader = require('../../../libs/informationForHeader');
const informationForPageManagementSources = require('../../../libs/management_settings/informationForPageManagementSources');

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
            accessRightsUsers.getAccessRight(redis, userId, 'management_sources', function(obj) {
                callback(null, obj);
            });
        },
        mainContent: function(callback) {
            informationForPageManagementSources.getShortInformationForTable(redis, req, function(err, obj) {
                if (err) callback(err);
                else callback(null, obj);
            });
        }
    }, function(err, endObject) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        endObject.openModalWindow = (endObject.header.userIsAdmin) ? true : false;
        res.render('menu/settings/settings_sources', endObject);
    });
};