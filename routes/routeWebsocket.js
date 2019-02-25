/*
 * Маршруты для данных передаваемых через websocket
 *
 * Версия 0.1, дата релиза 11.12.2015
 * */

'use strict';

const async = require('async');
const process = require('process');

const errorsType = require('../errors/errorsType');
const controllers = require('../controllers');
const writeLogFile = require('../libs/writeLogFile');
const globalObject = require('../configure/globalObject');
const processingToDownloadFiles = require('../libs/management_download_files/processingToDownloadFiles');
const processingListFilesForFiltering = require('../libs/list_file_management/processingListFilesForFiltering');
const processingListFilesFoundDuringFiltering = require('../libs/list_file_management/processingListFilesFoundDuringFiltering.js');

/**
 * роутинг websocket соединения
 * 
 * @param {*} objData 
 * @param {*} sourceID 
 * @param {*} callback 
 */
module.exports.route = function(objData, sourceID, callback) {
    let redis = controllers.connectRedis();
    let objRoutes = {
        'undefined': messageTypeUndefined,
        'error': messageTypeError,
        'pong': messagePong,
        'information': messageTypeInformation,
        'filtering': messageTypeFiltering,
        'download files': messageTypeUpload
    };

    if (typeof objRoutes[objData.messageType] === 'undefined') return callback();

    process.nextTick(() => {
        objRoutes[objData.messageType].call(objData, redis, sourceID, callback);
    });
};

//обработка ошибки возникающей при не найденном типе messageType
let messageTypeUndefined = function(redis, sourceID, callback) {
    return callback(new errorsType.errorRemoteHost('type messageType not found'));
};

//обработка ошибок принимаемых от удаленных источников
let messageTypeError = function(redis, sourceID, callback) {
    function changeStatusProcessingTask(taskIndex, taskType) {
        let objChangeStatus = {
            'filtering': {
                'table': ['jobStatus', 'rejected']
            },
            'upload': {
                'table': ['uploadFiles', 'partially loaded']
            }
        };
        if (typeof objChangeStatus[taskType] === 'undefined') return new errorsType.receivedIncorrectData(`incorrect type 'taskType' equal to ${taskType}`);

        redis.hset(`task_filtering_all_information:${taskIndex}`, objChangeStatus[taskType].table[0], objChangeStatus[taskType].table[1], err => {
            if (err) return err;
        });
    }


    let dateUnix = +new Date();
    let obj = {
        ip: this.serverIp,
        dateTime: dateUnix,
        errorCode: this.errorCode,
        errorMessage: this.errorMessage
    };

    if (this.taskId === null) return callback(null);

    redis.zadd(`remote_host:errors:${sourceID}`, dateUnix, JSON.stringify(obj), err => {
        if (err) return callback(err);
    });
    //ошибка авторизации на источнике
    if (+this.errorCode === 403) {
        redis.hset(`remote_host:settings:${sourceID}`, 'isAuthorization', false, err => {
            if (err) return callback(err);
        });
    }

    if ((+this.errorCode === 400) || (+this.errorCode === 406)) {
        let tasksIndex = globalObject.getData('processingTasks');
        for (let taskID in tasksIndex) {
            if (taskID === this.taskId) changeStatusProcessingTask(this.taskId, tasksIndex[taskID].taskType);
        }
    }

    /*
     * отсутствует сетевой трафик за выбранный промежуток времени или
     * превышен лимит одновременно запущеных задач на фильтрацию
     * */
    if (+this.errorCode === 410 || +this.errorCode === 413 || +this.errorCode === 500) {
        let taskId = (~this.taskId.indexOf(':')) ? this.taskId.split(':')[1] : this.taskId;

        changingStatusReceiveErrorCode(redis, taskId, callback);
    }

    /*
     * данная ошибка возникает при невозможности остановить загрузку файлов
     * изменяем значения в таблице task_filtering_all_information:*
     * */
    if (+this.errorCode === 414) {
        redis.hmset(`task_filtering_all_information:${this.taskId}`, {
            'uploadFiles': 'loaded',
            'userNameStopUploadFiles': 'null',
            'dateTimeStopUploadFiles': 'null'
        }, err => {
            if (err) return callback(err);
        });
    }

    callback(null);
};

//обработка messageType - pong, сравнение с настройками хоста хранящимися в БД
let messagePong = function(redis, sourceID, func) {
    let self = this;

    if (typeof self.info === 'undefined') {
        return func(new errorsType.receivedIncorrectData('the \'info\' field is missing in the json object'));
    }

    async.parallel([
        callback => {
            if (typeof self.info.versionApp === 'undefined') {
                writeLogFile.writeLog(`\tInfo: source №${sourceID}, the 'versionApp' field is missing in the json object`);
                return callback(null);
            }

            if (!new RegExp('^v\\d+\\.\\d+$').test(self.info.versionApp)) {
                writeLogFile.writeLog(`\tInfo: incorrect data received from source №${sourceID}`);
                return callback(null);
            }

            redis.hset('remote_host_version_list', sourceID, self.info.versionApp, err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        callback => {
            redis.hget(`remote_host:settings:${sourceID}`,
                'maxCountProcessFiltering',
                (err, arrayResult) => {
                    if (err) return callback(err);

                    let maxCountProcessFilteringIsExist = parseInt(arrayResult[0]) === self.info.maxCountProcessFiltering;

                    if (!maxCountProcessFilteringIsExist) {
                        callback(new errorsType.errorRemoteHost(`some parameters for remote host ${sourceID} is not installed`));
                    } else {
                        callback(null);
                    }
                });
        },
        callback => {
            redis.hset(`remote_host:settings:${sourceID}`, 'isAuthorization', true, err => {
                if (err) callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
                else callback(null);
            });
        }
    ], err => {
        if (err) func(err);
        else func(null, 'successfully');
    });
};

//обработка информации о состоянии источника
let messageTypeInformation = function(redis, sourceID, func) {
    let self = this;
    let arrItemDataReceive = [
        ['diskSpace', 'object'],
        ['timeInterval', 'object'],
        ['currentDateTime', 'string'],
        ['randomAccessMemory', 'object'],
        ['loadCPU', 'string'],
        ['loadNetwork', 'object']
    ];
    let objResult = {};

    for (let i = 0; i < arrItemDataReceive.length; i++) {
        let nameParameter = arrItemDataReceive[i][0];

        if (typeof self.info[nameParameter] === 'undefined') {
            writeLogFile.writeLog(`\tError: parameter "${nameParameter}" for remote host ${sourceID} is not installed. Message type "information".`);

            continue;
        }

        if (arrItemDataReceive[i][1] === 'object') objResult[nameParameter] = JSON.stringify(self.info[nameParameter]);
        else objResult[nameParameter] = self.info[nameParameter].toString();
    }

    new Promise((resolve, reject) => {
        redis.hmset(`remote_host:information:${sourceID}`, objResult, err => {
            if (err) reject(new errorsType.errorRedisDataBase('error Redis Data Base'));
            else resolve();
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            redis.hset(`remote_host:information:${sourceID}`, 'dateTimeReceived', +new Date(), err => {
                if (err) reject(new errorsType.errorRedisDataBase('error Redis Data Base'));
                else resolve();
            });
        });
    }).then(() => {
        func(null, 'successfully');
    }).catch(err => {
        func(err);
    });
};

//обработка информации о ходе фильтрации
let messageTypeFiltering = function(redis, sourceID, callback) {
    let self = this;

    let triggerCheckUserData = checkUserData(self.info);
    let triggerCheckCountUserData = checkCountUserData(self.info.processing, self);

    if (!triggerCheckUserData || !triggerCheckCountUserData) {
        return callback(new errorsType.receivedIncorrectData('Error: received incorrect data'));
    }

    if (self.info.processing === 'start') {

        writeLogFile.writeLog(`\tInfo: received message 'filtering' from source ${sourceID}, message type '${self.info.processing.toUpperCase()}'`)

        //устанавливаем значение сообщающее о том что соединение с источником ранее не разрывалось
        globalObject.setData('sources', sourceID, 'wasThereConnectionBreak', false);

        //если фрагмент сообщения первый
        if (self.info.numberMessageParts[0] === 0) {
            new Promise((resolve, reject) => {
                let objectData = {
                    'dateTimeStartFilter': +new Date(),
                    'jobStatus': 'execute',
                    'directoryFiltering': self.info.directoryFiltering,
                    'countDirectoryFiltering': self.info.countDirectoryFiltering,
                    'countFullCycle': self.info.countFullCycle,
                    'countMaxFilesSize': self.info.countMaxFilesSize,
                    'filterUseIndex': self.info.useIndexes
                };
                if (!self.info.useIndexes) {
                    objectData.countFilesFiltering = self.info.countFilesFiltering;
                }

                redis.hmset(`task_filtering_all_information:${self.info.taskIndex}`, objectData, (err) => {
                    if (err) reject(err);
                    else resolve(null);
                });
            }).then(() => {
                globalObject.setData('processingTasks', self.info.taskIndex, {
                    'taskType': 'filtering',
                    'sourceId': sourceID,
                    'status': 'execute',
                    'timestampStart': +new Date(),
                    'timestampModify': +new Date(),
                    'countFilesProcessed': 0
                });

                callback(null);
            }).catch(err => {
                callback(err);
            });
        } else {
            if (self.info.useIndexes) return callback(null);

            //создание списков task_filter_list_files:<ID source>:<ID task>:<path directory> содержащих файлы по которым будет вполнятся фильтрация
            processingListFilesForFiltering.createList({
                sourceId: sourceID,
                taskIndex: self.info.taskIndex,
                objFilesList: self.info.listFilesFilter
            }, redis).then(() => {
                if (self.info.numberMessageParts[0] === self.info.numberMessageParts[1]) {
                    callback(null);
                }
            }).catch(err => {
                callback(err);
            });
        }
    }

    if (self.info.processing === 'execute') {
        if (typeof self.info.infoProcessingFile.statusProcessed === 'undefined') {
            callback(new errorsType.receivedIncorrectData('received incorrect data'));
        }

        async.parallel([
            callback => {
                let taskIndexes = Object.keys(globalObject.getDataTaskFilter());

                if (taskIndexes.length === 0) {
                    globalObject.setData('processingTasks', self.info.taskIndex, {
                        'taskType': 'filtering',
                        'sourceId': sourceID,
                        'status': 'execute',
                        'timestampStart': +new Date(),
                        'timestampModify': +new Date()
                    });

                    return callback(null);
                }
                let isExist = false;
                taskIndexes.forEach(index => {
                    if (self.info.taskIndex === index) isExist = true;
                });

                if (!isExist) {
                    globalObject.setData('processingTasks', self.info.taskIndex, {
                        'taskType': 'filtering',
                        'sourceId': sourceID,
                        'status': 'execute',
                        'timestampStart': +new Date(),
                        'timestampModify': +new Date()
                    });
                }
                callback(null);
            },
            //запись количества обработаннных файлов
            callback => {
                //запись значения
                redis.hmset(`task_filtering_all_information:${self.info.taskIndex}`, {
                    'countFilesProcessed': self.info.countFilesProcessed,
                    'countFilesUnprocessed': self.info.countFilesUnprocessed,
                    'countCycleComplete': self.info.countCycleComplete,
                    'countFilesFound': self.info.countFilesFound,
                    'countFoundFilesSize': self.info.countFoundFilesSize
                }, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {
                //редактирование списков task_filter_list_files:<ID source>:<ID task>:<path directory> содержащих файлы по которым будет вполнятся фильтрация
                processingListFilesForFiltering.modifyList({
                    sourceId: sourceID,
                    taskIndex: self.info.taskIndex,
                    infoProcessingFile: self.info.infoProcessingFile
                }, redis, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], err => {
            if (err) return callback(err);

            if (self.info.infoProcessingFile.statusProcessed) return callback(null);

            new Promise((resolve, reject) => {
                redis.hget(`task_filtering_all_information:${self.info.taskIndex}`, 'listFilesUnprocessing', (err, listFilesUnprocessing) => {
                    if (err) reject(err);
                    else resolve(listFilesUnprocessing);
                });
            }).then(listFilesUnprocessing => {
                let stringResultFilesUnprocessing = '';
                if (~listFilesUnprocessing.indexOf(',')) {
                    let array = listFilesUnprocessing.split(',');
                    array.push(self.info.infoProcessingFile.directoryLocation + '/' + self.info.infoProcessingFile.fileName);
                    stringResultFilesUnprocessing = array.join();
                } else if (listFilesUnprocessing.length > 0) {
                    let arrayTmp = [];
                    arrayTmp.push(listFilesUnprocessing);
                    arrayTmp.push(self.info.infoProcessingFile.directoryLocation + '/' + self.info.infoProcessingFile.fileName);
                    stringResultFilesUnprocessing = arrayTmp.join();
                } else {
                    listFilesUnprocessing = self.info.infoProcessingFile.directoryLocation + '/' + self.info.infoProcessingFile.fileName;
                }

                return new Promise((resolve, reject) => {
                    redis.hset(`task_filtering_all_information:${self.info.taskIndex}`, 'listFilesUnprocessing', stringResultFilesUnprocessing, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }).then(() => {
                callback(null);
            }).catch(err => {
                callback(err);
            });
        });
    }

    if (self.info.processing === 'complete') {
        let processingFirstPart = function(func) {
            async.parallel([
                callback => {
                    new Promise((resolve, reject) => {
                        redis.hget(`task_filtering_all_information:${self.info.taskIndex}`,
                            'countFilesFiltering',
                            (err, countFilesFiltering) => {
                                if (err) reject(err);
                                else resolve(countFilesFiltering);
                            });
                    }).then(countFilesFiltering => {
                        redis.hmset(`task_filtering_all_information:${self.info.taskIndex}`, {
                            'jobStatus': self.info.processing,
                            'dateTimeEndFilter': +new Date(),
                            'countFilesProcessed': countFilesFiltering,
                            'countFilesUnprocessed': self.info.countFilesUnprocessed,
                            'countCycleComplete': self.info.countCycleComplete,
                            'countFilesFound': self.info.countFilesFound,
                            'countFoundFilesSize': self.info.countFoundFilesSize
                        }, err => {
                            if (err) throw (err);

                            globalObject.deleteData('processingTasks', self.info.taskIndex);

                            callback(null, true);
                        });
                    }).catch(err => {
                        callback(err);
                    });
                },
                callback => {
                    redis.lpush('task_filtering_index_processing_completed', self.info.taskIndex, function(err) {
                        if (err) callback(err);
                        else callback(null, true);
                    });
                },
                callback => {
                    globalObject.deleteData('processingTasks', self.info.taskIndex);

                    callback(null, true);
                }
            ], (err, result) => {
                if (err) return func(new errorsType.errorRedisDataBase('Error: redis data base'));

                let isTrue = result.every(item => item);

                if (isTrue) func(null);
                else func(new errorsType.undefinedServerError('Error: undefined server error'));
            });
        };

        let processingSecondPart = function(func) {
            processingListFilesFoundDuringFiltering.createList({
                'sourceId': sourceID,
                'taskIndex': self.info.taskIndex,
                'filesList': self.info.listFilesFoundDuringFiltering
            }, redis).then(() => {
                if (self.info.numberMessageParts[0] === self.info.numberMessageParts[1]) {
                    redis.hlen(`task_list_files_found_during_filtering:${sourceID}:${self.info.taskIndex}`, (err, listLength) => {
                        if (err) throw (err);

                        redis.hset(`task_filtering_all_information:${self.info.taskIndex}`, 'countFilesFound', listLength, (err) => {
                            if (err) throw (err);
                            else func(null);
                        });
                    });
                } else {
                    func(null);
                }
            }).catch(err => {
                func(err);
            });
        };

        if (!Array.isArray(self.info.numberMessageParts) || (self.info.numberMessageParts.length !== 2)) {
            return callback(new errorsType.receivedIncorrectData('received incorrect data'));
        }

        //первая часть сообщения
        if (self.info.numberMessageParts[0] === 0) {
            processingFirstPart(err => {
                if (err) callback(err);
                else callback(null);
            });
        } else {
            //последующие части
            processingSecondPart(err => {
                if (err) callback(err);
            });
        }
    }

    if (self.info.processing === 'stop') {
        new Promise((resolve, reject) => {
            redis.hmset(`task_filtering_all_information:${self.info.taskIndex}`, {
                'jobStatus': self.info.processing,
                'dateTimeEndFilter': +new Date()
            }, err => {
                if (err) reject(err);
                else resolve();
            });
        }).then(() => {
            globalObject.deleteData('processingTasks', self.info.taskIndex);

            callback(null);
        }).catch(err => {
            callback(err);
        });
    }
};

//обработка информации об импорте файлов
let messageTypeUpload = function(redis, sourceID, callback) {
    let self = this;

    if (!new RegExp('^[a-zA-Z0-9:]').test(self.info.taskIndex)) {
        return callback(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    let objProcessing = {
        'ready': processingToDownloadFiles.ready,
        'execute': processingToDownloadFiles.execute,
        'execute completed': processingToDownloadFiles.executeCompleted,
        'completed': processingToDownloadFiles.completed,
        'stop': processingToDownloadFiles.stop
    };

    objProcessing[self.info.processing](redis, self, sourceID, callback);
};

//проверка передоваемых данных
function checkUserData(obj) {
    let arrayResult = [];
    let objTest = {
        taskIndex: 'taskIndex',
        directoryFiltering: 'directory',
        ipAddress: 'ipaddressString',
        countDirectoryFiltering: 'int',
        countFullCycle: 'int',
        countCycleComplete: 'int',
        countFilesFiltering: 'int',
        countFilesChunk: 'int',
        countFilesFound: 'int',
        countFilesProcessed: 'int',
        countFilesUnprocessed: 'int',
        countMaxFilesSize: 'int',
        countFoundFilesSize: 'int'
    };
    let objPattern = {
        ipaddressString: new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$'),
        int: new RegExp('^[0-9]{1,}$'),
        taskIndex: new RegExp('^[a-zA-Z0-9]{1,}$'),
        directory: new RegExp('^[A-Za-z0-9_/]{1,}$')
    };

    let setKeyNotTest = new Set([
        'messageType',
        'processing',
        'listFilesFilter',
        'listCountFilesFilter',
        'numberMessageParts',
        'listFilesFoundDuringFiltering',
        'infoProcessingFile'
    ]);

    for (let name in obj) {
        if (setKeyNotTest.has(name)) {
            continue;
        } else if (name === 'useIndexes') {
            if (typeof obj[name] !== 'boolean') arrayResult.push(false);
            continue;
        } else if (typeof objTest[name] === 'undefined') {
            arrayResult.push(false);
            continue;
        }

        arrayResult.push(objPattern[objTest[name]].test(obj[name]));
    }

    let isTrue = arrayResult.every((item) => item);

    return isTrue;
}

//проверка количества передоваемых пользователем данных
function checkCountUserData(processingType, obj) {
    let objProcessingType = {
        'startFirst': [
            'processing',
            'taskIndex',
            'ipAddress',
            'directoryFiltering',
            'countDirectoryFiltering',
            'countFullCycle',
            'countFilesFiltering',
            'countMaxFilesSize',
            'useIndexes',
            'numberMessageParts',
            'listCountFilesFilter'
        ],
        'startSecond': [
            'processing',
            'taskIndex',
            'ipAddress',
            'numberMessageParts',
            'listFilesFilter'
        ],
        'execute': [
            'processing',
            'taskIndex',
            'ipAddress',
            'countCycleComplete',
            'countFilesFound',
            'countFoundFilesSize',
            'countFilesProcessed',
            'countFilesUnprocessed',
            'infoProcessingFile'
        ],
        'completeFirst': [
            'processing',
            'taskIndex',
            'ipAddress',
            'countCycleComplete',
            'countFilesFound',
            'countFoundFilesSize',
            'countFilesProcessed',
            'countFilesUnprocessed'
        ],
        'completeSecond': [
            'processing',
            'taskIndex',
            'ipAddress'
        ],
        'stop': [
            'processing',
            'taskIndex',
            'ipAddress',
        ]
    };

    if (processingType === 'start') {
        let messageTypeStart = (obj.info.numberMessageParts[0] === 0) ? 'startFirst' : 'startSecond';

        return objProcessingType[messageTypeStart].every((item) => (typeof obj.info[item] !== 'undefined'));
    } else if (processingType === 'executed') {
        let isExistOne = objProcessingType[processingType].every((item) => (typeof obj.info[item] !== 'undefined'));
        let isExistTwo = ['fileName', 'directoryLocation', 'statusProcessed'].every((item) => (typeof obj.info.infoProcessingFile[item] !== 'undefined'));

        return (isExistOne && isExistTwo);
    } else if (processingType === 'complete') {
        let messageTypeComplete = (obj.info.numberMessageParts[0] === 0) ? 'completeFirst' : 'completeSecond';

        return objProcessingType[messageTypeComplete].every((item) => (typeof obj.info[item] !== 'undefined'));
    } else {
        if (typeof objProcessingType[processingType] === 'undefined') return false;

        return objProcessingType[processingType].every((item) => (typeof obj.info[item] !== 'undefined'));
    }
}

//изменение состояний фильтрации и передачи файлов
function changingStatusReceiveErrorCode(redis, taskID, cb) {
    async.parallel([
        //изменяем состояние при фильтрации
        (parallelCallback) => {
            new Promise((resolve, reject) => {
                redis.hget(`task_filtering_all_information:${taskID}`, 'jobStatus', (err, jobStatus) => {
                    if (err) reject(err);
                    else resolve(jobStatus);
                });
            }).then(jobStatus => {
                if (jobStatus !== 'expect') return;

                return new Promise((resolve, reject) => {
                    redis.hset(`task_filtering_all_information:${taskID}`, 'jobStatus', 'rejected', err => {
                        if (err) reject(err);
                        else resolve(null);
                    });
                });
            }).then(() => {
                parallelCallback(null);
            }).catch(err => {
                parallelCallback(err);
            });
        },
        //изменяем состояние при загрузки файлов
        (parallelCallback) => {
            new Promise((resolve, reject) => {
                redis.hmget(`task_filtering_all_information:${taskID}`, 'uploadFiles', 'sourceId', (err, result) => {
                    if (err) reject(err);
                    else resolve({ 'uploadFiles': result[0], 'sourceId': result[1] });
                });
            }).then(({ uploadFiles, sourceId }) => {
                let arrStatus = ['expect', 'in line', 'suspended'];

                let isExist = arrStatus.some(status => {
                    return uploadFiles === status;
                });

                return {
                    'isExist': isExist,
                    'sourceID': sourceId
                };
            }).then(({ isExist, sourceID }) => {
                if (!isExist) return;

                return new Promise((resolve, reject) => {
                    redis.hset(`task_filtering_all_information:${taskID}`,
                        'uploadFiles',
                        'partially loaded',
                        err => {
                            if (err) reject(err);
                            else resolve();
                        });
                }).then(() => {
                    let listTables = ['task_turn_downloading_files', 'task_implementation_downloading_files'];

                    const promises = listTables.map(tableName => {
                        redis.lrem(tableName, 1, `${sourceID}:${taskID}`, err => {
                            if (err) throw (err);
                        });
                    });

                    return Promise.all(promises);
                });
            }).then(() => {
                parallelCallback(null);
            }).catch(err => {
                parallelCallback(err);
            });
        }
    ], (err) => {
        if (err) cb(err);
        else cb(null);
    });
}