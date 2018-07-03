/**
 * Модуль, обеспечивающий формирование запроса на скачивание отфильтрованных файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */

'use strict';

const checkAccessRights = require('../../libs/users_management/checkAccessRights');
const checkFileUploadSettings = require('../../libs/checkFileUploadSettings');

const processingFilesUpload = require('./processingFilesUpload');


/**
 * @param data - содержит следующие параметры: taskIndex, sourceId, listFiles
 * @param socketIo - дискриптор соединения с клиентом по протоколу websocket
 * @param callback - функция обратного вызова
 */
module.exports = function(data, socketIo, callback) {
    new Promise((resolve, reject) => {
        checkAccessRights(socketIo, 'management_tasks_filter', 'import', (trigger) => {
            if (!trigger) reject(new Error('Не достаточно прав доступа для загрузки найденных файлов'));
            else resolve();
        });
    }).then(() => {
        new Promise((resolve, reject) => {
            checkFileUploadSettings(data.taskIndex, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }).then(() => {
        new Promise((resolve, reject) => {
            processingFilesUpload.start(socketIo, data.taskIndex, function(err, sourceId) {
                if (err) reject(err);

                resolve();
            });
        }).catch((err) => {
            return showNotify(socketIo, 'danger', err.message);
        });
    });
};