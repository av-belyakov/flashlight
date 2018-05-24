/*
 * Страница для вывода информации о загруженных файлах
 *
 * Верися 0.1, дата релиза 07.12.2016
 * */

'use strict';

const async = require('async');

const controllers = require('../../controllers/index');
const writeLogFile = require('../../libs/writeLogFile');

const accessRightsUsers = require('../../libs/users_management/accessRightsUsers');

const listParametersSearch = require('../../libs/listParametersSearch');
const informationForHeader = require('../../libs/informationForHeader');
const informationForPageUploadedFiles = require('../../libs/management_uploaded_files/informationForPageUploadedFiles');

module.exports = function (req, res, socketIo) {
    let redis = controllers.connectRedis();
    const userId = req.session.passport.user;

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
        accessRights: function (callback) {
            /*
             * параметры доступа
             * */
            accessRightsUsers.getAccessRight(redis, userId, 'management_uploaded_files', function (obj) {
                callback(null, obj);
            });
        },
        parametersSearch: function (callback) {
            /*
             * набор параметров для поиска
             * */
            listParametersSearch.uploadFile(redis, function (obj) {
                callback(null, obj);
            })
        },
        tableContent: function (callback) {
            /*
             * таблица с информацией о загруженных файлах
             * */
            let objReq = {
                userId : req.sessionID,
                objSearchInformation : {},
                isNewReq : true,
                chunkNumber : 0
            };
            informationForPageUploadedFiles.getNewInformationFileUpload(redis, objReq, function (obj) {
                callback(null, obj);
            });
        }
    }, function (err, endObject) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());

        endObject.openModalWindow = (endObject.header.userIsAdmin) ? true : false;
        res.render('menu/uploaded_files_log', endObject);
    });
};