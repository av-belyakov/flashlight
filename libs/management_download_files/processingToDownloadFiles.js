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
const async = require('async');
const md5File = require('md5-file/promise');

const config = require('../../configure');
const errorsType = require('../../errors/errorsType');
const objWebsocket = require('../../configure/objWebsocket.js');
const writeLogFile = require('../writeLogFile');
const globalObject = require('../../configure/globalObject');
const checkQueueTaskDownloadFiles = require('./checkQueueTaskDownloadFiles');
const actionWhenReceivingStop = require('./actionWhenReceivingStop');
const actionWhenReceivingComplete = require('./actionWhenReceivingComplete');
const actionWhenReceivingFileReceived = require('./actionWhenReceivingFileReceived');
const actionWhenReceivingFileNotReceived = require('./actionWhenReceivingFileNotReceived');

/**
 * Модуль осуществляющий действия для подготовки файлов к приему
 * 
 * @param {*} redis дискриптор соединения с БД
 * @param {*} objData объект содержащий даннные
 * @param {*} sourceID идентификатор источника
 * @param {*} callback функция обратного вызова
 */
module.exports.ready = function(redis, objData, sourceID, callback) {
    let taskIndex = objData.info.taskIndex;

    let wsConnection = objWebsocket[`remote_host:${sourceID}`];
    if (typeof wsConnection === 'undefined') {
        callback(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${taskIndex} не существует`));
    }

    let objResponse = {
        'messageType': 'download files',
        'info': {
            'processing': 'ready',
            'taskIndex': taskIndex
        }
    };

    new Promise((resolve, reject) => {
        async.waterfall([
            //получаем краткое название источника
            function(cb) {
                redis.hget(`remote_host:settings:${sourceID}`, 'shortName', (err, shortSourceName) => {
                    if (err) cb(err);
                    else cb(null, shortSourceName);
                });
            },
            //формируем массив с данными о расположении загружаемых файлов
            function(shortSourceName, cb) {
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
            else resolve();
        });
    }).then(() => {
        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(null);
    }).catch(err => {
        objResponse.info.processing = 'cancel';

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(err);
    });
};

//обработка пакета JSON полученного с источника и содержащего имя отправляемого файла
module.exports.execute = function(redis, objData, sourceID, callback) {
    let taskIndex = objData.info.taskIndex;

    //получить ресурс доступа к streamWrite
    let getWriteStream = function(remoteAddress, { fileHash, fileName, uploadDirectoryFiles }) {
        //        let wsl = globalObject.getData('writeStreamLinks', `writeStreamLink_${remoteAddress}_${fileName}`);

        let wsl = globalObject.getData('writeStreamLinks', fileHash);

        if ((typeof wsl !== 'undefined') && (wsl !== null)) return wsl;

        //let writeStream = fs.createWriteStream(`/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${remoteAddress}_${fileName}.tmp`);
        let writeStream = fs.createWriteStream(`${uploadDirectoryFiles}/${fileName}`);
        writeStream.on('error', err => {
            writeLogFile.writeLog(`\tError: ${err.toString()}`);
        });

        globalObject.setData('writeStreamLinks', fileHash, writeStream);

        return writeStream;
    };

    let wsConnection = objWebsocket[`remote_host:${sourceID}`];
    if (typeof wsConnection === 'undefined') {
        callback(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${taskIndex} не существует`));
    }

    let objResponse = {
        'messageType': 'download files',
        'info': {
            'processing': 'waiting for transfer',
            'taskIndex': taskIndex
        }
    };

    new Promise((resolve, reject) => {
        //изменяем статус uploadFiles в таблице task_filtering_all_information:<taskIndex>
        redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'loaded', (err) => {
            if (err) return reject(err);

            //изменяем информацию о выполняемой задаче (processingTask)
            globalObject.modifyData('processingTasks', taskIndex, [
                ['status', 'loaded'],
                ['timestampModify', +new Date()]
            ]);

            resolve(null);
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            redis.hget(`task_filtering_all_information:${taskIndex}`, 'uploadDirectoryFiles', (err, uploadDirectoryFiles) => {
                if (err) return reject(err);

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

                resolve({
                    'fileHash': objData.info.fileHash,
                    'fileName': objData.info.fileName,
                    'uploadDirectoryFiles': uploadDirectoryFiles
                });
            });
        });
    }).then(obj => {
        let dfi = globalObject.getData('downloadFilesTmp', sourceID);

        //добавляем обработчик на событие "finish"
        getWriteStream(wsConnection.remoteAddress, obj)
            .once('finish', () => {
                completeWriteBinaryData(redis, sourceID, err => {
                    if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                });
            });


        objResponse.info.fileInfo = {
            'fileName': dfi.fileName,
            'fileHash': dfi.fileHash
        };

        process.nextTick(() => {
            wsConnection.sendUTF(JSON.stringify(objResponse));

            callback(null);
        });
    }).catch(err => {
        writeLogFile.writeLog('\tError: ' + err.toString());
        objResponse.info.processing = 'cancel';

        process.nextTick(() => {
            wsConnection.sendUTF(JSON.stringify(objResponse));

            callback(err);
        });
    });
};

//обработка пакета JSON полученного с источника и подтверждающего об окончании передачи указанного файла
module.exports.executeCompleted = function(redis, self, sourceID, cb) {
    cb(null);
};

module.exports.stop = function(redis, self, sourceID, cb) {
    actionWhenReceivingStop(redis, { taskIndex: self.info.taskIndex, sourceID: sourceID })
        .then(() => {
            return new Promise((resolve, reject) => {
                //проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
                checkQueueTaskDownloadFiles(redis, self.info.taskIndex, sourceID, err => { //, objTaskIndex) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }).then(() => {
            cb(null);
        }).catch(err => {
            cb(err);
        });
};

//вызывается при завершении задачи по загрузки файлов
module.exports.completed = function(redis, self, sourceID, cb) {
    let wsConnection = objWebsocket[`remote_host:${sourceID}`];

    if (typeof wsConnection === 'undefined') {
        return cb(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${self.info.taskIndex} не существует`));
    }

    actionWhenReceivingComplete(redis, { taskIndex: self.info.taskIndex, sourceID: sourceID })
        .then(() => {
            return new Promise((resolve, reject) => {
                //проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
                checkQueueTaskDownloadFiles(redis, self.info.taskIndex, sourceID, err => { //, objTaskIndex) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }).then(() => {
            cb(null);
        }).catch(err => {
            globalObject.deleteData('processingTasks', self.info.taskIndex);
            globalObject.deleteData('downloadFilesTmp', sourceID);

            cb(err);
        });
};

//переименование временного файла /uploading_with_<ip_адрес>_<имя_файла> в текущий загружаемый файл
function fileRename(infoDownloadFile, fileTmp) {
    return new Promise((resolve, reject) => {
        fs.lstat(fileTmp, (err, fileSettings) => {
            if (err) return reject(err);

            if (fileSettings.size !== infoDownloadFile.fileFullSize) {
                writeLogFile.writeLog(`\tError: the SIZE of the received file "${infoDownloadFile.fileName}" is not the same as previously transferred`);

                return reject(new errorsType.errorLoadingFile(`Ошибка при загрузке файла "${infoDownloadFile.fileName}", размер полученного файла не совпадает с ранее переданным`));
            }

            resolve();
        });
    }).then(() => {
        return md5File(fileTmp);
    }).then(hash => {
        return new Promise((resolve, reject) => {
            if (infoDownloadFile.fileHash !== hash) {
                writeLogFile.writeLog(`\tError: the HEX of the received file "${infoDownloadFile.fileName}" is not the same as previously transferred`);

                return reject(new errorsType.errorLoadingFile(`Ошибка при загрузке файла "${infoDownloadFile.fileName}", хеш сумма полученного файла не совпадает с ранее переданной`));
            }

            //переименовывает и удаляет исходный файл
            mv(fileTmp, `${infoDownloadFile.uploadDirectoryFiles}/${infoDownloadFile.fileName}`, { mkdirp: true }, err => {
                if (err) {
                    writeLogFile.writeLog(`\tError: ${err.message}`);

                    return reject(err);
                }

                resolve();
            });
        });
    });
}

function checkUploadedFile(infoDownloadFile) {
    let uploadedFile = `${infoDownloadFile.uploadDirectoryFiles}/${infoDownloadFile.fileName}`;

    return new Promise((resolve, reject) => {
        fs.lstat(uploadedFile, (err, fileSettings) => {
            if (err) return reject(err);

            if (fileSettings.size !== infoDownloadFile.fileFullSize) {
                writeLogFile.writeLog(`\tError: the SIZE of the received file "${infoDownloadFile.fileName}" is not the same as previously transferred`);

                return reject(new errorsType.errorLoadingFile(`Ошибка при загрузке файла "${infoDownloadFile.fileName}", размер полученного файла не совпадает с ранее переданным`));
            }

            resolve();
        });
    }).then(() => {
        return md5File(uploadedFile);
    }).then(hash => {
        return new Promise((resolve, reject) => {
            if (infoDownloadFile.fileHash !== hash) {
                writeLogFile.writeLog(`\tError: the HEX of the received file "${infoDownloadFile.fileName}" is not the same as previously transferred`);

                return reject(new errorsType.errorLoadingFile(`Ошибка при загрузке файла "${infoDownloadFile.fileName}", хеш сумма полученного файла не совпадает с ранее переданной`));
            }

            resolve();
        });
    });
}

function completeWriteBinaryData(redis, sourceID, cb) {
    let dfi = globalObject.getData('downloadFilesTmp', sourceID);

    if ((dfi === null) || (typeof dfi === 'undefined')) {
        writeLogFile.writeLog('\tError: not found the ip address of the source is impossible to control the uploading of files (function processingToDownloadFiles.js)');

        return cb(new errorsType.receivedEmptyObject('Не найден ip адрес источника, невозможно контролировать загрузку файлов'));
    }

    let objResponse = {
        'messageType': 'download files',
        'info': {
            'processing': 'execute success',
            'taskIndex': dfi.taskIndex,
            'fileInfo': {
                'fileName': dfi.fileName,
                'fileHash': dfi.fileHash
            }
        }
    };

    let wsConnection = objWebsocket[`remote_host:${sourceID}`];
    if (typeof wsConnection === 'undefined') {
        writeLogFile.writeLog(`\tError: no websocket connection from source ID "${sourceID}"`);

        return cb(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${dfi.taskIndex} не существует`));
    }

    let source = globalObject.getData('sources', sourceID);
    if ((source.ipaddress === null) || (typeof source.ipaddress === 'undefined')) {
        writeLogFile.writeLog('\t Error: Not found the ip address of the source is impossible to control the uploading of files (function processingToDownloadFiles.js)');

        return cb(new errorsType.receivedEmptyObject('Не найден ip адрес источника, невозможно контролировать загрузку файлов'));
    }

    //удаляем ресурс для записи в файл
    globalObject.deleteData('writeStreamLinks', dfi.fileHash);

    checkUploadedFile(dfi)
        .then(() => {
            actionWhenReceivingFileReceived(redis, dfi.taskIndex, sourceID, err => {
                if (err) writeLogFile.writeLog(`\tError: ${err.toString()}`);

                writeLogFile.writeLog(`\tInfo: file ${dfi.fileName} resived successfy`);

                wsConnection.sendUTF(JSON.stringify(objResponse));

                sendEventsUpload(dfi.taskIndex, err => {
                    if (err) cb(err);
                    else cb(null);
                });
            });
        }).catch(err => {
            if (err) writeLogFile.writeLog('\tError: ' + err.toString());

            actionWhenReceivingFileNotReceived(redis, dfi.taskIndex, err => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());

                writeLogFile.writeLog(`\tInfo: file ${dfi.fileName} resived failure`);

                objResponse.info.processing = 'execute failure';
                wsConnection.sendUTF(JSON.stringify(objResponse));

                sendEventsUpload(dfi.taskIndex, error => {
                    if (err) writeLogFile.writeLog('\tError: ' + error.toString());
                    else cb(err);
                });
            });
        });
}

//генерирование события обновления загружаемой информации
function sendEventsUpload(taskIndex, callback) {
    let processTaskInfo = globalObject.getData('processingTasks', taskIndex);

    if ((typeof processTaskInfo === 'undefined') || (typeof processTaskInfo.uploadEvents === 'undefined')) {
        callback(new Error('not found "uploadEvents" in object "globalObject" type "processingTasks"'));
    }

    processTaskInfo.uploadEvents.emit('download information', {
        msgType: 'update count'
    });

    callback(null);
}