/*
 * Набор модулей для обработки событий, генерируемых при передаче файлов
 * 
 * после обработки модуля routeWebsocket.route()
 *
 * Версия 0.2, дата релиза 24.07.2018
 * */

'use strict';

const fs = require('fs');
const mv = require('mv');
const exec = require('child_process').exec;
const async = require('async');
const md5File = require('md5-file/promise');

const debug = require('debug')('processingToDownloadFiles');

const config = require('../../configure');
const errorsType = require('../../errors/errorsType');
const objWebsocket = require('../../configure/objWebsocket.js');
const writeLogFile = require('../writeLogFile');
const globalObject = require('../../configure/globalObject');
const actionWhenReceivingCancel = require('./actionWhenReceivingCancel');
const checkQueueTaskDownloadFiles = require('./checkQueueTaskDownloadFiles');
const actionWhenReceivingComplete = require('./actionWhenReceivingComplete');
const actionWhenReceivingFileReceived = require('./actionWhenReceivingFileReceived');
const actionWhenReceivingFileNotReceived = require('./actionWhenReceivingFileNotReceived');
const actionWhenRetransmissionReceivingFile = require('./actionWhenRetransmissionReceivingFile');

/**
 * Модуль осуществляющий действия для подготовки файлов к приему
 * 
 * @param {*} redis дискриптор соединения с БД
 * @param {*} objData объект содержащий даннные
 * @param {*} sourceID идентификатор источника
 * @param {*} callback функция обратного вызова
 */
module.exports.ready = function(redis, objData, sourceID, callback) {
    let wsConnection = objWebsocket[`remote_host:${sourceID}`];
    let taskIndex = objData.info.taskIndex;

    let objResponse = {
        'messageType': 'download files',
        'info': {
            'processing': 'ready',
            'taskIndex': taskIndex
        }
    };

    debug('------------ RESIVED MESSAGE "ready" for Moth_go ---------------');
    debug(objData);

    //удаляем временный файл если он есть
    debug('1. удаляем временный файл если он есть');

    fs.access(`/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${wsConnection.remoteAddress}.tmp`, fs.constants.R_OK, (err) => {
        if (!err) fs.unlink(`/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${wsConnection.remoteAddress}.tmp`);
    });

    new Promise((resolve, reject) => {
        async.waterfall([
            //получаем краткое название источника
            function(cb) {

                debug('2. получаем краткое название источника');

                redis.hget(`remote_host:settings:${sourceID}`, 'shortName', (err, shortSourceName) => {
                    if (err) cb(err);
                    else cb(null, shortSourceName);
                });
            },
            //формируем массив с данными о расположении загружаемых файлов
            function(shortSourceName, cb) {

                debug(shortSourceName);
                debug('3. формируем массив с данными о расположении загружаемых файлов');

                let newArray = shortSourceName.split(' ');
                let sourceIdShortName = newArray.join('_');

                redis.hget(`task_filtering_all_information:${taskIndex}`, 'filterSettings', (err, filterSetting) => {
                    if (err) return cb(err);

                    let objSettings = JSON.parse(filterSetting);

                    let dateTimeStart = objSettings.dateTimeStart.replace(' ', '_');
                    let dateTimeEnd = objSettings.dateTimeEnd.replace(' ', '_');
                    let arrayDayMonthYear = (objSettings.dateTimeStart.split(' ')[0]).split('.');
                    let directory = `${dateTimeStart}_${dateTimeEnd}_${taskIndex}`;

                    let array = [
                        `${sourceID}-${sourceIdShortName}/`,
                        arrayDayMonthYear[2] + '/',
                        arrayDayMonthYear[1] + '/',
                        arrayDayMonthYear[0] + '/',
                        directory,
                        ''
                    ];

                    cb(null, array);
                });
            },
            //выполняем формирование директорий
            function(arrayDownloadDirectoryName, cb) {

                debug(arrayDownloadDirectoryName);
                debug('4. выполняем формирование директорий');

                let sourceId = arrayDownloadDirectoryName.splice(0, 1);
                let mainDownloadDirectoryName = '/' + config.get('downloadDirectory:directoryName') + '/';

                async.reduce(arrayDownloadDirectoryName, sourceId, (memo, item, done) => {
                    fs.lstat(mainDownloadDirectoryName + memo, (err) => {
                        if (err) {
                            fs.mkdir(mainDownloadDirectoryName + memo, (err) => {
                                if (err) done(err);
                                else done(null, memo + item);
                            });
                        } else {
                            done(null, memo + item);
                        }
                    });
                }, (err, directory) => {
                    if (err) return cb(err);

                    let uploadDirectoryFiles = mainDownloadDirectoryName + directory;
                    cb(null, uploadDirectoryFiles);
                });
            },
            //изменяем в таблице task_filtering_all_information:* ряд значений
            function(uploadDirectoryFiles, cb) {

                debug(uploadDirectoryFiles);
                debug('5. изменяем в таблице task_filtering_all_information:* ряд значений');

                redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                    'uploadFiles': 'in line',
                    'uploadDirectoryFiles': uploadDirectoryFiles
                }, (err) => {
                    if (err) cb(err);
                    else cb(null);
                });
            }
        ], function(err) {
            if (err) reject(err);
            else resolve(null, true);
        });
    }).then(() => {

        debug('EVENT "READY"');
        debug('SEND SUCCESS MESSAGE TO MOTH_GO');
        debug(objResponse);

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(null);
    }).catch((err) => {
        writeLogFile.writeLog('\t' + err.toString());
        objResponse.info.processing = 'cancel';

        debug('EVENT "READY"');
        debug('SEND ERROR MESSAGE TO MOTH_GO');
        debug(objResponse);

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(err);
    });
};

//обработка пакета JSON полученного с источника и содержащего имя отправляемого файла
module.exports.execute = function(redis, objData, sourceID, callback) {

    debug('EVENT EXECUTE');
    debug(objData);

    let wsConnection = objWebsocket[`remote_host:${sourceID}`];
    if (typeof wsConnection === 'undefined') {
        throw (new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${taskIndex} не существует`));
    }

    let taskIndex = objData.info.taskIndex;
    let objResponse = {
        'messageType': 'download files',
        'info': {
            'processing': 'waiting for transfer',
            'taskIndex': taskIndex
        }
    };

    new Promise((resolve, reject) => {

        debug('1. изменяем статус uploadFiles в таблице task_filtering_all_information:');

        redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'loaded', (err) => {
            if (err) reject(err);
            else resolve(null);
        });
    }).then(() => {
        //изменяем информацию о выполняемой задаче (processingTask)
        globalObject.modifyData('processingTasks', taskIndex, [
            ['status', 'loaded'],
            ['timestampModify', +new Date()]
        ]);

        debug('globalObject.modifyData');
        debug(globalObject.getData('processingTasks', taskIndex));

    }).then(() => {
        redis.hget(`task_filtering_all_information:${taskIndex}`, 'uploadDirectoryFiles', (err, uploadDirectoryFiles) => {
            if (err) throw (err);

            //добавляем информацию о загружаемом файле
            globalObject.setData('downloadFilesTmp', sourceID, {
                'taskIndex': taskIndex,
                'fileName': objData.info.fileName,
                'fileHash': objData.info.fileHash, //хеш файла в md5
                'fileFullSize': objData.info.fileSize, //полный размер файла в байтах
                'fileChunkSize': (+objData.info.fileSize / 100), //размер в байтах одного %
                'fileUploadedSize': 0, //загруженный объем файла
                'fileSizeTmp': 0, //временный размер файла
                'fileUploadedPercent': 0, //объем загруженного файла в %
                'uploadDirectoryFiles': uploadDirectoryFiles //путь до директории в которой будут сохранятся файлы
            });

            debug('globalObject.setData (downloadFilesTmp)');
            debug(globalObject.getData('downloadFilesTmp', sourceID));

        });
    }).then(() => {
        debug('EVENT "EXECUTE"');
        debug('SEND SUCCESS MESSAGE TO MOTH_GO');
        debug(objResponse);

        objResponse.info.fileName = objData.info.fileName;

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(null);
    }).catch((err) => {
        writeLogFile.writeLog('\tError: ' + err.toString());
        objResponse.info.processing = 'cancel';

        debug('EVENT "EXECUTE"');
        debug('SEND ERROR MESSAGE TO MOTH_GO');
        debug(objResponse);

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(err);
    });
    /*.then((remoteHostIP) => {

            debug('2. получили IP адрес источника ' + remoteHostIP);

            /*
             * 'taskIndex' - id задачи
             * 'fileName' - имя загружаемого файла
             * 'fileHash' - хеш файла
             * 'fileFullSize' - полный размер файла
             * 'fileChunkSize' : размер 1%, для подсчета % загрузки
             * 'fileUploadedSize' - загруженный размер файла
             * 'fileSizeTmp' - временный размер файла
             * 'fileUploadedPercent' - объем загруженного файла в %
             * */
    /*objGlobal.downloadFilesTmp[remoteHostIP] = {
            'taskIndex': taskIndex,
            'fileName': objData.info.fileName,
            'fileHash': objData.info.fileHash,
            'fileFullSize': +objData.info.fileSize,
            'fileChunkSize': Math.ceil(+objData.info.fileSize / 100),
            'fileUploadedSize': 0,
            'fileSizeTmp': 0,
            'fileUploadedPercent': 0
        };
    })*/

};

//обработка пакета JSON полученного с источника и подтверждающего об окончании передачи указанного файла
module.exports.executeCompleted = function(redis, self, sourceID, callback) {
    let taskIndex = self.info.taskIndex;
    let objResponse = {
        'messageType': 'download files',
        'info': {
            'processing': 'execute success',
            'taskIndex': taskIndex,
            'fileName': self.info.fileName
        }
    };

    let wsConnection = objWebsocket[`remote_host:${sourceID}`];
    if (typeof wsConnection === 'undefined') {
        throw (new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${taskIndex} не существует`));
    }

    let infoDownloadFile = globalObject.getData('downloadFilesTmp', sourceID);
    let fileTmp = `/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${remoteAddress}.tmp`

    //переименование временного файла /uploading_with_<ip_адрес> в текущий загружаемый файл
    function fileRename(remoteAddress, countingRecursiveLoops, cb) {
        //ограничиваем рекурсию и выбрасываем ошибку
        if (countingRecursiveLoops === 2000) {
            return cb(new errorsType.errorLoadingFile('Ошибка при загрузке файла ' + objDownloadFiles.fileName));
        }

        new Promise((resolve, reject) => {
            fs.lstat(fileTmp, (err, fileSettings) => {
                if (err) return resolve(false);
                if (fileSettings.size !== infoDownloadFile.fileFullSize) return resolve(false);

                return true;
            });
        }).then((fileExist) => {
            if (!fileExist) return fileRename(remoteAddress, infoDownloadFile.uploadDirectoryFiles, ++countingRecursiveLoops, cb);

            return;
        }).md5File(fileTmp).then(hash => {
            return new Promise((resolve, reject) => {
                if (infoDownloadFile.fileHash !== hash) {
                    return reject(new errorsType.errorLoadingFile(`Ошибка при загрузке файла ${objDownloadFiles.fileName}`));
                }

                mv(fileTmp, `${infoDownloadFile.uploadDirectoryFiles}/${infoDownloadFile.fileName}`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }).then(() => {
            cb(null);
        }).catch((err) => {
            cb(err);
        });
    }

    fileRename(wsConnection.remoteAddress, 0, err => {
        if (err) {
            if (err.name !== 'ErrorLoadingFile') return callback(err);
            writeLogFile.writeLog('\t' + err.message);

            mv(fileTmp, `${uploadDirectoryFiles}/${objDownloadFiles.fileName}`, err => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());


                /** 
                 * actionWhenReceivingFileReceived уже ПЕРЕДЕЛАЛ 
                 * НУЖНО переделать actionWhenReceivingFileNotReceived
                 * и сгенерировать событие для UI о приеме файла 
                 * (СОБЫТИЯ генерирует модуль routingRequestsDownloadFiles)
                 */
                actionWhenReceivingFileNotReceived(redis, self, function(err) {
                    if (err) return writeLogFile.writeLog('\tError: ' + err.toString());

                    objResponse.info.processing = 'execute failure';
                    wsConnection.sendUTF(JSON.stringify(objResponse));
                    callback(null);
                });
            });
        } else {
            actionWhenReceivingFileReceived(redis, taskIndex, sourceID, err => {
                if (err) return writeLogFile.writeLog('\tError: ' + err.toString());

                wsConnection.sendUTF(JSON.stringify(objResponse));
                callback(null);
            });
        }
    });
};

//обработка пакета JSON полученного с источника и содержащего информацию о количестве успешно или неуспешно переданных файлов
module.exports.complete = function(redis, self, wsConnection, callback) {
    actionWhenReceivingComplete(redis, self.taskIndex, function(err, ...spread) {
        if (err) {
            if (typeof objGlobal.downloadFilesTmp[wsConnection.remoteAddress] !== 'undefined') {
                delete objGlobal.downloadFilesTmp[wsConnection.remoteAddress];
            }
            callback(err);
        } else {
            //проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
            checkQueueTaskDownloadFiles(redis, self, function(err, objTaskIndex) {
                if (err) {
                    callback(err);
                } else {
                    if (objTaskIndex !== false && (typeof objTaskIndex === 'object')) {
                        wsConnection.sendUTF(JSON.stringify(objTaskIndex));
                    }
                    if (typeof spread[0] === 'undefined') {
                        callback(null);
                    } else {
                        callback(null, spread[0]);
                    }
                }
            });
        }
    });
};

//обработка пакета JSON полученного с источника и информирующего об отмене передачи файлов вызванном какой либо ошибкой
module.exports.cancel = function(redis, self, wsConnection, callback) {
    actionWhenReceivingCancel(redis, self.taskIndex, function(err) {
        if (err) {
            if (typeof objGlobal.downloadFilesTmp[wsConnection.remoteAddress] !== 'undefined') {
                delete objGlobal.downloadFilesTmp[wsConnection.remoteAddress];
            }
            callback(err);
        } else {
            callback(null);
        }
    });
};