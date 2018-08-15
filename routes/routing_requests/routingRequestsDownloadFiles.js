/**
 * Модуль обрабатывающий типы состояний при скачивании с источников
 * отфильтрванных файлов сет. трафика
 * 
 * после обработки модуля routeSocketIo.eventGenerator()
 * 
 * Верися 0.1, дата релиза 20.02.2018 
 */

'use strict';

const debug = require('debug')('routingRequestsDownloadFiles');

const showNotify = require('../../libs/showNotify');
const errorsType = require('../../errors/errorsType');
const globalObject = require('../../configure/globalObject');
const objWebsocket = require('../../configure/objWebsocket');
const writeLogFile = require('../../libs/writeLogFile');
const getListsTaskProcessing = require('../../libs/getListsTaskProcessing');
const getTaskStatusForJobLogPage = require('../../libs/getTaskStatusForJobLogPage');
const getCountFilesUploadNotConsidered = require('../../libs/getCountFilesUploadNotConsidered');
const preparingVisualizationDownloadFiles = require('../processing_socketio/preparingVisualizationDownloadFiles');

module.exports = function({ redis, socketIoS, req, sourceID, notifyMessage }) {
    let objTypeRequest = {
        'cancel': requestCancel,
        'ready': requestTypeReady,
        'execute': requestTypeExecute,
        'complete': requestTypeComplete,
        'update progress': requestTypeUpdateProgress,
        'execute completed': requestTypeExecuteCompleted,
        //        'execute retransmission': requestTypeExecuteRetransmission,
        //        'execute retransmission completed': requestTypeExecuteRetransmissionCompleted
    };

    /*debug('********************** routingRequestsDownloadFiles ********************');
    debug(req);
    debug('*****************************************************');
*/

    if ((typeof req.info === 'undefined') || (typeof req.info.taskIndex === 'undefined')) {

        //debug('req.info or req.info.taskIndex not found');
        writeLogFile.writeLog('\tError, not found information about task ID (download files)');

        return showNotify(socketIoS, 'danger', `11 11 - Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
    }

    let taskIndex = req.info.taskIndex;

    if (typeof objTypeRequest[req.info.processing] === 'function') objTypeRequest[req.info.processing]();

    function requestCancel() {
        showNotify(socketIoS, 'danger', `Неопределенная ошибка, загрузка файлов с источника №<strong>${sourceID}</strong> не возможна`);
    }

    function requestTypeReady() {
        debug('--- TASK TYPE READY');

        preparingVisualizationDownloadFiles.preparingVisualizationStartExecute(redis, taskIndex, sourceID, (err, data) => {
            if (err) return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                showNotify(socketIoS, 'success', `Источник №<strong>${sourceID}</strong>, началась загрузка файлов`);
                socketIoS.emit('file successfully downloaded', { processingType: 'showInformationDownload', information: data });

                //сообщения об изменении статуса задач
                new Promise((resolve, reject) => {
                    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
                        if (err) reject(err);
                        else resolve(objTaskStatus);
                    });
                }).then((objTaskStatus) => {
                    return new Promise((resolve, reject) => {
                        getListsTaskProcessing(redis, (err, objListsTaskProcessing) => {
                            if (err) reject(err);
                            else resolve({
                                status: objTaskStatus,
                                lists: objListsTaskProcessing
                            });
                        });
                    });
                }).then((obj) => {
                    socketIoS.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });
                }).catch((err) => {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
                });
            }
        });
    }

    function requestTypeExecute() {
        debug('--- TASK TYPE EXECUTE');

        getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, result) => {
            if (err) return writeLogFile.writeLog('\tError: ' + err.toString());

            socketIoS.emit('change object status', {
                processingType: 'showChangeObject',
                informationPageJobLog: result,
                informationPageAdmin: {}
            });

            /*debug(result);

            resolve({
                'status': result.newStatus,
                'uploadDirectoryFiles': result.uploadDirectoryFiles
            });*/
        });

        //добавляем информацию о загружаемом файле в объект globalObject
        /*new Promise((resolve, reject) => {
            debug('get task information');

            getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, result) => {
                if (err) return reject(err);

                socketIoS.emit('change object status', {
                    processingType: 'showChangeObject',
                    informationPageJobLog: result,
                    informationPageAdmin: {}
                });

                debug(result);

                resolve({
                    'status': result.newStatus,
                    'uploadDirectoryFiles': result.uploadDirectoryFiles
                });
            });
        }).then((objDataTask) => {
            //изменяем информацию о выполняемой задаче (processingTask)
            globalObject.modifyData('processingTasks', taskIndex, [
                ['status', objDataTask.newStatus],
                ['timestampModify', +new Date()]
            ]);

            debug('globalObject.modifyData');
            debug(globalObject.getData('processingTasks', taskIndex));

            return objDataTask.uploadDirectoryFiles;
        }).then((uploadDirectoryFiles) => {
            //добавляем информацию о загружаемом файле
            globalObject.setData('downloadFilesTmp', sourceID, {
                'taskIndex': taskIndex,
                'fileName': req.info.fileName,
                'fileHash': req.info.fileHash, //хеш файла в md5
                'fileFullSize': req.info.fileSize, //полный размер файла в байтах
                'fileChunkSize': (+req.info.fileSize / 100), //размер в байтах одного %
                'fileUploadedSize': 0, //загруженный объем файла
                'fileSizeTmp': 0, //временный размер файла
                'fileUploadedPercent': 0, //объем загруженного файла в %
                'uploadDirectoryFiles': uploadDirectoryFiles //путь до директории в которой будут сохранятся файлы
            });

            debug('globalObject.setData (downloadFilesTmp)');
            debug(globalObject.getData('downloadFilesTmp', sourceID));

        }).then(() => {
            //отправляем Moth_go сообщение об ожидании самого файла
            let wsConnection = objWebsocket[`remote_host:${sourceID}`];
            if (typeof wsConnection === 'undefined') {
                throw (new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${taskIndex} не существует`));
            }
            let msg = JSON.stringify({
                'messageType': 'download files',
                'info': {
                    'processing': 'waiting for transfer',
                    'taskIndex': taskIndex,
                    'fileName': req.info.fileName
                }
            });

            debug('send data for Moth_go');
            debug(msg);

            wsConnection.sendUTF(msg);
        }).catch((err) => {
            writeLogFile.writeLog('\tError: ' + err.toString());
            showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
        });*/
    }

    function requestTypeExecuteCompleted() {
        preparingVisualizationDownloadFiles.preparingVisualizationExecuteCompleted(redis, taskIndex, sourceID, function(err, data) {
            if (err) return showNotify(socketIoS, 'danger', `2-2-2 Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                socketIoS.emit('file successfully downloaded', { processingType: 'showInformationDownload', information: data });
            }
        });
    }

    function requestTypeComplete() {
        preparingVisualizationDownloadFiles.preparingVisualizationComplete(redis, taskIndex, sourceID, function(err, data) {
            if (err) return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                showNotify(socketIoS, 'success', `Источник №<strong>${sourceID}</strong>, передача файлов завершена`);

                socketIoS.emit('all files successfully downloaded', {
                    processingType: 'showInformationDownload',
                    information: data
                });

                //сообщение о количестве нерассмотренных задач
                if (typeof notifyMessage !== 'undefined') {
                    let receivedIsSuccess = (typeof notifyMessage.receivedIsSuccess !== 'undefined');

                    if (receivedIsSuccess && notifyMessage.receivedIsSuccess === true) {
                        getCountFilesUploadNotConsidered(redis, function(numberUploadedFiles) {
                            //socketIoS.broadcast.emit('change number uploaded files', { 'numberUploadedFiles' : numberUploadedFiles });
                            socketIoS.emit('change number uploaded files', { 'numberUploadedFiles': numberUploadedFiles });
                        });
                    }
                }
                //сообщения об изменении статуса задач
                new Promise((resolve, reject) => {
                    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', function(err, objTaskStatus) {
                        if (err) reject(err);
                        else resolve(objTaskStatus);
                    });
                }).then((objTaskStatus) => {
                    return new Promise((resolve, reject) => {
                        getListsTaskProcessing(redis, (err, objListsTaskProcessing) => {
                            if (err) reject(err);
                            else resolve({
                                status: objTaskStatus,
                                lists: objListsTaskProcessing
                            });
                        });
                    });
                }).then((obj) => {
                    socketIoS.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });
                }).catch((err) => {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
                });
            }
        });
    }

    function requestTypeUpdateProgress() {
        preparingVisualizationDownloadFiles.preparingVisualizationUpdateProgress(redis, taskIndex, sourceID, function(err, data) {
            if (err) return showNotify(socketIoS, 'danger', 'Неопределенная ошибка, контроль загрузки файлов не возможен');

            if (Object.keys(data).length > 0) {
                socketIoS.emit('update the download progress', { processingType: 'showInformationDownload', information: data });
            }
        });
    }
};