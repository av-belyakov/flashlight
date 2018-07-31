/*
 * Набор модулей для обработки событий, генерируемых при передаче файлов
 *
 * Версия 0.2, дата релиза 24.07.2018
 * */

'use strict';

const fs = require('fs');
const mv = require('mv');
const exec = require('child_process').exec;
const async = require('async');

const debug = require('debug')('processingToDownloadFiles');

const config = require('../../configure');
const errorsType = require('../../errors/errorsType');
const objWebsocket = require('../../configure/objWebsocket.js');
const writeLogFile = require('../writeLogFile');
const actionWhenReceivingCancel = require('./actionWhenReceivingCancel');
const checkQueueTaskDownloadFiles = require('./checkQueueTaskDownloadFiles');
const actionWhenReceivingComplete = require('./actionWhenReceivingComplete');
const actionWhenReceivingFileReceived = require('./actionWhenReceivingFileReceived');
const actionWhenReceivingFileNotReceived = require('./actionWhenReceivingFileNotReceived');
const actionWhenRetransmissionReceivingFile = require('./actionWhenRetransmissionReceivingFile');

const objGlobal = {};

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

        debug('SEND SUCCESS MESSAGE TO MOTH_GO');
        debug(objResponse);

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(null);
    }).catch((err) => {
        writeLogFile.writeLog('\t' + err.toString());
        objResponse.info.processing = 'cancel';

        debug('SEND ERROR MESSAGE TO MOTH_GO');
        debug(objResponse);

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(err);
    });
};

//обработка пакета JSON полученного с источника и содержащего имя отправляемого файла
module.exports.execute = function(redis, objData, wsConnection, callback) {

    debug(objData);

    let taskIndex = objData.info.taskIndex;

    /*
     * 'taskIndex' - id задачи
     * 'fileName' - имя загружаемого файла
     * 'fileFullSize' - полный размер файла
     * 'fileChunkSize' : размер 1%, для подсчета % загрузки
     * 'fileUploadedSize' - загруженный размер файла
     * 'fileSizeTmp' - временный размер файла
     * 'fileUploadedPercent' - объем загруженного файла в %
     * */
    objGlobal.downloadFilesTmp[wsConnection.remoteAddress] = {
        'taskIndex': taskIndex,
        'fileName': objData.info.fileName,
        'fileFullSize': +objData.info.fileSize,
        'fileChunkSize': Math.ceil(+objData.info.fileSize / 100),
        'fileUploadedSize': 0,
        'fileSizeTmp': 0,
        'fileUploadedPercent': 0
    };

    redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'loaded', function(err) {
        if (err) callback(err);
        else callback(null);
    });
};

//обработка пакета JSON полученного с источника и подтверждающего об окончании передачи указанного файла
module.exports.executeCompleted = function(redis, self, wsConnection, callback) {
    if (!(~self.taskIndex.indexOf(':'))) return callback(new errorsType.errorLoadingFile('Ошибка при загрузке файла ' + objDownloadFiles.fileName));

    let taskIndexHash = self.taskIndex.split(':')[1];
    let objResponse = {
        'messageType': 'download files',
        'processing': 'file not received',
        'taskIndex': self.taskIndex,
        'fileName': self.fileName,
        'checksum': self.checksum
    };

    let objDownloadFiles = objGlobal.downloadFilesTmp[wsConnection.remoteAddress];

    //переименование временного файла /uploading_with_<ip_адрес> в текущий загружаемый файл
    function fileRename(remoteAddress, uploadDirectoryFiles, countingRecursiveLoops, func) {
        //ограничиваем рекурсию и выбрасываем ошибку
        if (countingRecursiveLoops === 2000) {
            return func(new errorsType.errorLoadingFile('Ошибка при загрузке файла ' + objDownloadFiles.fileName));
        }

        fs.lstat('/' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + remoteAddress + '.tmp', function(err, fileSettings) {
            if (err) return fileRename(remoteAddress, uploadDirectoryFiles, ++countingRecursiveLoops, func);

            if (fileSettings.size !== objDownloadFiles.fileFullSize) {
                fileRename(remoteAddress, uploadDirectoryFiles, ++countingRecursiveLoops, func);
            } else {
                exec('md5sum /' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + remoteAddress + '.tmp |awk \'{print $1}\'', function(err, stdout) {
                    if (err) return func(err);
                    if (typeof stdout !== 'string') return func(new errorsType.errorLoadingFile('Ошибка: переменная \'stdout\' не является строкой'));

                    if (objResponse.checksum === (stdout.substr(0, stdout.length - 1))) {
                        mv('/' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + remoteAddress + '.tmp',
                            uploadDirectoryFiles + '/' + objDownloadFiles.fileName,
                            function(err) {
                                if (err) func(err);
                                else func(null);
                            });
                    } else {
                        func(new errorsType.errorLoadingFile('Ошибка при загрузке файла ' + objDownloadFiles.fileName));
                    }

                    objGlobal['writeStreamLink_' + remoteAddress].end();
                    delete objGlobal['writeStreamLink_' + wsConnection.remoteAddress];
                });
            }
        });
    }

    redis.hget('task_filtering_all_information:' + taskIndexHash, 'uploadDirectoryFiles', function(err, uploadDirectoryFiles) {
        if (err) return callback(err);

        fileRename(wsConnection.remoteAddress, uploadDirectoryFiles, 0, function(err) {
            if (err) {
                if (err.name !== 'ErrorLoadingFile') return callback(err);
                writeLogFile.writeLog('\t' + err.message);

                mv('/' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + wsConnection.remoteAddress + '.tmp',
                    uploadDirectoryFiles + '/' + objDownloadFiles.fileName,
                    function(err) {
                        if (err) writeLogFile.writeLog('\t' + err.toString());

                        actionWhenReceivingFileNotReceived(redis, self, function(err) {
                            if (err) {
                                writeLogFile.writeLog('\t' + err.toString());
                            } else {
                                objResponse.processing = 'file not received';
                                wsConnection.sendUTF(JSON.stringify(objResponse));
                                callback(null);
                            }
                        });
                    });
            } else {
                actionWhenReceivingFileReceived(redis, self, function(err) {
                    if (err) {
                        writeLogFile.writeLog('\t' + err.toString());
                    } else {
                        objResponse.processing = 'file received successfully';
                        wsConnection.sendUTF(JSON.stringify(objResponse));
                        callback(null);
                    }
                });
            }
        });
    });
};

//обработка пакета JSON полученного с источника информирующего о повторной передачи неуспешно переданных файлов
module.exports.executeRetransmission = function(redis, self, wsConnection, callback) {
    /*
     * 'taskIndex' - id задачи
     * 'fileName' - имя загружаемого файла
     * 'fileFullSize' - полный размер файла
     * 'fileChunkSize' : размер 1%, для подсчета % загрузки
     * 'fileUploadedSize' - загруженный размер файла
     * 'fileSizeTmp' - временный размер файла
     * 'fileUploadedPercent' - объем загруженного файла в %
     * */
    objGlobal.downloadFilesTmp[wsConnection.remoteAddress] = {
        'taskIndex': self.taskIndex,
        'fileName': self.fileName,
        'fileFullSize': +self.fileFullSize,
        'fileChunkSize': Math.ceil(+self.fileFullSize / 100),
        'fileUploadedSize': 0,
        'fileSizeTmp': 0,
        'fileUploadedPercent': 0
    };
    callback(null);
};

//обработка пакета JSON полученного с источника и подтверждающего об окончании передачи повторно передающегося файла
module.exports.executeRetransmissionCompleted = function(redis, self, wsConnection, callback) {
    if (!(~self.taskIndex.indexOf(':'))) return callback(new errorsType.errorLoadingFile('Ошибка при загрузке файла ' + objDownloadFiles.fileName));

    let taskIndexHash = self.taskIndex.split(':')[1];
    let objResponse = {
        'messageType': 'download files',
        'processing': 'file not received',
        'taskIndex': self.taskIndex,
        'fileName': self.fileName,
        'checksum': self.checksum
    };
    let objDownloadFiles = objGlobal.downloadFilesTmp[wsConnection.remoteAddress];

    //переименование временного файла /uploading_with_<ip_адрес> в текущий загружаемый файл
    function fileRename(remoteAddress, uploadDirectoryFiles, countingRecursiveLoops, func) {
        //ограничиваем рекурсию и выбрасываем ошибку
        if (countingRecursiveLoops === 2000) {
            return func(new errorsType.errorLoadingFile('Ошибка при загрузке файла ' + objDownloadFiles.fileName));
        }

        fs.lstat('/' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + remoteAddress + '.tmp', function(err, fileSettings) {
            if (err) return fileRename(remoteAddress, uploadDirectoryFiles, ++countingRecursiveLoops, func);

            if (fileSettings.size !== objDownloadFiles.fileFullSize) {
                fileRename(remoteAddress, uploadDirectoryFiles, ++countingRecursiveLoops, func);
            } else {
                exec('md5sum /' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + remoteAddress + '.tmp |awk \'{print $1}\'', function(err, stdout) {
                    if (err) return func(err);
                    if (typeof stdout !== 'string') return func(new errorsType.errorLoadingFile('Ошибка: переменная \'stdout\' не является строкой'));

                    if (objResponse.checksum === (stdout.substr(0, stdout.length - 1))) {
                        mv('/' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + remoteAddress + '.tmp',
                            uploadDirectoryFiles + '/' + objDownloadFiles.fileName,
                            function(err) {
                                if (err) func(err);
                                else func(null);
                            });
                    } else {
                        func(new errorsType.errorLoadingFile('Ошибка при загрузке файла ' + objDownloadFiles.fileName));
                    }

                    objGlobal['writeStreamLink_' + remoteAddress].end();
                    delete objGlobal['writeStreamLink_' + wsConnection.remoteAddress];
                });
            }
        });
    }

    redis.hget('task_filtering_all_information:' + taskIndexHash, 'uploadDirectoryFiles', function(err, uploadDirectoryFiles) {
        if (err) return callback(err);

        fileRename(wsConnection.remoteAddress, uploadDirectoryFiles, 0, function(err) {
            if (err) {
                if (err.name !== 'ErrorLoadingFile') return callback(err);
                writeLogFile.writeLog('\t' + err.message);

                mv('/' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + wsConnection.remoteAddress + '.tmp',
                    uploadDirectoryFiles + '/' + objDownloadFiles.fileName,
                    function(err) {
                        if (err) {
                            writeLogFile.writeLog('\t' + err.toString());
                        } else {
                            objResponse.processing = 'file not received';
                            wsConnection.sendUTF(JSON.stringify(objResponse));
                            callback(null);
                        }
                    }
                );
            } else {
                actionWhenRetransmissionReceivingFile(redis, self, function(err) {
                    if (err) {
                        writeLogFile.writeLog('\t' + err.toString());
                    } else {
                        objResponse.processing = 'file received successfully';
                        wsConnection.sendUTF(JSON.stringify(objResponse));
                        callback(null, {
                            messageType: 'executeRetransmissionCompleted',
                            message: 'successfully'
                        });
                    }
                });
            }
        });
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