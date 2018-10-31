/**
 * Модуль, обеспечивающий предварительную проверку данных учавствующих в формировании 
 * запроса на скачивание отфильтрованных файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */

'use strict';

const checkAccessRights = require('../../libs/users_management/checkAccessRights');
const getListsTaskProcessing = require('../../libs/getListsTaskProcessing');
const checkFileUploadSettings = require('../../libs/checkFileUploadSettings');
const getTaskStatusForJobLogPage = require('../../libs/getTaskStatusForJobLogPage');
const preparingVisualizationDownloadFiles = require('./preparingVisualizationDownloadFiles');

const processingFilesUpload = require('./processingFilesUpload');

/**
 * @param data - содержит следующие параметры: taskIndex, sourceId, listFiles
 * @param socketIo - дискриптор соединения с клиентом по протоколу websocket
 * @param redis - дискриптор соединения с БД
 * @param callback - функция обратного вызова
 */
module.exports = function(data, socketIo, redis, callback) {
    new Promise((resolve, reject) => {
        //проверка прав доступа пользователя
        checkAccessRights(socketIo, 'management_tasks_filter', 'import', (trigger) => {
            if (!trigger) reject(new Error('Не достаточно прав доступа для загрузки найденных файлов'));
            else resolve();
        });
    }).then(() => {
        //проверка переданных пользователем данных
        return new Promise((resolve, reject) => {
            checkFileUploadSettings(data.taskIndex, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }).then(() => {
        //обработка задачи по загрузке файлов
        return new Promise((resolve, reject) => {
            processingFilesUpload.start(socketIo, data, (err, sourceID) => {
                if (err) return reject(err);
                if (data.sourceId !== sourceID) return reject(new Error('source ID does not match'));

                resolve(sourceID);
            });
        });
    }).then(sourceID => {
        //добавить задачу в очередь (визуализация выполнения задачи)
        return new Promise((resolve, reject) => {
            preparingVisualizationDownloadFiles.preparingVisualizationAddTurn(redis, data.taskIndex, sourceID, (err, data) => {
                if (err) return reject(err);

                console.log('--- preparingFileDownloadRequest (after preparingVisualizationDownloadFiles) task ID = ' + data.taskIndex);
                console.log(data);


                if (Object.keys(data).length === 0) return resolve();

                console.log('--- preparingFileDownloadRequest (emit broadcast)--- task ID = ' + data.taskIndex);
                console.log(data);

                socketIo.broadcast.emit('task upload files added', { processingType: 'showInformationDownload', information: data });
                let taskIndex = (~data.taskIndex.indexOf(':')) ? data.taskIndex.split(':')[1] : data.taskIndex;

                resolve(taskIndex);
            });
        });
    }).then(taskIndex => {
        //сообщения об изменении статуса задач
        return new Promise((resolve, reject) => {

            console.log('------------------');
            console.log('сообщение об изменении статуса задачи ' + taskIndex);
            console.log('------------------');

            getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
                if (err) reject(err);
                else resolve(objTaskStatus);
            });
        });
    }).then(objTaskStatus => {

        console.log('------------------');
        console.log('список выполняющихся процессов');
        console.log('------------------');

        let objListsTaskProcessing = getListsTaskProcessing();

        //только для пользователя инициировавшего загрузку
        socketIo.emit('change object status', {
            processingType: 'showChangeObject',
            informationPageJobLog: objTaskStatus,
            informationPageAdmin: objListsTaskProcessing
        });

        //для всех пользователей
        socketIo.broadcast.emit('change object status', {
            processingType: 'showChangeObject',
            informationPageJobLog: objTaskStatus,
            informationPageAdmin: objListsTaskProcessing
        });

        callback(null);
    }).catch(err => {
        callback(err);
    });
};