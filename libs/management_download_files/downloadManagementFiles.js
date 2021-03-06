/*
 * Формирование и отправка пакетов в формате JSON, необходимых
 * для управления выгрузкой файлов с удаленных источников
 *
 * Версия 0.1, дата релиза 22.10.2018
 * */

'use strict';

const async = require('async');
const EventEmitter = require('events').EventEmitter;

const errorsType = require('../../errors/errorsType');
const globalObject = require('../../configure/globalObject');
const objWebsocket = require('../../configure/objWebsocket');

/**
 * @param {*} redis - дискриптор соединения с БД
 * @param {*} objData - содержит следующие параметры: sourceID, taskIndex и listFiles
 * @param {*} socketIo - дискриптор соединения по протоколу sockeio
 */
module.exports.addRequestDownloadFiles = function(redis, { sourceID, taskIndex, listFiles }) {
    let countDownloadSelectedFiles = listFiles.length;

    return getDownloadInfo(redis, taskIndex, countDownloadSelectedFiles).then(obj => {
        if (countDownloadSelectedFiles > 0) return obj;

        return getCountFilesUploaded(redis, taskIndex, sourceID, obj);
    }).then(({ countUploadFiles, directoryFiltering, countFilesLoaded }) => {
        let filesSelectionType = (countDownloadSelectedFiles === 0) ? 'all files' : 'chosen files';

        //добавляем информацию о задаче в глобальный объект
        globalObject.setData('processingTasks', taskIndex, {
            'taskType': 'upload',
            'sourceId': sourceID,
            'status': 'in line',
            'timestampStart': +new Date(),
            'timestampModify': +new Date(),
            'uploadInfo': {
                'fileSelectionType': filesSelectionType,
                'numberFilesUpload': countUploadFiles,
                'numberFilesUploaded': 0,
                'numberFilesUploadedError': 0,
                'numberPreviouslyDownloadedFiles': +countFilesLoaded,
                'listFiles': listFiles //добавляем список файлов
            },
            'uploadEvents': new uploadEventEmitter()
        });
    }).catch(err => {
        throw (err);
    });
};

/**
 * @param {*} redis - дискриптор соединения с БД
 * @param {*} objData - содержит следующие параметры: sourceID, taskIndex и listFiles
 * @param {*} socketIo - дискриптор соединения по протоколу sockeio
 */
module.exports.startRequestDownloadFiles = function(redis, { sourceID, taskIndex, listFiles }) {
    let countDownloadSelectedFiles = listFiles.length;

    //    return getUserNameAndLogin(redis, socketIo).then(objUserInfo => {
    return new Promise((resolve, reject) => {
        //удаляем идентификатор задачи из таблицы task_turn_downloading_files и добавляем в таблицу task_implementation_downloading_files
        changeTaskInListDownloadFiles(redis, {
            sourceId: sourceID,
            taskIndex: taskIndex
        }, 'start', (err) => {
            if (err) reject(err);
            else resolve();
        });
    }).then(() => {
        return getDownloadInfo(redis, taskIndex, countDownloadSelectedFiles);
    }).then(obj => {
        if (countDownloadSelectedFiles > 0) return obj;

        return getCountFilesUploaded(redis, taskIndex, sourceID, obj);
    }).then(({ countUploadFiles, directoryFiltering, countFilesLoaded }) => {
        let filesSelectionType = (countDownloadSelectedFiles === 0) ? 'all files' : 'chosen files';

        //добавляем информацию о задаче в глобальный объект
        globalObject.setData('processingTasks', taskIndex, {
            'taskType': 'upload',
            'sourceId': sourceID,
            'status': 'expect',
            'timestampStart': +new Date(),
            'timestampModify': +new Date(),
            'uploadInfo': {
                'fileSelectionType': filesSelectionType,
                'numberFilesUpload': countUploadFiles,
                'numberFilesUploaded': 0,
                'numberFilesUploadedError': 0,
                'numberPreviouslyDownloadedFiles': +countFilesLoaded
            },
            'uploadEvents': new uploadEventEmitter()
        });

        return directoryFiltering;
    }).then(directoryFiltering => {
        let wsConnection = objWebsocket[`remote_host:${sourceID}`];

        if (typeof wsConnection === 'undefined') {
            throw (new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${taskIndex} не существует`));
        }

        //изменяем статус загрузки файлов на 'ожидает'
        redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'expect', (err) => {
            if (err) {
                throw (new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
            }
        });

        //формируем и отправляем запрос на скачивание файлов
        if (countDownloadSelectedFiles === 0) {
            //если выбранны ВСЕ файлы
            let strRequest = JSON.stringify({
                'messageType': 'download files',
                'info': {
                    'processing': 'start',
                    'taskIndex': taskIndex,
                    'downloadDirectoryFiles': directoryFiltering,
                    'downloadSelectedFiles': false,
                    'countDownloadSelectedFiles': 0,
                    'numberMessageParts': [0, 0],
                    'listDownloadSelectedFiles': []
                }
            });

            return wsConnection.sendUTF(strRequest);
        }

        //если скачиваются ТОЛЬКО выбранные пользователем файлы
        let { countChunk, list: newListFiles } = transformListIndexFiles(20, listFiles);

        //предварительный запрос
        let objRequest = {
            'messageType': 'download files',
            'info': {
                'processing': 'start',
                'taskIndex': taskIndex,
                'downloadDirectoryFiles': directoryFiltering,
                'downloadSelectedFiles': true,
                'countDownloadSelectedFiles': countDownloadSelectedFiles,
                'numberMessageParts': [0, countChunk],
                'listDownloadSelectedFiles': []
            }
        };

        wsConnection.sendUTF(JSON.stringify(objRequest));

        for (let i = 0; i < countChunk; i++) {
            objRequest.info.numberMessageParts = [(i + 1), countChunk];
            objRequest.info.listDownloadSelectedFiles = newListFiles[i];

            wsConnection.sendUTF(JSON.stringify(objRequest));
        }
    }).catch(err => {
        throw (err);
    });
};

/*
 Запрос на остановку загрузки
 формат запроса, JSON, со следующими параметрами:
  - messageType - тип запроса
  - processing - остановка выгрузки файлов
  - taskIndex - уникальный идентификатор задачи,
*/
module.exports.stopRequestDownloadFiles = function(sourceID, id, func) {
    let wsConnection = objWebsocket['remote_host:' + sourceID];

    if (typeof wsConnection === 'undefined') {
        func(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${id} не существует`));
    } else {
        wsConnection.sendUTF(JSON.stringify({
            'messageType': 'download files',
            'processing': 'stop',
            'taskIndex': id
        }));
        func(null, sourceID);
    }
};

//делим список файлов на фрагменты и считаем их количество
function transformListIndexFiles(sizeChunk, listFiles) {
    let newListFiles = [];

    if (listFiles.length === 0) return {
        countChunk: 0,
        list: [
            []
        ]
    };
    if (listFiles.length < sizeChunk) return { countChunk: 1, list: [listFiles] };

    let countChunk = Math.floor(listFiles.length / sizeChunk);
    let y = listFiles.length / sizeChunk;

    if ((y - countChunk) !== 0) countChunk++;


    for (let i = 0; i < countChunk; i++) {
        newListFiles.push(listFiles.splice(0, sizeChunk));
    }

    return { countChunk: countChunk, list: newListFiles };
}

function changeTaskInListDownloadFiles(redis, obj, typeChange, cb) {
    let hashId = `${obj.sourceId}:${obj.taskIndex}`;

    if (typeChange === 'start') {
        //удаляем идентификатор задачи из таблицы task_turn_downloading_files и добавляем в таблицу task_implementation_downloading_files
        async.parallel([
            callback => {
                redis.lrem('task_turn_downloading_files', 0, hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {
                redis.lpush('task_implementation_downloading_files', hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], err => {
            if (err) cb(err);
            else cb(null);
        });
    } else {
        //удаляем идентификатор задачи из таблицы task_implementation_downloading_files и добавляем в task_turn_downloading_files
        async.parallel([
            callback => {
                redis.lrem('task_implementation_downloading_files', 0, hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {
                redis.lpush('task_turn_downloading_files', hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], err => {
            if (err) cb(err);
            else cb(null);
        });
    }
}

//класс для генерации событий связанных с загрузкой сетевого трафика
class uploadEventEmitter extends EventEmitter {
    constructor() {
        super();
        this.emit('ready');
    }
}

//получаем информацию о загружаемых файлах
function getDownloadInfo(redis, taskIndex, countDownloadSelectedFiles) {
    return new Promise((resolve, reject) => {
        redis.hmget(`task_filtering_all_information:${taskIndex}`,
            'countFilesFound',
            'directoryFiltering',
            'countFilesLoaded',
            (err, result) => {
                if (err) return reject(err);

                let countFilesUpload = (countDownloadSelectedFiles === 0) ? result[0] : countDownloadSelectedFiles;

                resolve({
                    'countUploadFiles': countFilesUpload,
                    'directoryFiltering': result[1],
                    'countFilesLoaded': result[2],
                    'countDownloadSelectedFiles': countDownloadSelectedFiles
                });
            });
    });
}

//получить количество уже загруженных файлов
function getCountFilesUploaded(redis, taskIndex, sourceID, obj) {
    return new Promise((resolve, reject) => {
        redis.hvals(`task_list_files_found_during_filtering:${sourceID}:${taskIndex}`, (err, listValues) => {
            if (err) return reject(err);

            let countUploaded = 0;
            for (let i = 0; i < listValues.length; i++) {
                let fileInfo = JSON.parse(listValues[i]);

                if ((typeof fileInfo.fileDownloaded !== 'undefined') && fileInfo.fileDownloaded) countUploaded++;
            }

            obj.countUploadFiles -= countUploaded;

            resolve(obj);
        });
    });
}