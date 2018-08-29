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

    debug('------------ RESIVED MESSAGE "ready" for Moth_go ---------------');
    debug(objData);

    //удаляем временный файл если он есть
    debug('1. удаляем временный файл если он есть');

    fs.access(`/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${wsConnection.remoteAddress}.tmp`, fs.constants.R_OK, err => {
        if (!err) fs.unlink(`/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${wsConnection.remoteAddress}.tmp`, err => {
            if (err) {
                debug(err);

                writeLogFile.writeLog(`\t${err.toString()}`);
            }
        });
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
        writeLogFile.writeLog('\tError: ' + err.toString());
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

    let taskIndex = objData.info.taskIndex;

    //получить ресурс доступа к streamWrite
    let getStreamWrite = function(remoteAddress) {
        let wsl = globalObject.getData('writeStreamLinks', `writeStreamLink_${remoteAddress}`);

        if ((typeof wsl !== 'undefined') && (wsl !== null)) return wsl;

        let writeStream = fs.createWriteStream(`/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${remoteAddress}.tmp`);
        writeStream.on('error', err => {
            writeLogFile.writeLog(`\t${err.toString()}`);
        });

        globalObject.setData('writeStreamLinks', `writeStreamLink_${remoteAddress}`, writeStream);

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

        debug('1. изменяем статус uploadFiles в таблице task_filtering_all_information:');

        redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'loaded', (err) => {
            if (err) reject(err);
            else resolve(null);
        });
    }).then(() => {

        debug('2. изменяем информацию о выполняемой задаче');

        //изменяем информацию о выполняемой задаче (processingTask)
        globalObject.modifyData('processingTasks', taskIndex, [
            ['status', 'loaded'],
            ['timestampModify', +new Date()]
        ]);

        debug('globalObject.modifyData');
        debug(globalObject.getData('processingTasks', taskIndex));

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

                debug('3. добавляем информацию о загружаемом файле');
                debug('globalObject.setData (downloadFilesTmp)');
                debug(globalObject.getData('downloadFilesTmp', sourceID));

                resolve();
            });
        });
    }).then(() => {

        debug('4. создание ресурса на запись в файл');

        getStreamWrite(wsConnection.remoteAddress);
    }).then(() => {

        debug('5. добавляем обработчик на событие "finish"');

        //обработчик сбытия 'finish' при завершении записи в файл
        let wsl = globalObject.getData('writeStreamLinks', `writeStreamLink_${wsConnection.remoteAddress}`);
        if ((wsl === null) || (typeof wsl === 'undefined')) {
            throw ('not found a stream for writing to a file');
        }

        wsl.once('finish', () => {

            debug('--------- WRITE IS FINISH ------------');

            let fileName = globalObject.getData('downloadFilesTmp', sourceID).fileName;
            writeLogFile.writeLog(`Info: получено событие 'finish для файла ${fileName}, готовимся отправить сообщение о готовности принять следующий файл'`);

            completeWriteBinaryData(redis, sourceID, (err) => {
                if (err) return callback(err);
            });
        });
    }).then(() => {
        debug('EVENT "EXECUTE"');
        debug('------>SEND SUCCESS MESSAGE TO MOTH_GO');
        debug(objResponse);

        objResponse.info.fileName = objData.info.fileName;

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(null);
    }).catch(err => {
        writeLogFile.writeLog('\t' + err.toString());
        objResponse.info.processing = 'cancel';

        debug('EVENT "EXECUTE"');
        debug('------->SEND ERROR MESSAGE TO MOTH_GO');
        debug(err);

        wsConnection.sendUTF(JSON.stringify(objResponse));

        callback(err);
    });
};

//обработка пакета JSON полученного с источника и подтверждающего об окончании передачи указанного файла
module.exports.executeCompleted = function(redis, self, sourceID, cb) {

    debug('EVENT EXECUTE COMPLETED');
    debug(self);
    debug('генерируем событие для закрытия дискриптора файла');

    let source = globalObject.getData('sources', sourceID);
    if ((source === null) || (typeof source === 'undefined')) {
        return writeLogFile.writeLog('\tError: not found a stream for writing to a file');
    }

    process.nextTick(() => {
        let wsl = globalObject.getData('writeStreamLinks', `writeStreamLink_${source.ipaddress}`);
        if ((wsl === null) || (typeof wsl === 'undefined')) {
            return writeLogFile.writeLog('\tError: not found a stream for writing to a file');
        }

        let fileName = globalObject.getData('downloadFilesTmp', sourceID).fileName;
        writeLogFile.writeLog(`Info: закрываем дискриптор потока на запись в файл ${fileName}`);

        //закрываем дискриптор потока на запись в файл
        wsl.end();

        cb(null);
    });
};

//обработка пакета JSON полученного с источника и содержащего информацию о количестве успешно или неуспешно переданных файлов
module.exports.completed = function(redis, self, sourceID, cb) {

    debug('resived message type "completed"');
    debug(self);

    let wsConnection = objWebsocket[`remote_host:${sourceID}`];

    if (typeof wsConnection === 'undefined') {
        return cb(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${self.info.taskIndex} не существует`));
    }

    actionWhenReceivingComplete(redis, { taskIndex: self.info.taskIndex, sourceID: sourceID },
        (err, ...spread) => {
            if (err) {
                globalObject.deleteData('processingTasks', self.info.taskIndex);
                globalObject.deleteData('downloadFilesTmp', sourceID);

                return cb(err);
            }

            //проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
            checkQueueTaskDownloadFiles(redis, sourceID, (err, objTaskIndex) => {
                if (err) return cb(err);

                if (Object.keys(objTaskIndex).length > 0) {
                    wsConnection.sendUTF(JSON.stringify(objTaskIndex));
                }

                if (typeof spread[0] === 'undefined') return cb(null);

                cb(null, spread[0]);
            });
        });
};

//обработка пакета JSON полученного с источника и информирующего об отмене передачи файлов по причине ошибки
module.exports.cancel = function(redis, self, sourceID, cb) {

    debug('resived message type "CANCEL"');
    debug(self);

    actionWhenReceivingCancel(redis, self.info.taskIndex, function(err) {
        if (err) {
            globalObject.deleteData('processingTasks', self.info.taskIndex);
            globalObject.deleteData('downloadFilesTmp', sourceID);

            cb(err);
        } else {
            cb(null);
        }
    });
};

//переименование временного файла /uploading_with_<ip_адрес> в текущий загружаемый файл
function fileRename(infoDownloadFile, fileTmp) {
    return new Promise((resolve, reject) => {
        fs.lstat(fileTmp, (err, fileSettings) => {
            if (err) return reject(err);

            //debug(fileSettings);
            debug(`fileSettings.size (${fileSettings.size}) !== infoDownloadFile.fileFullSize( ${infoDownloadFile.fileFullSize} )`);
            debug(fileSettings.size !== infoDownloadFile.fileFullSize);

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

            debug(`infoDownloadFile.fileHash (${infoDownloadFile.fileHash}) !== hash (${hash})`);
            debug(infoDownloadFile.fileHash !== hash);

            if (infoDownloadFile.fileHash !== hash) {
                writeLogFile.writeLog(`\tError: the HEX of the received file "${infoDownloadFile.fileName}" is not the same as previously transferred`);

                return reject(new errorsType.errorLoadingFile(`Ошибка при загрузке файла "${infoDownloadFile.fileName}", хеш сумма полученного файла не совпадает с ранее переданной`));
            }

            debug(infoDownloadFile);
            debug(`======== directory for copy file ${infoDownloadFile.uploadDirectoryFiles}`);

            mv(fileTmp, `${infoDownloadFile.uploadDirectoryFiles}/${infoDownloadFile.fileName}`, err => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
}

function completeWriteBinaryData(redis, sourceID, cb) {
    let dfi = globalObject.getData('downloadFilesTmp', sourceID);
    if ((dfi === null) || (typeof dfi === 'undefined')) {
        writeLogFile.writeLog('\t Error: Not found the ip address of the source is impossible to control the uploading of files (function processingToDownloadFiles.js)');

        return cb(new errorsType.receivedEmptyObject('Не найден ip адрес источника, невозможно контролировать загрузку файлов'));
    }

    debug('**-*----*-*- START function completeWriteBinaryData *-*-*-*-*---');
    debug(`sourceID = ${sourceID}, taskIndex = ${dfi.taskIndex}, fileName = ${dfi.fileName}`);
    debug('**-*----*-*-*-*-*-*-*---');

    let objResponse = {
        'messageType': 'download files',
        'info': {
            'processing': 'execute success',
            'taskIndex': dfi.taskIndex,
            'fileName': dfi.fileName
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
    globalObject.deleteData('writeStreamLinks', `writeStreamLink_${wsConnection.remoteAddress}`);

    debug('-------------- RESIVED emitter "chunk write complete" START function "fileRename" ');

    let fileTmp = `/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${source.ipaddress}.tmp`;
    fileRename(dfi, fileTmp)
        .then(() => {
            actionWhenReceivingFileReceived(redis, dfi.taskIndex, sourceID, err => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());

                writeLogFile.writeLog(`\tInfo: file ${dfi.fileName} resived successfy`);

                wsConnection.sendUTF(JSON.stringify(objResponse));
                cb(null);
            });
        }).catch(err => {
            debug(err.message);

            actionWhenReceivingFileNotReceived(redis, dfi.taskIndex, err => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());

                objResponse.info.processing = 'execute failure';
                wsConnection.sendUTF(JSON.stringify(objResponse));
            });

            writeLogFile.writeLog('\tError: ' + err.toString());
            cb(err);
        });
}