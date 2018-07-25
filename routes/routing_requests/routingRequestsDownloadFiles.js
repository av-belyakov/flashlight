/**
 * Модуль обрабатывающий типы состояний при скачивании с источников
 * отфильтрванных файлов сет. трафика
 * 
 * Верися 0.1, дата релиза 20.02.2018 
 */

'use strict';

const showNotify = require('../../libs/showNotify');
const writeLogFile = require('../../libs/writeLogFile');
const getListsTaskProcessing = require('../../libs/getListsTaskProcessing');
const getTaskStatusForJobLogPage = require('../../libs/getTaskStatusForJobLogPage');
const getCountFilesUploadNotConsidered = require('../../libs/getCountFilesUploadNotConsidered');
const preparingVisualizationDownloadFiles = require('../processing_socketio/preparingVisualizationDownloadFiles');

module.exports = function({ redis, socketIoS, req, remoteHostId, notifyMessage }) {
    let objTypeRequest = {
        'cancel': requestCancel,
        'ready': requestTypeReady,
        'execute': requestTypeExecute,
        'complete': requestTypeComplete,
        'update progress': requestTypeUpdateProgress,
        'execute completed': requestTypeExecuteCompleted,
        'execute retransmission': requestTypeExecuteRetransmission,
        'execute retransmission completed': requestTypeExecuteRetransmissionCompleted
    };

    console.log(req);

    if (typeof objTypeRequest[req.processing] === 'function') objTypeRequest[req.processing]()

    function requestCancel() {
        showNotify(socketIoS, 'danger', `Неопределенная ошибка, загрузка файлов с источника №<strong>${remoteHostId}</strong> не возможна`);
    }

    function requestTypeReady() {
        preparingVisualizationDownloadFiles.preparingVisualizationStartExecute(redis, req.taskIndex, (err, data) => {
            if (err) return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                showNotify(socketIoS, 'success', `Источник №<strong>${remoteHostId}</strong>, началась загрузка файлов`);
                socketIoS.emit('file successfully downloaded', { processingType: 'showInformationDownload', information: data });

                let taskIndex = (~req.taskIndex.indexOf(':')) ? req.taskIndex.split(':')[1] : req.taskIndex;

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
                    showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);
                });
            }
        });
    }

    function requestTypeExecute() {
        if ((typeof req.taskIndex === 'undefined') || !(~req.taskIndex.indexOf(':'))) {
            return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);
        }

        let taskIndex = (~req.taskIndex.indexOf(':')) ? req.taskIndex.split(':')[1] : req.taskIndex;
        getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, obj) => {
            if (err) {
                showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);
            } else {
                socketIoS.emit('change object status', {
                    processingType: 'showChangeObject',
                    informationPageJobLog: obj,
                    informationPageAdmin: {}
                });
            }
        });
    }

    function requestTypeExecuteCompleted() {
        preparingVisualizationDownloadFiles.preparingVisualizationExecuteCompleted(redis, req.taskIndex, function(err, data) {
            if (err) return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                socketIoS.emit('file successfully downloaded', { processingType: 'showInformationDownload', information: data });
            }
        });
    }

    function requestTypeExecuteRetransmission() {
        preparingVisualizationDownloadFiles.preparingVisualizationStartExecute(redis, req.taskIndex, function(err, data) {
            if (err) return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                data.fileName = req.fileName;
                socketIoS.emit('file execute retransmission', { processingType: 'showInformationDownload', information: data });
            }
        });
    }

    function requestTypeExecuteRetransmissionCompleted() {
        if (typeof notifyMessage !== 'undefined') {
            if (notifyMessage.messageType === 'executeRetransmissionCompleted' && notifyMessage.message === 'successfully') {
                showNotify(socketIoS, 'success', `С источника №<strong>${remoteHostId}</strong> был успешно загружен файл с именем ${req.fileName}`);
            }
        }
    }

    function requestTypeComplete() {
        preparingVisualizationDownloadFiles.preparingVisualizationComplete(redis, req.taskIndex, function(err, data) {
            if (err) return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                showNotify(socketIoS, 'success', `Источник №<strong>${remoteHostId}</strong>, передача файлов завершена`);

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

                let taskIndex = (~req.taskIndex.indexOf(':')) ? req.taskIndex.split(':')[1] : req.taskIndex;
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
                    showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);
                });
            }
        });
    }

    function requestTypeUpdateProgress() {
        preparingVisualizationDownloadFiles.preparingVisualizationUpdateProgress(redis, remoteHostId, function(err, data) {
            if (err) return showNotify(socketIoS, 'danger', 'Неопределенная ошибка, контроль загрузки файлов не возможен');

            if (Object.keys(data).length > 0) {
                socketIoS.emit('update the download progress', { processingType: 'showInformationDownload', information: data });
            }
        });
    }
};