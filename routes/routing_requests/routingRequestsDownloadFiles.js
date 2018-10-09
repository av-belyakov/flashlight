/**
 * Модуль обрабатывающий типы состояний при скачивании с источников
 * отфильтрванных файлов сет. трафика
 * 
 * после обработки модуля routeSocketIo.eventGenerator()
 * 
 * Верися 0.1, дата релиза 20.02.2018 
 */

'use strict';


const showNotify = require('../../libs/showNotify');
const globalObject = require('../../configure/globalObject');
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
        writeLogFile.writeLog('\tError, not found information about task ID (download files)');

        return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
    }

    let taskIndex = req.info.taskIndex;

    if (typeof objTypeRequest[req.info.processing] === 'function') objTypeRequest[req.info.processing]();

    function requestCancel() {
        showNotify(socketIoS, 'danger', `Неопределенная ошибка, загрузка файлов с источника №<strong>${sourceID}</strong> не возможна`);
    }

    function requestTypeReady() {
        preparingVisualizationDownloadFiles.preparingVisualizationStartExecute(redis, taskIndex, sourceID, (err, data) => {
            if (err) return showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);

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
                    showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
                });
            }
        });
    }

    function requestTypeExecute() {
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
        //увеличиваем на единицу количество загруженных файлов
        globalObject.incrementNumberFiles(taskIndex, 'numberFilesUploaded');

        new Promise((resolve, reject) => {
            let obj = globalObject.getData('processingTasks', taskIndex);

            redis.hset(`task_filtering_all_information:${taskIndex}`,
                'countFilesLoaded',
                (obj.uploadInfo.numberFilesUploaded + obj.uploadInfo.numberPreviouslyDownloadedFiles) - obj.uploadInfo.numberFilesUploadedError,
                err => {
                    if (err) reject(err);
                    else resolve();
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
            showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
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
                    showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${sourceID}</strong>, контроль загрузки файлов не возможен`);
                });
            }
        });
    }

    function requestTypeUpdateProgress() {
        preparingVisualizationDownloadFiles.preparingVisualizationUpdateProgress(redis, taskIndex, sourceID, (err, data) => {
            if (err) return showNotify(socketIoS, 'danger', 'Неопределенная ошибка, контроль загрузки файлов не возможен');

            if (Object.keys(data).length > 0) {
                socketIoS.emit('update the download progress', { processingType: 'showInformationDownload', information: data });
            }
        });
    }
};