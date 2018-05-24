/*
 * Маршруты для данных передаваемых через websocket
 *
 * Версия 0.1, дата релиза 11.12.2015
 * */

'use strict';

const debug = require('debug')('routeWebsocket.js');
const async = require('async');

const errorsType = require('../errors/errorsType');
const controllers = require('../controllers');
const globalObject = require('../configure/globalObject');
const processingToDownloadFiles = require('../libs/management_download_files/processingToDownloadFiles');
const processingListFilesForFiltering = require('../libs/list_file_management/processingListFilesForFiltering');

/**
 * роутинг websocket соединения
 * 
 * @param {*} objData 
 * @param {*} remoteHostId 
 * @param {*} callback 
 */
module.exports.route = function(objData, remoteHostId, callback) {
    let redis = controllers.connectRedis();
    let objRoutes = {
        'undefined': messageTypeUndefined,
        'error': messageTypeError,
        'pong': messagePong,
        'information': messageTypeInformation,
        'filtering': messageTypeFiltering,
        'download files': messageTypeUpload
    };

    debug(`++++++|||||||| responsed type message: ${objData.messageType} ||||||||||||++++++++`);

    if (typeof objRoutes[objData.messageType] === 'undefined') callback();
    else objRoutes[objData.messageType].call(objData, redis, remoteHostId, callback);
};

//обработка ошибки возникающей при не найденном типе messageType
let messageTypeUndefined = function(redis, remoteHostId, callback) {
    return callback(new errorsType.errorRemoteHost('type messageType not found'));
};

//обработка ошибок принимаемых от удаленных источников
let messageTypeError = function(redis, remoteHostId, callback) {
    let dateUnix = +new Date();
    let obj = {
        ip: this.serverIp,
        dateTime: dateUnix,
        errorCode: this.errorCode,
        errorMessage: this.errorMessage
    };

    if (this.taskId === null) return callback();

    redis.zadd('remote_host:errors:' + remoteHostId, dateUnix, JSON.stringify(obj), function(err) {
        if (err) return callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
    });
    //ошибка авторизации на источнике
    if (+this.errorCode === 403) {
        redis.hset('remote_host:settings:' + remoteHostId, 'isAuthorization', false, function(err) {
            if (err) return callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
        });
    }
    /*
     * отсутствует сетевой трафик за выбранный промежуток времени или
     * превышен лимит одновременно запущеных задач на фильтрацию
     * */
    if (+this.errorCode === 410 || +this.errorCode === 413 || +this.errorCode === 500) {
        let taskId = (~this.taskId.indexOf(':')) ? this.taskId.split(':')[1] : this.taskId;
        redis.hget('task_filtering_all_information:' + taskId, 'jobStatus', function(err, jobStatus) {
            if (err) return callback(new errorsType.errorRedisDataBase('error Redis Data Base'));

            if (jobStatus === 'expect') {
                redis.hset('task_filtering_all_information:' + taskId, 'jobStatus', 'rejected', function(err) {
                    if (err) return callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
                });
            }
        });
    }

    /*
     * данная ошибка возникает при невозможности остановить загрузку файлов
     * изменяем значения в таблице task_filtering_all_information:*
     * */
    if (+this.errorCode === 414) {

        debug('ERROR error code 414');

        redis.hmset('task_filtering_all_information:' + this.taskId, {
            'uploadFiles': 'loaded',
            'userNameStopUploadFiles': 'null',
            'dateTimeStopUploadFiles': 'null'
        }, (err) => {
            if (err) return callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
        });
    }

    callback();
};

//обработка messageType - pong, сравнение с настройками хоста хранящимися в БД
let messagePong = function(redis, remoteHostId, func) {
    let self = this;
    debug('PROCESSING MESSAGE - PONG');
    //let arrItemSetupRemoteHost = ['maxCountProcessFiltering', 'intervalTransmissionInformation'];

    if (typeof self.info === 'undefined') {
        return func(new errorsType.receivedIncorrectData('the \'info\' field is missing in the json object'));
    }

    async.series([
        (callback) => {
            redis.hmget('remote_host:settings:' + remoteHostId,
                'maxCountProcessFiltering',
                (err, arrayResult) => {
                    if (err) return callback(err);

                    let maxCountProcessFilteringIsExist = parseInt(arrayResult[0]) === self.info.maxCountProcessFiltering;

                    if (!maxCountProcessFilteringIsExist) {
                        callback(new errorsType.errorRemoteHost('some parameters for remote host ' + remoteHostId + ' is not installed'));
                    } else {
                        callback(null);
                    }
                });


            /*async.forEachOf(arrItemSetupRemoteHost, function(value, key, feedback) {
                redis.hget('remote_host:settings:' + remoteHostId, value, function(err, keyElem) {
                    if (err) return feedback(err);

                    if (keyElem !== self.info[value]) {
                        feedback(new errorsType.errorRemoteHost('some parameters for remote host ' + remoteHostId + ' is not installed'));
                    } else {
                        feedback(null, 'successfully');
                    }
                });
            }, function(err) {
                if (err) func(err);
                else func(null, 'successfully');
            });*/
        },
        (callback) => {
            redis.hset('remote_host:settings:' + remoteHostId, 'isAuthorization', true, function(err) {
                if (err) callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
                else callback(null);
            });
        }
    ], (err) => {
        if (err) func(err);
        else func(null, 'successfully');
    });
};

//обработка информации о состоянии источника
let messageTypeInformation = function(redis, remoteHostId, func) {
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
            return func(new errorsType.errorRemoteHost('some parameters for remote host ' + remoteHostId + ' is not installed'));
        }

        if (arrItemDataReceive[i][1] === 'object') objResult[nameParameter] = JSON.stringify(self.info[nameParameter]);
        else objResult[nameParameter] = self.info[nameParameter].toString();
    }

    new Promise((resolve, reject) => {
        redis.hmset('remote_host:information:' + remoteHostId, objResult, (err) => {
            if (err) reject(new errorsType.errorRedisDataBase('error Redis Data Base'));
            else resolve();
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            redis.hset('remote_host:information:' + remoteHostId, 'dateTimeReceived', +new Date(), (err) => {
                if (err) reject(new errorsType.errorRedisDataBase('error Redis Data Base'));
                else resolve();
            });
        });
    }).then(() => {
        func(null, 'successfully');
    }).catch((err) => {
        func(err);
    });
};

//обработка информации о ходе фильтрации
let messageTypeFiltering = function(redis, remoteHostId, callback) {
    let self = this;

    let triggerCheckUserData = checkUserData(self.info);
    let triggerCheckCountUserData = checkCountUserData(self.info.processing, self);

    debug(`triggerCheckUserData = ${triggerCheckUserData}, triggerCheckCountUserData = ${triggerCheckCountUserData}`);

    if (!triggerCheckUserData || !triggerCheckCountUserData) {
        return callback(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    if (self.info.processing === 'start') {

        debug('START FILTERING');

        //если фрагмент сообщения первый
        if (self.info.numberMessageParts[0] === 0) {
            async.parallel([
                //запись в таблицу task_filtering_all_information:* основной информации
                (callback) => {
                    redis.hmset('task_filtering_all_information:' + self.info.taskIndex, {
                        'dateTimeStartFilter': +new Date(),
                        'jobStatus': self.info.processing,
                        'directoryFiltering': self.info.directoryFiltering,
                        'countDirectoryFiltering': self.info.countDirectoryFiltering,
                        'countFullCycle': self.info.countFullCycle,
                        'countCycleComplete': self.info.countCycleComplete,
                        'countFilesFiltering': self.info.countFilesFiltering,
                        'countFilesFound': self.info.countFilesFound,
                        'countFilesProcessed': self.info.countFilesProcessed,
                        'countFilesUnprocessed': self.info.countFilesUnprocessed,
                        'countMaxFilesSize': self.info.countMaxFilesSize,
                        'countFoundFilesSize': self.info.countFoundFilesSize,
                        'filterUseIndex': self.info.useIndexes
                    }, (err) => {
                        if (err) callback(err);
                        else callback(null);
                    });
                },
                //добавление в объект globalObject информации по задаче
                (callback) => {
                    globalObject.setData('processingTasks', self.info.taskIndex, {
                        'taskType': 'filtering',
                        'sourceId': remoteHostId,
                        'status': 'execute',
                        'timestampStart': +new Date(),
                        'timestampModify': +new Date()
                    });

                    callback(null);
                },
            ], (err) => {
                if (err) callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
                else callback(null);
            });
        } else {
            //создание списков task_filter_list_files:<ID source>:<ID task>:<path directory> содержащих файлы по которым будет вполнятся фильтрация
            processingListFilesForFiltering.createList({
                sourceId: remoteHostId,
                taskIndex: self.info.taskIndex,
                objFilesList: self.info.listFilesFilter
            }, redis).then(() => {
                if (self.info.numberMessageParts[0] === self.info.numberMessageParts[1]) {

                    debug('End segments message for filtering');
                    debug('Emit event START message');

                    callback(null);
                }
            }).catch(err => {
                callback(err);
            });
        }
    }

    if (self.info.processing === 'execute') {

        debug('START EXECUTE');

        if (typeof self.info.infoProcessingFile.statusProcessed === 'undefined') {
            callback(new errorsType.receivedIncorrectData('received incorrect data'));
        }

        async.parallel([
            (callback) => {
                let taskIndexes = Object.keys(globalObject.getDataTaskFilter());

                if (taskIndexes.length === 0) {
                    globalObject.setData('processingTasks', self.info.taskIndex, {
                        'taskType': 'filtering',
                        'sourceId': remoteHostId,
                        'status': 'execute',
                        'timestampStart': +new Date(),
                        'timestampModify': +new Date()
                    });

                    return callback(null);
                }
                let isExist = false;
                taskIndexes.forEach((index) => {
                    if (self.info.taskIndex === index) isExist = true;
                });

                if (!isExist) {
                    globalObject.setData('processingTasks', self.info.taskIndex, {
                        'taskType': 'filtering',
                        'sourceId': remoteHostId,
                        'status': 'execute',
                        'timestampStart': +new Date(),
                        'timestampModify': +new Date()
                    });
                }
                callback(null);
            },
            (callback) => {
                redis.hmset('task_filtering_all_information:' + self.info.taskIndex, {
                    'jobStatus': self.info.processing,
                    'countFilesFound': self.info.countFilesFound,
                    'countFilesProcessed': self.info.countFilesProcessed,
                    'countFilesUnprocessed': self.info.countFilesUnprocessed,
                    'countCycleComplete': self.info.countCycleComplete,
                    'countFoundFilesSize': self.info.countFoundFilesSize
                }, (err) => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            (callback) => {
                processingListFilesForFiltering.modifyList({
                    sourceId: remoteHostId,
                    taskIndex: self.info.taskIndex,
                    directoryName: self.info.infoProcessingFile,
                    fileName: self.info.infoProcessingFile.fileName
                }, redis, (err) => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], (err) => {
            if (err) return callback(err);

            if (self.info.infoProcessingFile.statusProcessed) return callback(null);

            new Promise((resolve, reject) => {
                redis.hget('task_filtering_all_information:' + self.info.taskIndex, 'listFilesUnprocessing', (err, listFilesUnprocessing) => {
                    if (err) reject(err);
                    else resolve(listFilesUnprocessing);
                });
            }).then((listFilesUnprocessing) => {
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
                    redis.hset('task_filtering_all_information:' + self.info.taskIndex, 'listFilesUnprocessing', stringResultFilesUnprocessing, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            }).then(() => {
                callback(null);
            }).catch((err) => {
                callback(err);
            });
        });
    }

    if (self.info.processing === 'complete') {
        console.log(self.info);

        async.parallel([
            (callback) => {
                console.log('--- routeWebsocket (message COMPLETE): 111');

                redis.hmset('task_filtering_all_information:' + self.info.taskIndex, {
                    'jobStatus': self.info.processing,
                    'dateTimeEndFilter': +new Date(),
                    'countFilesFound': self.info.countFilesFound,
                    'countFilesProcessed': self.info.countFilesProcessed,
                    'countFilesUnprocessed': self.info.countFilesUnprocessed,
                    'countCycleComplete': self.info.countCycleComplete,
                    'countFoundFilesSize': self.info.countFoundFilesSize
                }, (err) => {
                    if (err) callback(err);
                    else callback(null, true);
                });
            },
            (callback) => {
                console.log('--- routeWebsocket (message COMPLETE): 222');

                redis.lpush('task_filtering_index_processing_completed', self.info.taskIndex, function(err) {
                    if (err) callback(err);
                    else callback(null, true);
                });
            },
            (callback) => {
                console.log('--- routeWebsocket (message COMPLETE): 333');

                globalObject.deleteData('processingTasks', self.info.taskIndex);

                callback(null, true);
                /*redis.lrem('task_filtering_index_processing_executed', [0, self.info.taskIndex], function(err) {
                    if (err) callback(err);
                    else callback(null, true);
                });*/
            }
        ], (err, result) => {
            if (err) return callback(new errorsType.errorRedisDataBase('error Redis Data Base'));

            let isTrue = result.every((item) => item);

            if (isTrue) callback(null);
            else callback(new errorsType.undefinedServerError('undefined server error'));
        });
    }

    if (self.info.processing === 'stop') {
        redis.hmset('task_filtering_all_information:' + self.info.taskIndex, {
            'jobStatus': self.info.processing,
            'dateTimeEndFilter': +new Date(),
            'countFilesFound': self.info.countFilesFound,
            'countFilesProcessed': self.info.countFilesProcessed,
            'countFilesUnprocessed': self.info.countFilesUnprocessed,
            'countCycleComplete': self.info.countCycleComplete,
            'countFoundFilesSize': self.info.countFoundFilesSize
        }, (err) => {
            if (err) return callback(new errorsType.errorRedisDataBase('error Redis Data Base'));

            globalObject.deleteData('processingTasks', self.info.taskIndex);

            callback(null);
            /*redis.lrem('task_filtering_index_processing_executed', [0, self.info.taskIndex], function(err) {
                if (err) callback(new errorsType.errorRedisDataBase('error Redis Data Base'));
                else callback(null);
            });*/
        });
    }
};

//обработка информации об импорте файлов
let messageTypeUpload = function(redis, remoteHostId, callback) {
    let self = this;

    if (!new RegExp('^[a-zA-Z0-9:]').test(self.info.taskIndex)) {
        return callback(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    if (!(~self.info.taskIndex.indexOf(':'))) {
        return callback(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    let wsConnection = objWebsocket['remote_host:' + self.info.taskIndex.split(':')[0]];

    let objProcessing = {
        'ready': processingToDownloadFiles.ready,
        'execute': processingToDownloadFiles.execute,
        'execute completed': processingToDownloadFiles.executeCompleted,
        'execute retransmission': processingToDownloadFiles.executeRetransmission,
        'execute retransmission completed': processingToDownloadFiles.executeRetransmissionCompleted,
        'stop': processingToDownloadFiles.stop,
        'complete': processingToDownloadFiles.complete,
        'cancel': processingToDownloadFiles.cancel
    };

    objProcessing[self.info.processing](redis, self, wsConnection, callback);
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
    let arrayProcessingStopOrComplete = [
        'processing',
        'ipAddress',
        'taskIndex',
        'countCycleComplete',
        'countFilesFound',
        'countFoundFilesSize',
        'countFilesProcessed',
        'countFilesUnprocessed',
    ];

    let objProcessingType = {
        'startFirst': [
            'processing',
            'ipAddress',
            'taskIndex',
            'directoryFiltering',
            'countDirectoryFiltering',
            'countFullCycle',
            'countCycleComplete',
            'countFilesFiltering',
            'countFilesFound',
            'countFilesProcessed',
            'countFilesUnprocessed',
            'countMaxFilesSize',
            'countFoundFilesSize',
            'useIndexes',
            'numberMessageParts',
            'listCountFilesFilter'
        ],
        'startSecond': [
            'processing',
            'ipAddress',
            'taskIndex',
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
        'complete': arrayProcessingStopOrComplete,
        'stop': arrayProcessingStopOrComplete
    };

    if (processingType === 'start') {
        let messageTypeStart = (obj.info.numberMessageParts[0] === 0) ? 'startFirst' : 'startSecond';
        /*debug('111 = ' + obj.info.numberMessageParts[0]);
        debug(objProcessingType[messageTypeStart].every((item) => {
            debug(messageTypeStart);
            debug('********** ' + item + ' = ' + obj.info[item]);
            return (typeof obj.info[item] !== 'undefined');
        }));*/
        return objProcessingType[messageTypeStart].every((item) => (typeof obj.info[item] !== 'undefined'));
    } else if (processingType === 'executed') {

        let isExistOne = objProcessingType[processingType].every((item) => (typeof obj.info[item] !== 'undefined'));
        let isExistTwo = ['fileName', 'directoryLocation', 'statusProcessed'].every((item) => (typeof obj.info.infoProcessingFile[item] !== 'undefined'));

        return (isExistOne && isExistTwo);
    } else {
        if (typeof objProcessingType[processingType] === 'undefined') return false;

        return objProcessingType[processingType].every((item) => (typeof obj.info[item] !== 'undefined'));
    }
}