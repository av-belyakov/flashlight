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

module.exports = function({ redis, socketIoS, req, remoteHostId: sourceID, notifyMessage }) {
    let objTypeRequest = {
        'cancel': requestCancel,
        'ready': requestTypeReady,
        'execute': requestTypeExecute,
        'execute completed': requestTypeExecuteCompleted,
        'completed': requestTypeComplete,
        'update progress': requestTypeUpdateProgress
    };

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
            if (err) return showNotify(socketIoS, 'danger', `222-1 Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);

            if (Object.keys(data).length > 0) {
                showNotify(socketIoS, 'success', `Источник №<strong>${sourceID}</strong>, началась загрузка файлов`);
                socketIoS.emit('file successfully downloaded', { processingType: 'showInformationDownload', information: data });

                //сообщения об изменении статуса задач
                new Promise((resolve, reject) => {
                    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
                        if (err) {
                            writeLogFile.writeLog('\tError: function getTaskStatusForJobLogPage, ' + err.toString());

                            reject(err);
                        } else resolve(objTaskStatus);
                    });
                }).then(objTaskStatus => {
                    return new Promise((resolve, reject) => {
                        getListsTaskProcessing((err, objListsTaskProcessing) => {
                            if (err) {
                                writeLogFile.writeLog('\tError: function getListsTaskProcessing, ' + err.toString());

                                reject(err);
                            } else resolve({
                                status: objTaskStatus,
                                lists: objListsTaskProcessing
                            });
                        });
                    });
                }).then(obj => {
                    socketIoS.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });
                }).catch(err => {
                    writeLogFile.writeLog('\tError: ' + err.toString() + ', routingRequestDownloadFiles.js');
                    showNotify(socketIoS, 'danger', `333-1 Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
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
        });
    }

    function requestTypeExecuteCompleted() {
        new Promise((resolve, reject) => {
            redis.hget(`task_filtering_all_information:${taskIndex}`, 'countFilesLoaded', (err, countFilesLoaded) => {
                if (err) reject(err);
                else resolve(+countFilesLoaded);
            });
        }).then(countFilesLoaded => {
            return new Promise((resolve, reject) => {
                redis.hset(`task_filtering_all_information:${taskIndex}`, 'countFilesLoaded', ++countFilesLoaded, err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }).then(() => {
            return new Promise((resolve, reject) => {
                preparingVisualizationDownloadFiles.preparingVisualizationExecuteCompleted(redis, taskIndex, sourceID, (err, data) => {
                    if (err) reject(err);
                    else resolve(data);
                });
            });
        }).then((data) => {
            if (Object.keys(data).length > 0) {
                socketIoS.emit('file successfully downloaded', { processingType: 'showInformationDownload', information: data });
            }
        }).catch(err => {
            writeLogFile.writeLog(`\tError: ${err.toString()}`);
            showNotify(socketIoS, 'danger', `2-2-2 Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
        });
    }

    function requestTypeComplete() {
        preparingVisualizationDownloadFiles.preparingVisualizationComplete(redis, taskIndex, sourceID, (err, data) => {
            if (err) return showNotify(socketIoS, 'danger', `444-1 Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);

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
                        getCountFilesUploadNotConsidered(redis, numberUploadedFiles => {
                            //socketIoS.broadcast.emit('change number uploaded files', { 'numberUploadedFiles' : numberUploadedFiles });
                            socketIoS.emit('change number uploaded files', { 'numberUploadedFiles': numberUploadedFiles });
                        });
                    }
                }
                //сообщения об изменении статуса задач
                new Promise((resolve, reject) => {
                    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
                        if (err) {
                            writeLogFile.writeLog('\tError: ' + err.toString() + ', function getTaskStatusForJobLogPage');

                            reject(err);
                        } else resolve(objTaskStatus);
                    });
                }).then(objTaskStatus => {
                    return new Promise((resolve, reject) => {
                        getListsTaskProcessing((err, objListsTaskProcessing) => {
                            if (err) {
                                writeLogFile.writeLog('\tError: ' + err.toString() + ', function getListsTaskProcessing');

                                reject(err);
                            } else resolve({
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
                    writeLogFile.writeLog('\tError: ' + err.toString() + ', routingRequestDownloadFiles.js');
                    writeLogFile.writeLog(`\t555-1 Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
                    showNotify(socketIoS, 'danger', `555-1 Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
                });
            }
        });
    }

    function requestTypeUpdateProgress() {
        preparingVisualizationDownloadFiles.preparingVisualizationUpdateProgress(redis, taskIndex, sourceID, (err, data) => {
            if (err) return showNotify(socketIoS, 'danger', '666-1 Неопределенная ошибка, контроль загрузки файлов не возможен');

            if (Object.keys(data).length > 0) {
                socketIoS.emit('update the download progress', { processingType: 'showInformationDownload', information: data });
            }
        });
    }
};