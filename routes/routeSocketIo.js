/*
 * Модуль маршрутизации данных передаваемых через socket.io
 *
 * Версия 0.21, дата релиза 28.08.2018
 * */

'use strict';

const fs = require('fs');
const path = require('path');
const debug = require('debug')('routeSocketIo.js');

const showNotify = require('../libs/showNotify');
const controllers = require('../controllers');
const writeLogFile = require('../libs/writeLogFile');
const globalObject = require('../configure/globalObject');
const getListSources = require('../libs/helpers/getListSources');
const checkAccessRights = require('../libs/users_management/checkAccessRights');
const listParametersSearch = require('../libs/listParametersSearch');
const importSetupHostFileXml = require('../libs/importSetupHostFileXml');
const getListsTaskProcessing = require('../libs/getListsTaskProcessing');
const informationForTaskIndex = require('../libs/informationForTaskIndex');
const getTaskStatusForJobLogPage = require('../libs/getTaskStatusForJobLogPage');
const informationForChoiseSource = require('../libs/management_choise_source/informationForChoiseSource');
const informationForPageLogError = require('../libs/management_log_error/informationForPageLogError');
const informationForPageLogFilter = require('../libs/management_log_filter/informationForPageLogFilter');
const routingRequestDownloadFiles = require('./routing_requests/routingRequestsDownloadFiles');
const preparingFileDownloadRequest = require('./processing_socketio/preparingFileDownloadRequest');
const getNextChunkListFilteringFiles = require('../libs/management_download_files/getNextChunkListFilteringFiles');
const informationForPageUploadedFiles = require('../libs/management_uploaded_files/informationForPageUploadedFiles');
const checkAccessRightsUsersMakeChangesTask = require('../libs/users_management/checkAccessRightsUsersMakeChangesTask');

const processingUser = require('./processing_socketio/processingUser');
const processingGroup = require('./processing_socketio/processingGroup');
const processingSource = require('./processing_socketio/processingSource');
const processingDashboard = require('./processing_socketio/processingDashboard');
const processingChangeTaskStatus = require('./processing_socketio/processingChangeTaskStatus');
const processingExecuteFiltering = require('./processing_socketio/processingExecuteFiltering');
const processingStopTaskFiltering = require('./processing_socketio/processingStopTaskFiltering');
const processingStartTaskFiltering = require('./processing_socketio/processingStartTaskFiltering');
const processingResumeTaskFiltering = require('./processing_socketio/processingResumeTaskFiltering');
const processingInformationTaskIndex = require('./processing_socketio/processingInformationTaskIndex');
const processingDeleteTaskInformation = require('./processing_socketio/processingDeleteTaskInformation');
const processingGetListFilesResultFiltering = require('./processing_socketio/processingGetListFilesResultFiltering');

const redis = controllers.connectRedis();

/**
 * генератор событий
 * 
 * @param {*} socketIoS 
 * @param {*} remoteHostId 
 * @param {*} stringMessage 
 * @param {*} notifyMessage 
 */
module.exports.eventGenerator = function(socketIoS, remoteHostId, stringMessage, notifyMessage) {
    let sendMessageChangeTaskStatus = (taskIndex, taskType) => {

        debug('function sendMessageChangeTaskStatus...');

        let objChangeStatus = {
            'filtering': 'jobStatus',
            'upload': 'uploadFiles'
        };

        if (typeof objChangeStatus[taskType] === 'undefined') return writeLogFile.writeLog(`\tError: incorrect type 'taskType' equal to ${taskType}`);

        //сообщения об изменении статуса задач
        new Promise((resolve, reject) => {
            getTaskStatusForJobLogPage(redis, taskIndex, objChangeStatus[taskType], function(err, objTaskStatus) {
                if (err) reject(err);
                else resolve(objTaskStatus);
            });
        }).then((objTaskStatus) => {
            return new Promise((resolve, reject) => {
                getListsTaskProcessing((err, objListsTaskProcessing) => {
                    if (err) reject(err);
                    else resolve({
                        status: objTaskStatus,
                        lists: objListsTaskProcessing
                    });
                });
            });
        }).then((obj) => {

            debug(obj);

            socketIoS.emit('change object status', {
                processingType: 'showChangeObject',
                informationPageJobLog: obj.status,
                informationPageAdmin: obj.lists
            });
        }).catch((err) => {
            writeLogFile.writeLog('\tError: ' + err.toString());
            showNotify(socketIoS, 'danger', `111 Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль загрузки файлов не возможен`);
        });
    };

    let obj = {
        'pong': function() {
            //для главной странице
            getListSources((err, objListSources) => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                else socketIoS.emit('status list sources', { statusListSources: objListSources });
            });
        },
        'information': function() {

            //debug(`remoute host ${remoteHostId}`);

            socketIoS.emit('new information message', { sourceId: remoteHostId });
        },
        'filtering': function() {
            if (stringMessage.info.processing === 'start') {

                if ((typeof(stringMessage.info.numberMessageParts) === 'undefined')) return;
                if (stringMessage.info.numberMessageParts[0] !== stringMessage.info.numberMessageParts[1]) return;

                showNotify(socketIoS, 'success', `Начало фильтрации на источнике №<strong>${remoteHostId}</strong>`);

                processingExecuteFiltering.execute(stringMessage.info.taskIndex, (err, data) => {
                    if (err) {
                        writeLogFile.writeLog('\tError: ' + err.toString());
                        showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль фильтрации сетевого трафика не возможен`);
                        return;
                    }

                    socketIoS.emit('filtering execute', { processingType: 'showInformationFilter', information: data });

                    //сообщения об изменении статуса задач
                    sendMessageChangeTaskStatus(stringMessage.info.taskIndex, 'filtering');
                });
            }

            if (stringMessage.info.processing === 'execute') {

                debug(`FILTERING FILES: remoteHostId = ${remoteHostId}`);

                processingExecuteFiltering.execute(stringMessage.info.taskIndex, function(err, data) {
                    if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                    else socketIoS.emit('filtering execute', { processingType: 'showInformationFilter', information: data });
                });
            }

            if (stringMessage.info.processing === 'complete') {
                processingExecuteFiltering.execute(stringMessage.info.taskIndex, function(err, data) {
                    if (err) {
                        writeLogFile.writeLog('\tError: ' + err.toString());
                        showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль фильтрации сетевого трафика не возможен`);
                        return;
                    }

                    socketIoS.emit('filtering execute', { processingType: 'showInformationFilter', information: data });

                    showNotify(socketIoS, 'success', `Завершение фильтрации на источнике №<strong>${remoteHostId}</strong>`);
                    socketIoS.emit('filtering stop', { processingType: 'showInformationFilter', information: data });

                    //сообщения об изменении статуса задач
                    sendMessageChangeTaskStatus(stringMessage.info.taskIndex, 'filtering');
                });
            }

            if (stringMessage.info.processing === 'stop') {
                processingExecuteFiltering.execute(stringMessage.info.taskIndex, function(err, data) {
                    if (err) {
                        writeLogFile.writeLog('\tError: ' + err.toString());
                        showNotify(socketIoS, 'danger', `Неопределенная ошибка источника №<strong>${remoteHostId}</strong>, контроль фильтрации сетевого трафика не возможен`);
                        return;
                    }

                    showNotify(socketIoS, 'success', `Фильтрация на источнике №<strong>${remoteHostId}</strong> успешно остановлена`);
                    socketIoS.emit('filtering stop', { processingType: 'showInformationFilter', information: data });

                    //сообщения об изменении статуса задач
                    sendMessageChangeTaskStatus(stringMessage.info.taskIndex, 'filtering');
                });
            }
        },
        'download files': function() {
            routingRequestDownloadFiles({
                redis: redis,
                socketIoS: socketIoS,
                req: stringMessage,
                remoteHostId: remoteHostId,
                notifyMessage: notifyMessage
            });
        },
        'error': function() {
            let objErrorMessage = {
                400: `Некорректный запрос к источнику №<striong>${remoteHostId}</strong>`,
                401: `На источнике №<string>${remoteHostId}</strong> нет файлов для экспорта`,
                403: `Ошибка при авторизации с источником №<string>${remoteHostId}</strong>`,
                404: `Страница не найденна, источник №<string>${remoteHostId}</strong>`,
                405: `Неожиданный метод запроса, источник №<string>${remoteHostId}</strong>`,
                406: `Приняты некорректные данные, источник №<string>${remoteHostId}</strong>`,
                409: `Несовпадение идентификатора задачи, источник №<string>${remoteHostId}</strong>`,
                410: `На источнике №<string>${remoteHostId}</strong> превышен максимальный лимит одновременно запущенных задач`,
                412: `Источником №<string>${remoteHostId}</strong> приняты некорректные пользовательские данные`,
                413: `На источнике №<string>${remoteHostId}</strong> не найдены файлы сетевого трафика, удовлетворяющие заданному временному интервалу`,
                414: `Ошибка остановки процесса выполнения загрузки файлов, источник №<string>${remoteHostId}</strong>`,
                415: `На источнике №<string>${remoteHostId}</strong> превышено количество циклов повторной передачи файлов принятых с ошибкой`,
                500: `Неопределенная ошибка сервера, источник №<string>${remoteHostId}</strong>`,
                501: `Невозможно выполнить загрузку файлов с источника №<strong>${remoteHostId}</strong>`
            };

            if ((stringMessage.errorCode === 400) || (stringMessage.errorCode === 406)) {
                let tasksIndex = globalObject.getData('processingTasks');
                for (let taskID in tasksIndex) {

                    debug(`taskID: ${taskID} === this.taskId: ${stringMessage.taskId}`);

                    if (taskID === stringMessage.taskId) sendMessageChangeTaskStatus(stringMessage.taskId, tasksIndex[taskID].taskType);
                }
            }

            let errMsg = (stringMessage.errorMessage === null) ? objErrorMessage[stringMessage.errorCode] : stringMessage.errorMessage;

            showNotify(socketIoS, 'danger', errMsg);
        },
        'close': function() {
            //для главной странице
            getListSources((err, objListSources) => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                else socketIoS.emit('status list sources', { statusListSources: objListSources });
            });
        }
    };

    if (typeof obj[stringMessage.messageType] !== 'undefined') obj[stringMessage.messageType]();
};

//обработчик события по загрузке XML файла
module.exports.uploadFile = function(socketIo, ss) {
    ss(socketIo).on('upload file sources setting', function(stream, data) {
        let filename = (__dirname.substr(0, (__dirname.length - 6)) + 'uploads/') + path.basename(data.name);
        let tempFile = fs.createWriteStream(filename, { flags: 'w', defaultEncoding: 'utf8', autoClose: true });

        stream.pipe(tempFile);

        tempFile.on('close', function() {
            checkAccessRights(socketIo, 'management_sources', 'create', function(trigger) {
                if (trigger === true) {
                    importSetupHostFileXml.importFileSetupHost('/uploads/' + path.basename(data.name), function(err, result) {
                        if (err) showNotify(socketIo, 'danger', `Неопределенный формат файла <strong>${data.name}</strong>, импорт данных невозможен`);
                        if (result !== undefined) showNotify(socketIo, 'info', `Всего источников <strong>${result.allHosts}</strong>, успешно загруженно <strong>${result.loadHosts}</strong>`);
                    });
                } else {
                    showNotify(socketIo, 'danger', 'Имя пользователя не определено, импорт источников не возможен');
                }
            });
        });
    });
};

//обработчик типовых событий
module.exports.eventHandling = function(socketIo) {

    /*
     * УПРАВЛЕНИЕ ГРУППАМИ ПОЛЬЗОВАТЕЛЕЙ
     * */
    /* редактирование группы */
    socketIo.on('edit group', function(data) {
        checkAccessRights(socketIo, 'management_groups', 'edit', function(trigger) {
            if (trigger) processingGroup.editGroup(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, редактирование группы не возможно');
        });
    });

    /* добавление группы */
    socketIo.on('add group', function(data) {
        checkAccessRights(socketIo, 'management_groups', 'create', function(trigger) {
            if (trigger) processingGroup.addGroup(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, создание нового пользователя не возможно');
        });
    });

    /* удаление группы */
    socketIo.on('del group', function(data) {
        checkAccessRights(socketIo, 'management_groups', 'delete', function(trigger) {
            if (trigger) processingGroup.deleteGroup(socketIo, data);
            else showNotify(socketIo, 'danger', 'Ошибка: имя пользователя не определено, удаление не возможно');
        });
    });

    /*
     * УПРАВЛЕНИЕ ПОЛЬЗОВАТЕЛЯМИ
     * */
    /* добавление или редактирование пользователя */
    socketIo.on('add or edit user', function(data) {
        if (data.actionType === 'create') {
            checkAccessRights(socketIo, 'management_users', 'create', function(trigger) {
                if (trigger) processingUser.addUser(socketIo, data);
                else showNotify(socketIo, 'danger', 'Имя пользователя не определено, создание нового пользователя не возможно');
            });
        }

        if (data.actionType === 'edit') {
            checkAccessRights(socketIo, 'management_users', 'edit', function(trigger) {
                if (trigger) processingUser.editUser(socketIo, data);
                else showNotify(socketIo, 'danger', 'Имя пользователя не определено, не возможно редактировать информацию о пользователе');
            });
        }
    });

    /* удаление пользователя */
    socketIo.on('delete user', function(data) {
        checkAccessRights(socketIo, 'management_users', 'delete', function(trigger) {
            if (trigger) processingUser.deleteUser(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, удаление пользователя не возможно');
        });
    });

    /*
     * УПРАВЛЕНИЕ УДАЛЕННЫМИ ИСТОЧНИКАМИ
     * */
    /* добавление информации об источнике */
    socketIo.on('add or edit setting', function(data) {
        let actionType;
        if (data.processingType === 'addSource') actionType = 'create';
        if (data.processingType === 'editSource') actionType = 'edit';

        checkAccessRights(socketIo, 'management_sources', actionType, function(trigger) {
            if (trigger) processingSource.addEditSoutce(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, не возможно создать новый источник');
        });
    });

    /* вывод полной информации о выбранном источнике */
    socketIo.on('get full information source', function(data) {
        checkAccessRights(socketIo, 'management_sources', 'read', function(trigger) {
            if (trigger) processingSource.readFullInformationSource(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, вывод информации об источнике не возможнен');
        });
    });

    /* вывод краткой информации о выбранном источнике */
    socketIo.on('get short information source', function(data) {
        checkAccessRights(socketIo, 'management_sources', 'read', function(trigger) {
            if (trigger) processingSource.readShortInformationSource(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, вывод информации об источнике не возможнен');
        });
    });

    /* удаление выбранного источника */
    socketIo.on('delete source', function(data) {
        checkAccessRights(socketIo, 'management_sources', 'delete', function(trigger) {
            if (trigger) processingSource.deleteSource(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, удаление источника не возможно');
        });
    });

    /*
     * УПРАВЛЕНИЕ ДАЧБОРДАМИ
     * */
    socketIo.on('change source for user', function(data) {
        checkAccessRights(socketIo, 'management_dashboard', 'edit', function(trigger) {
            if (trigger) processingDashboard.editDashboardSources(socketIo, data);
            else showNotify(socketIo, 'danger', 'Имя пользователя не определено, управление виджетами не возможно');
        });
    });

    /*
     * УПРАВЛЕНИЕ КОНКРЕТНЫМ ИСТОЧНИКОМ
     * */
    /* получить всю информацию по выбранному источнику */
    socketIo.on('get all information for source id', function(data) {
        informationForChoiseSource.getAllInformationSource(redis, data.sourceId, function(obj) {
            socketIo.emit('all information for source id', { processingType: 'showInformationSource', information: obj });
        });
    });

    /* пллучить информацию для виджета */
    socketIo.on('get information for source id', (data) => {
        informationForChoiseSource.getAllInformationSource(redis, data.sourceId, function(obj) {
            socketIo.emit('information widgets', { processingType: 'showInformationSource', information: obj });
        });
    });

    socketIo.on('disconnect', function() {});

    /*
     * УПРАВЛЕНИЕ ЗАДАЧАМИ ПО ЗАГРУЗКЕ НАЙДЕННЫХ ФАЙЛОВ
     * */

    //получить список всех файлов найденных в результате фильтрации 
    socketIo.on('get list all files obtained result filtering', (data) => {
        processingGetListFilesResultFiltering(redis, data, (err, resultObj) => {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
            } else {
                socketIo.emit('list all files obtained result filtering', resultObj);
            }
        });
    });

    /* скачать все файлы созданные в результате фильтрации */
    socketIo.on('download all files obtained result filtering', function(data) {
        debug('REQUEST DOWNLOAD ---ALL--- FILES');
        debug(data);

        checkAccessRights(socketIo, 'management_tasks_filter', 'import', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для загрузки найденных файлов');

            data.listFiles = [];
            preparingFileDownloadRequest(data, socketIo, redis, (err) => {
                if (err) {
                    let errMsgLog = err.toString();
                    let errMsg = `222 Неопределенная ошибка источника №<strong>${data.sourceId}</strong>, контроль загрузки файлов не возможен`;
                    if (err.name) {
                        errMsgLog = err.message;
                        errMsg = err.message;
                    }

                    writeLogFile.writeLog('\tError: ' + errMsgLog);
                    showNotify(socketIo, 'danger', errMsg);
                }
            });
        });
    });

    /* скачать файлы выбранные пользователем и полученые в результате фильтрации */
    socketIo.on('download choose files obtained result filtering', function(data) {
        debug('REQUEST DOWNLOAD ---CHOOSE--- FILES');
        debug(data);

        checkAccessRights(socketIo, 'management_tasks_filter', 'import', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для загрузки найденных файлов');

            preparingFileDownloadRequest(data, socketIo, redis, (err) => {
                if (err) {
                    let errMsgLog = err.toString();
                    let errMsg = `333 Неопределенная ошибка источника №<strong>${data.sourceId}</strong>, контроль загрузки файлов не возможен`;
                    if (err.name) {
                        errMsgLog = err.message;
                        errMsg = err.message;
                    }

                    writeLogFile.writeLog('\tError: ' + errMsgLog);
                    showNotify(socketIo, 'danger', errMsg);
                }
            });
        });
    });

    /* остановить загрузку файлов */
    socketIo.on('stop download files', function(data) {
        debug('REQUEST ---STOP--- DOWNLOAD FILES');
        debug(data);

        checkAccessRights(socketIo, 'management_tasks_filter', 'stop', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для загрузки найденных файлов');


        });
    });

    /* отменить задачу по загрузке файлов */
    socketIo.on('cancel download files', function(data) {
        debug('REQUEST ---CANCEL--- DOWNLOAD FILES');
        debug(data);

        checkAccessRights(socketIo, 'management_tasks_filter', 'cancel', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для загрузки найденных файлов');

        });
    });

    /* запрос на следующий кусочек списка найденных в результате фильтрации файлов (для модального окна со списком найденных файлов) */
    socketIo.on('next chunk files filter result', function(data) {
        debug('REQUEST ---- NEXT CHUNK LIST FILES ----');
        debug(data);

        getNextChunkListFilteringFiles(data, socketIo, redis, (err) => {
            if (err) writeLogFile.writeLog('\tError: ' + err.toString());
        });
    });

    /* остановить загрузку файлов */
    /*socketIo.on('stop download files', function(data) {
        checkAccessRights(socketIo, 'management_tasks_import', 'stop', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для останова загрузки найденных файлов');

            processingFilesUpload.stop(socketIo, data.taskIndex, function(err, sourceId) {
                if (err) return showNotify(socketIo, 'danger', err.message);

                showNotify(socketIo, 'success', `Запрос на остановку задачи по выгрузке сетевого трафика с источника №<strong>${sourceId}</strong> успешно отправлен`);

                let taskIndex = (~data.taskIndex.indexOf(':')) ? data.taskIndex.split(':')[1] : data.taskIndex;
                //сообщения об изменении статуса задач
                new Promise((resolve, reject) => {
                    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', function(err, objTaskStatus) {
                        if (err) reject(err);
                        else resolve(objTaskStatus);
                    });
                }).then((objTaskStatus) => {
                    return new Promise((resolve, reject) => {
                        getListsTaskProcessing((err, objListsTaskProcessing) => {
                            if (err) reject(err);
                            else resolve({
                                status: objTaskStatus,
                                lists: objListsTaskProcessing
                            });
                        });
                    });
                }).then((obj) => {
                    //только для пользователя инициировавшего загрузку
                    socketIo.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });

                    //для всех пользователей
                    socketIo.broadcast.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });


                    debug('--------- STOP --------');
                    debug(obj.status);
                    debug(obj.lists);
                    debug('----------------------');
                }).catch((err) => {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    showNotify(socketIo, 'danger', `666 Неопределенная ошибка источника №<strong>${sourceId}</strong>, контроль загрузки файлов не возможен`);
                });
            });
        });
    });

    /* возобновить загрузку файлов */
    /*socketIo.on('resume download files', function(data) {
        checkAccessRights(socketIo, 'management_tasks_import', 'resume', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для возобновления загрузки файлов');

            processingFilesUpload.resume(socketIo, data.taskIndex, function(err, sourceId) {
                if (err) return showNotify(socketIo, 'danger', err.message);

                showNotify(socketIo, 'success', `Запрос на продолжение выгрузки сетевого трафика с источника №<strong>${sourceId}</strong> успешно отправлен`);

                let taskIndex = (~data.taskIndex.indexOf(':')) ? data.taskIndex.split(':')[1] : data.taskIndex;
                //сообщения об изменении статуса задач
                new Promise((resolve, reject) => {
                    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', function(err, objTaskStatus) {
                        if (err) reject(err);
                        else resolve(objTaskStatus);
                    });
                }).then((objTaskStatus) => {
                    return new Promise((resolve, reject) => {
                        getListsTaskProcessing((err, objListsTaskProcessing) => {
                            if (err) reject(err);
                            else resolve({
                                status: objTaskStatus,
                                lists: objListsTaskProcessing
                            });
                        });
                    });
                }).then((obj) => {
                    //только для пользователя инициировавшего загрузку
                    socketIo.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });

                    //для всех пользователей
                    socketIo.broadcast.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });


                    debug('------- RESUME --------');
                    debug(obj.status);
                    debug(obj.lists);
                    debug('----------------------');
                }).catch((err) => {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    showNotify(socketIo, 'danger', `777 Неопределенная ошибка источника №<strong>${sourceId}</strong>, контроль загрузки файлов не возможен`);
                });
            });
        });
    });

    /* отменить задачу по загрузке файлов */
    /*socketIo.on('cancel download files', function(data) {
        checkAccessRights(socketIo, 'management_tasks_import', 'cancel', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для отмены загрузки файлов');

            processingFilesUpload.cancel(socketIo, data.taskIndex, function(err, sourceId) {
                if (err) return showNotify(socketIo, 'danger', err.message);

                showNotify(socketIo, 'success', 'Отмена ожидающей в очереди задачи на выгрузку сетевого трафика с источника №<strong>' + sourceId + '</strong>');

                let taskIndex = (~data.taskIndex.indexOf(':')) ? data.taskIndex.split(':')[1] : data.taskIndex;
                //сообщения об изменении статуса задач
                new Promise((resolve, reject) => {
                    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', function(err, objTaskStatus) {
                        if (err) reject(err);
                        else resolve(objTaskStatus);
                    });
                }).then((objTaskStatus) => {
                    return new Promise((resolve, reject) => {
                        getListsTaskProcessing((err, objListsTaskProcessing) => {
                            if (err) reject(err);
                            else resolve({
                                status: objTaskStatus,
                                lists: objListsTaskProcessing
                            });
                        });
                    });
                }).then((obj) => {
                    //только для пользователя инициировавшего загрузку
                    socketIo.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });

                    //для всех пользователей
                    socketIo.broadcast.emit('change object status', {
                        processingType: 'showChangeObject',
                        informationPageJobLog: obj.status,
                        informationPageAdmin: obj.lists
                    });


                    debug('--------- CANCEL ---------');
                    debug(obj.status);
                    debug(obj.lists);
                    debug('----------------------');

                    //для всех пользователей кроме пользователя инициирующего отмену задачи
                    socketIo.broadcast.emit('task upload files cancel', {
                        processingType: 'showInformationDownload',
                        information: {
                            'taskIndex': data.taskIndex,
                            'sourceId': sourceId
                        }
                    });
                    //для пользователя инициирующего отмену задачи
                    socketIo.emit('task upload files cancel', {
                        processingType: 'showInformationDownload',
                        information: {
                            'taskIndex': data.taskIndex,
                            'sourceId': sourceId
                        }
                    });
                }).catch((err) => {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    showNotify(socketIo, 'danger', `888 Неопределенная ошибка источника №<strong>${sourceId}</strong>, контроль загрузки файлов не возможен`);
                });
            });
        });
    });

    /*
     * УПРАВЛЕНИЕ ЗАДАЧАМИ ФИЛЬТРАЦИИ
     * */
    /* добавить задание на фильтрацию */
    socketIo.on('add start filter', function(data) {
        processingStartTaskFiltering(redis, data.filterTask, socketIo);
    });

    /* получить информацию по выбранной задачи фильтрации */
    socketIo.on('get all information for task index', function(data) {
        checkAccessRights(socketIo, 'management_tasks_filter', 'read', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для просмотра полной информации');

            informationForTaskIndex.getAllInformationTaskIndex(redis, data.taskIndex, function(obj) {
                checkAccessRightsUsersMakeChangesTask(socketIo, redis, data.taskIndex, function(err, objAccessRights) {
                    if (err) return showNotify(socketIo, 'danger', 'Имя пользователя не определено, просмотр задач фильтрации не возможен');

                    obj.taskIndex = data.taskIndex;
                    Object.assign(obj, objAccessRights);

                    socketIo.emit('all information for task index', { processingType: 'showInformationSource', information: obj });
                });
            });
        });
    });

    /* удалить всю информацию по выбранной задаче */
    socketIo.on('delete all information for task index', function(data) {
        checkAccessRights(socketIo, 'management_tasks_filter', 'delete', function(trigger) {
            if (trigger) processingInformationTaskIndex.deleteInformation(socketIo, data, showNotify);
            else showNotify(socketIo, 'danger', 'Не достаточно прав доступа для удаления задачи');
        });
    });

    /* остановить выполняемую задачу по фильтрации */
    socketIo.on('request to stop the task filter', function(data) {
        processingStopTaskFiltering(socketIo, redis, data.taskIndex);
    });

    /* возобновить выполняемую задачу по фильтрации */
    socketIo.on('request to resume the task filter', (data) => {
        processingResumeTaskFiltering(socketIo, redis, data.taskIndex);
    });

    /* поиск задачи по заданным параметра */
    socketIo.on('search all tasks index', function(data) {
        let cookie = socketIo.request.headers.cookie.split('; ');
        let userId = cookie[1].slice(16).split('.');

        //таблица с информацией о заданиях на фильтрацию
        let objReq = {
            userId: userId[0],
            objSearchInformation: data,
            isNewReq: true,
            chunkNumber: 0
        };

        informationForPageLogFilter.getAllInformation(redis, objReq, function(objInformationTasks) {
            //набор параметров для поиска
            listParametersSearch.jobLog(redis, function(objSelectList) {
                socketIo.emit('found all tasks Index', {
                    informationTasks: objInformationTasks,
                    selectList: objSelectList
                });
            });
        });
    });

    /* обработка запроса пагинатора по задачам фильтрации (запрос на вывод следующей страницы) */
    socketIo.on('show the page number filtering', function(data) {
        let cookie = socketIo.request.headers.cookie.split('; ');
        let userId = cookie[1].slice(16).split('.');

        //таблица с информацией о заданиях на фильтрацию
        let objReq = {
            userId: userId[0],
            objSearchInformation: {},
            isNewReq: false,
            chunkNumber: data.pageNumber
        };
        informationForPageLogFilter.getAllInformation(redis, objReq, function(obj) {
            socketIo.emit('show new page', obj);
        });
    });

    /* поиск ошибок по заданным параметрам */
    socketIo.on('search all errors sources', function(data) {
        let cookie = socketIo.request.headers.cookie.split('; ');
        let userId = cookie[1].slice(16).split('.');
        //таблица с информацией о заданиях на фильтрацию
        let objReq = {
            userId: userId[0],
            objSearchInformation: data,
            isNewReq: true,
            chunkNumber: 0
        };
        informationForPageLogError(redis, objReq, function(objResult) {
            socketIo.emit('found all errors', objResult);
        });
    });

    /* обработка запроса пагинатора на вывод ошибок (запрос на вывод следующей страницы) */
    socketIo.on('show the page number error', function(data) {
        let cookie = socketIo.request.headers.cookie.split('; ');
        let userId = cookie[1].slice(16).split('.');

        //таблица с информацией о заданиях на фильтрацию
        let objReq = {
            userId: userId[0],
            objSearchInformation: {},
            isNewReq: false,
            chunkNumber: data.pageNumber
        };

        informationForPageLogError(redis, objReq, function(objResult) {
            socketIo.emit('show new page errors', objResult);
        });
    });

    /*
     * УПРАВЛЕНИЕ ИНФОРМАЦИЕЙ ПО ЗАГРУЖЕННЫМ И РАССМОТРЕННЫМ ФАЙЛАМ
     * */
    /* отметить как рассмотренные */
    socketIo.on('a mark of consideration', function(data) {
        checkAccessRights(socketIo, 'management_uploaded_files', 'status_change', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для изменение статуса загруженных файлов');

            processingChangeTaskStatus(redis, socketIo, data, function(err, numberUploadedFiles) {
                if (err) return showNotify(socketIo, 'danger', 'Не возможно изменить статус задачи');

                //socketIo.broadcast.emit('change number uploaded files', { 'numberUploadedFiles' : numberUploadedFiles });
                socketIo.emit('change number uploaded files', { 'numberUploadedFiles': numberUploadedFiles });
                showNotify(socketIo, 'success', 'Статус задачи успешно изменен');
            });
        });
    });

    /* удалить метаданные и возможно связанные с ними файлы */
    socketIo.on('to remove information about files', function(data) {
        checkAccessRights(socketIo, 'management_uploaded_files', 'delete', function(trigger) {
            if (!trigger) return showNotify(socketIo, 'danger', 'Не достаточно прав доступа для удаление метаданных по загруженным файлам');

            processingDeleteTaskInformation(redis, data, function(err, numberUploadedFiles) {
                if (err) return showNotify(socketIo, 'danger', 'Не возможно удалить метаданные');

                socketIo.broadcast.emit('change number uploaded files', { 'numberUploadedFiles': numberUploadedFiles });
                socketIo.emit('change number uploaded files', { 'numberUploadedFiles': numberUploadedFiles });
                showNotify(socketIo, 'success', 'Все метаданные по загруженным файлам были успешно удалены');
            });
        });
    });

    /* поиск информации по загруженным файлам */
    socketIo.on('search all information for uploaded files', function(data) {
        let cookie = socketIo.request.headers.cookie.split('; ');
        let userId = cookie[1].slice(16).split('.');

        //таблица с информацией о заданиях на фильтрацию
        let objReq = {
            userId: userId[0],
            objSearchInformation: data,
            isNewReq: true,
            chunkNumber: 0
        };

        informationForPageUploadedFiles.getAllInformationSearching(redis, objReq, function(err, objInformationUploadFiles) {
            if (err) showNotify(socketIo, 'danger', 'Не возможно выполнить поиск, получены некорректные данные');
            else socketIo.emit('found all tasks upload index', {
                informationTasks: objInformationUploadFiles
            });
        });
    });

    /* обработка запроса пагинатора на вывод информации по загруженным файлам */
    socketIo.on('show the page number upload files', function(data) {
        let cookie = socketIo.request.headers.cookie.split('; ');
        let userId = cookie[1].slice(16).split('.');

        //таблица с информацией о заданиях на фильтрацию
        let objReq = {
            userId: userId[0],
            objSearchInformation: {},
            isNewReq: false,
            chunkNumber: data.pageNumber
        };
        informationForPageUploadedFiles.getAllInformationSearching(redis, objReq, function(err, objInformationUploadFiles) {
            if (err) showNotify(socketIo, 'danger', 'Не возможно выполнить поиск, введенные пользователем данные не полные или некорректны');
            else socketIo.emit('show new page upload', {
                informationTasks: objInformationUploadFiles
            });
        });
    });
};