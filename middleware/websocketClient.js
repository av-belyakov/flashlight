/*
 *
 * Установление соединений через протокол websocket с удаленными хостами
 *
 * Версия 0.32, дата релиза 01.11.2018
 * */

'use strict';

const buf = require('buffer').Buffer;
const async = require('async');
const https = require('https');
const validator = require('validator');
const webSocketClient = require('websocket').client;

const debug = require('debug')('websocketClient.js');

const config = require('../configure');
const controllers = require('../controllers');
const globalObject = require('../configure/globalObject');
const objWebsocket = require('../configure/objWebsocket');
const writeLogFile = require('../libs/writeLogFile');
const routeSocketIo = require('../routes/routeSocketIo');
const routeWebsocket = require('../routes/routeWebsocket');
const downloadManagementFiles = require('../libs/management_download_files/downloadManagementFiles');
const getRemoteHostSetupDbRedis = require('../libs/getRemoteHostSetupDbRedis');
const controllingConnectedSources = require('../libs/controllingConnectedSources');
const sendMsgTaskDownloadChangeObjectStatus = require('../libs/helpers/sendMsgTaskDownloadChangeObjectStatus');
const processingDownloadFilesConnectionClosed = require('../libs/management_download_files/processingDownloadFilesConnectionClosed');

/*
 * remote_hosts_exist:id - список
 * remote_host:setup:* - хеши
 * remote_host:errors:* - упорядочные множества
 * remote_host:information:* - хеши
 * */
module.exports = function(socketIo) {
    const redis = controllers.connectRedis();

    new Promise((resolve, reject) => {
        redis.lrange('remote_hosts_exist:id', [0, -1], (err, arrayRemoteHost) => {
            if (err) reject(err);
            else resolve(arrayRemoteHost);
        });
    }).then((arrayRemoteHost) => {
        return new Promise((resolve, reject) => {
            async.forEachOf(arrayRemoteHost, (hostId, key, callbackForEachOf) => {
                getRemoteHostSetupDbRedis(redis, hostId, (err, objSetup) => {
                    if (err) return callbackForEachOf(err);

                    globalObject.setData('sources', hostId, {
                        'connectionStatus': 'disconnect',
                        'shortName': objSetup.shortName,
                        'detailedDescription': objSetup.detailedDescription,
                        'ipaddress': objSetup.ipaddress,
                        'port': objSetup.port,
                        'dateLastConnected': objSetup.dateLastConnected,
                        'wasThereConnectionBreak': false,
                        'numberConnectionAttempts': objSetup.numberConnectionAttempts,
                        'token': objSetup.token,
                        'maxCountProcessFiltering': objSetup.maxCountProcessFiltering
                    });

                    callbackForEachOf(null);
                });
            }, err => {
                if (err) reject(err);
                else resolve(null);
            });
        });
    }).then(() => {
        reconnect(redis, socketIo, function() {
            setInterval(reconnect.bind(null, redis, socketIo, err => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
            }), config.get('timerReconnectWebsocketClient'));
        });

        //отслеживание соединений с источниками и сброс соединений по источникам по которым отсутствуют данные заданное количество времени
        let controllingConnected = controllingConnectedSources(redis, socketIo);
        setInterval(controllingConnected.bind(null, err => {
            if (err) writeLogFile.writeLog('\tError: ' + err.toString());
        }), config.get('timeControllingConnectedSources'));
    }).catch((err) => {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
    });
};

//автоматическое пересоединение при отключении удаленного хоста
function reconnect(redis, socketIo, callback) {
    let sources = globalObject.getData('sources');

    for (let hostId in sources) {
        if (sources[hostId].connectionStatus === 'disconnect') {
            createWebsocketConnect(redis, socketIo, hostId);
        }
    }

    callback();
}

//устанавливаем соединения находящиеся в remote_host_connect:disconnect:*
function createWebsocketConnect(redis, socketIo, hostId) {
    let sourceInfo = globalObject.getData('sources', hostId);

    let websocketTmp = new webSocketClient({
        closeTimeout: 3000,
        tlsOptions: {
            host: sourceInfo.ipaddress,
            port: sourceInfo.port,
            servername: sourceInfo.ipaddress,
            method: 'GET',
            path: '/wss',
            rejectUnauthorized: false
        }
    });

    websocketTmp.on('connectFailed', err => {
        if (err) writeLogFile.writeLog(`\t${err.toString()}`);

        if (options.host === '127.0.0.1') {
            debug('--- connectFailed ----');
            debug(err);
        }

        checkSourceExist(redis, hostId, socketIo, trigger => {
            if (trigger) {
                redis.hset('remote_host:settings:' + hostId, 'numberConnectionAttempts', ++sourceInfo.numberConnectionAttempts);
            }
        });
    });

    websocketTmp.on('connect', connection => {
        let remoteHost = 'remote_host:' + hostId;

        //if (options.host === '127.0.0.1') debug(connection);

        if (typeof objWebsocket[remoteHost] !== 'undefined') return connection.drop(1000);

        objWebsocket[remoteHost] = connection;

        //изменяем состояние соединения
        writeConnectionStatus(hostId, 'connect', err => {
            if (err) writeLogFile.writeLog(`\tError: ${err.toString()}`);

            addHandlerConnection({
                'redis': redis,
                'connection': connection,
                'socketIo': socketIo,
                'hostId': hostId,
                'sourceInfo': sourceInfo
            });
        });

        let successConnectDate = +new Date();

        //устанавливаем дату последнего удачного соединения
        redis.hset('remote_host:settings:' + hostId, 'dateLastConnected', successConnectDate);
        globalObject.setData('sources', hostId, 'dateLastConnected', successConnectDate);

        //устанавливаем значение сообщающее о том что соединение с источником ранее было установлено
        globalObject.setData('sources', hostId, 'wasThereConnectionBreak', true);

        writeLogFile.writeLog('\tInfo: connection with the remote host ' + hostId + ' established');

        /** START TEST */
        //1010:0bf777b4fa88eb844c7b140f96ba2e9e

        /*new Promise((resolve, reject) => {
            redis.lpush('task_turn_downloading_files', '1010:0bf777b4fa88eb844c7b140f96ba2e9e', err => {
                if (err) reject(err);
                else resolve();
            });
        }).then(() => {
            return new Promise((resolve, reject) => {
                resumeDownloadFiles(redis, hostId, err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }).catch(err => {
            debug(err);
        });*/
        /** TEST END */


        resumeDownloadFiles(redis, hostId, err => {
            if (err) writeLogFile.writeLog(`\tError: ${err.toString()}`);
        });
    });

    websocketTmp.on('error', err => {
        writeLogFile.writeLog(`\t${err.toString()}`);

        if (options.host === '127.0.0.1') debug(err);
    });

    let options = {
        host: sourceInfo.ipaddress,
        port: sourceInfo.port,
        method: 'GET',
        path: '/',
        rejectUnauthorized: false,
        headers: {
            'Content-Type': 'text/plain;charset=utf-8',
            'Accept-Language': 'en',
            'User-Agent': 'Mozilla/5.0 (Flashlight)',
            'Token': sourceInfo.token
        }
    };

    //предварительный HTTP запрос
    let req = https.request(options, res => {

        //проверка ответа HTTP сервера
        debug('ip address = ' + options.host);
        debug(res.statusCode + ' (' + res.statusMessage + ')');

        if (res.statusCode === 301) {

            debug('REQUEST WEBSOCKET START');
            debug('REDIRECTION FOR ' + res.headers.location);

            //запрос на соединение по протоколу webSocket
            websocketTmp.connect(`wss://${sourceInfo.ipaddress}:${sourceInfo.port}/wss`);
        } else {
            writeLogFile.writeLog(`\tError: connection error to remote host ${hostId}, IP ${sourceInfo.ipaddress}, code ${res.statusCode} (${res.statusMessage})`);
        }

        res.on('data', () => {});
        res.on('end', () => {});
    });

    req.on('error', (err) => {
        writeLogFile.writeLog(`\t${err.toString()} error remote host ${hostId}`);
    });

    req.end();
}

//добавляет обработчики на установленное соединение и получает объекты соединения
function addHandlerConnection(objSetup) {
    const MARKER_LENGTH = 32;

    let remoteHost = `remote_host:${objSetup.hostId}`;

    //отправляем эхо-запрос с некоторыми параметрами
    sendPing(objSetup.connection, objSetup.sourceInfo);

    objSetup.connection.on('error', err => {

        debug('///////////////////// ERROR ||||||||||||||||||||||||||||||');
        debug(err);

        if (err) writeLogFile.writeLog(`\tError: connect error: ${err.toString()}`);

        //изменяем состояние соединения
        writeConnectionStatus(objSetup.hostId, 'disconnect', (err) => {
            if (err) writeLogFile.writeLog(`\tError: ${err.toString()}`);

            //изменяем статус загрузки файлов
            /*changeFieldUploadFiles(objSetup.redis, objSetup.hostId, err => {
                if (err) writeLogFile.writeLog(`\tError: connect error: ${err.toString()}`);
            });*/
        });
    });

    objSetup.connection.on('close', () => {

        debug('---------------------------------- connection CLOSED -----------------------');

        //изменяем состояние соединения
        writeConnectionStatus(objSetup.hostId, 'disconnect', err => {
            if (err) writeLogFile.writeLog('\tError: ' + err.toString());

            writeLogFile.writeLog(`\tInfo: connection with the remote host ${objSetup.hostId} terminated`);
            if (typeof objWebsocket[remoteHost] !== 'undefined') delete objWebsocket[remoteHost];


            new Promise((resolve, reject) => {
                objSetup.redis.lrange('task_turn_downloading_files', [0, -1], (err, list) => {
                    if (err) reject(err);
                    else resolve();
                });
            }).then(() => {
                debug('121212');

                return new Promise((resolve, reject) => {
                    delSourceIDTablesUploadFiles({ 'redis': objSetup.redis, 'sourceID': objSetup.hostId }, err => {
                        if (err) reject(err);
                        else resolve();
                    });

                });

                //return Promise.all(delSourceIDTablesUploadFiles({ 'redis': objSetup.redis, 'sourceID': objSetup.hostId }));
            }).then(() => {
                debug('23232323');
                //изменяем состояние 'uploadFiles' в таблицах 'task_filtering_all_information:*'
                return processingDownloadFilesConnectionClosed(objSetup.redis, objSetup.hostId);
            }).then(objListTasks => {

                debug('34343434');
                debug(objListTasks);

                /** TEST start */
                /*objSetup.redis.lrange('task_turn_downloading_files', [0, -1], (err, list) => {
                    if (err) return debug(err);

                    debug('list from table task_turn_downloading_files');
                    debug(list);
                });*/
                /** TEST stop */

                let arrTaskIndex = [];
                for (let key in objListTasks) {
                    objListTasks[key].forEach(item => {
                        if (typeof item.taskIndex !== 'undefined') {
                            arrTaskIndex.push(item.taskIndex);
                        }
                    });
                }

                debug('array ID task index');
                debug(arrTaskIndex);

                //генерируем событие удаляющее виджет визуализирующий загрузку файла
                arrTaskIndex.forEach(item => {
                    let objFileInfo = {
                        'information': {
                            'taskIndex': item
                        }
                    };

                    objSetup.socketIo.emit('task upload files cancel', objFileInfo);
                });

                async.each(arrTaskIndex, (item, callbackEach) => {
                    //изменяем состояние задачи на странице управления задачами
                    sendMsgTaskDownloadChangeObjectStatus(objSetup.redis, item, objSetup.socketIo, err => {
                        if (err) callbackEach(err);
                        else callbackEach(null);
                    });
                }, err => {
                    if (err) writeLogFile.writeLog(`\tError: ${err.toString()}, routingRequestDownloadFiles.js`);

                    //изменяем состояние источника
                    routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, { messageType: 'close' });
                });
            }).catch(err => {

                debug(err);

                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
            });

            /*delSourceIDTablesUploadFiles(objSetup.redis, objSetup.hostId)
                .then(() => {
                    //изменяем состояние 'uploadFiles' в таблицах 'task_filtering_all_information:*'
                    return processingDownloadFilesConnectionClosed(objSetup.redis, objSetup.hostId);
                }).then(() => {

                    redis.lrange('task_turn_downloading_files', [0, -1], (err, list) => {
                        if (err) return debug(err);

                        debug('list from table task_turn_downloading_files');
                        debug(list);
                    });

                    routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, { messageType: 'close' });
                }).catch(err => {
                    if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                });*/
        });
    });

    objSetup.connection.on('message', message => {
        if (message.type === 'utf8') {
            let objData = getParseStringJSON(message);

            if (objData.messageType === 'download files') {
                debug('+++++++++++++++++');
                debug(objData);
                debug('-----------------');
            }

            routeWebsocket.route(objData, objSetup.hostId, (err, notifyMessage) => {
                if (err) {

                    debug('---*** ERROR ***---');
                    debug(err);
                    debug('--------******--------');

                    let errObj = {
                        'messageType': 'error',
                        'errorCode': 500,
                        'errorMessage': null
                    };

                    if ((typeof err.name !== 'undefined') && (typeof err.message !== 'undefined')) {
                        errObj.errorMessage = err.message;
                        writeLogFile.writeLog(`\tError: ${err.message}`);
                    } else {
                        writeLogFile.writeLog(`\tError: ${err.toString()}`);
                    }

                    routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, errObj);
                } else {
                    /*if (stringMessage.messageType !== 'information') {
                        debug('--- NOTIFY MESSAGE START ---');
                        debug(notifyMessage);
                        debug('++++++++++++++++');
                        debug(stringMessage);

                    }*/

                    routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, objData, notifyMessage);
                }
            });
        }

        //как правило это прием бинарного файла сетевого трафика
        if (message.type === 'binary') {

            //debug(`---------------------------- MESSAGE BINARY ---------- hostId ${objSetup.hostId} -------------`);

            let infoDownloadFile = globalObject.getData('downloadFilesTmp', objSetup.hostId);

            //debug(globalObject.getData('downloadFilesTmp'));

            if ((infoDownloadFile === null) || (typeof infoDownloadFile === 'undefined')) {
                writeLogFile.writeLog('\tError: not found a temporary object \'downloadFilesTmp\' to store information about the download file');

                return routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, /*objSetup.connection.remoteAddress,*/ {
                    messageType: 'error',
                    errorCode: 501,
                    errorMessage: '',
                    taskId: ''
                });
            }

            let newBuffer = buf.from(message.binaryData);

            //получаем маркер для идентификации открытого дискриптора файла
            let marker = newBuffer.toString('utf8', 0, MARKER_LENGTH);

            //let wsl = globalObject.getData('writeStreamLinks', `writeStreamLink_${objSetup.connection.remoteAddress}_${infoDownloadFile.fileName}`);
            let wsl = globalObject.getData('writeStreamLinks', marker);
            if ((wsl === null) || (typeof wsl === 'undefined')) {
                return writeLogFile.writeLog('\tError: not found a stream for writing to a file');
            }

            let fileChunkSize = infoDownloadFile.fileChunkSize;
            let fileSizeTmp = infoDownloadFile.fileSizeTmp;

            if (fileSizeTmp <= fileChunkSize) {
                infoDownloadFile.fileSizeTmp += newBuffer.slice(MARKER_LENGTH).length;

                globalObject.modifyData('downloadFilesTmp', objSetup.hostId, [
                    ['fileSizeTmp', infoDownloadFile.fileSizeTmp]
                ]);
            } else {
                globalObject.modifyData('downloadFilesTmp', objSetup.hostId, [
                    ['fileSizeTmp', 0],
                    ['fileUploadedPercent', ++infoDownloadFile.fileUploadedPercent]
                ]);

                //генерируем событе прогресса загрузки файлов
                routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, {
                    'messageType': 'download files',
                    'info': {
                        'processing': 'update progress',
                        'taskIndex': infoDownloadFile.taskIndex
                    }
                }, '');
            }

            //проверяем передан ли файл полностью
            if ((message.binaryData.length === 51) && (newBuffer.toString('utf8', 33) === 'moth say: file_EOF')) {
                debug('RESIVED BYTES LAST FILE');
                debug('генерируем событие для закрытия дискриптора файла');

                /*
                                let source = globalObject.getData('sources', objSetup.hostId);
                                if ((source === null) || (typeof source === 'undefined')) {
                                    return writeLogFile.writeLog('\tError: not found a stream for writing to a file');
                                }

                                let fileName = globalObject.getData('downloadFilesTmp', objSetup.hostId).fileName;
                                let wsl = globalObject.getData('writeStreamLinks', `writeStreamLink_${source.ipaddress}_${fileName}`);

                                if ((wsl === null) || (typeof wsl === 'undefined')) {
                                    return writeLogFile.writeLog('\tError: not found a stream for writing to a file');
                                }
                */
                writeLogFile.writeLog(`Info: закрываем дискриптор потока на запись в файл ${infoDownloadFile.fileName}`);

                //закрываем дискриптор потока на запись в файл
                wsl.end();
            } else {
                //пишем кусочки файлов в поток
                wsl.write(newBuffer.slice(MARKER_LENGTH));
            }
        }
    });
}

function resumeDownloadFiles(redis, sourceID, cb) {
    new Promise((resolve, reject) => {
        redis.lrange('task_turn_downloading_files', [0, -1], (err, tasksList) => {
            if (err) reject(err);
            else resolve(tasksList);
        });
    }).then(tasksList => {

        debug(tasksList);

        let tasksListProcess = [];
        tasksList.forEach(task => {

            debug(task);

            if ((~task.indexOf(sourceID)) && (~task.indexOf(':'))) {
                tasksListProcess.push(task.split(':')[1]);
            }
        });

        debug(tasksListProcess);

        if (tasksListProcess.length === 0) return cb(null);

        return tasksListProcess;
    }).then(tasksListProcess => {
        //формируем и отправляем выбранному источнику запрос на выгрузку файлов в формате JSON
        return downloadManagementFiles.startRequestDownloadFiles(redis, {
            sourceID: sourceID,
            taskIndex: tasksListProcess[0],
            listFiles: []
        });
    }).then(() => {
        cb(null);
    }).catch(err => {
        cb(err);
    });
}

//изменение состояния поля uploadFiles хеш таблицы task_filtering_all_information:*
function changeFieldUploadFiles(redis, sourceId, func) {
    //*удаление идентификаторов источников из таблиц task_turn_downloading_files и task_implementation_downloading_files
    deleteSourceIdTablesDownloadFiles(redis, sourceId, (err, arraySourceDownloadingFiles) => {
        if (err) func(err);
        if (arraySourceDownloadingFiles.length === 0) return func(null);

        async.eachOf(arraySourceDownloadingFiles, (name, key, callbackEachOf) => {
            if (!~name.indexOf(':')) return callbackEachOf(new Error('undefined source ID'));

            let taskIndex = name.split(':')[1];
            redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'partially loaded', err => {
                if (err) callbackEachOf(err);
                else callbackEachOf();
            });
        }, function(err) {
            if (err) func(err);
            else func(null);
        });
    });
}


//удаление идентификатора отключенного источника из таблиц task_turn_downloading_files и task_implementation_downloading_files
function delSourceIDTablesUploadFiles({ redis, sourceID }, cb) {
    const listNameTables = ['task_turn_downloading_files', 'task_implementation_downloading_files'];

    async.each(listNameTables, (tableName, callback) => {
        new Promise((resolve, reject) => {

            debug('delSourceIDTablesUploadFiles --- проверка существования таблицы ' + tableName);

            redis.exists(tableName, (err, isExist) => {
                if (err) reject(err);
                else resolve(isExist);
            });
        }).then(isExist => {
            return new Promise((resolve, reject) => {

                debug('delSourceIDTablesUploadFiles --- table is exist:' + isExist);

                if (!isExist) return resolve([]);

                redis.lrange(tableName, [0, -1], (err, listTasks) => {
                    if (err) return reject(err);

                    let list = listTasks.filter(value => {
                        if (~value.indexOf(':')) {
                            return (sourceID === value.split(':')[0]);
                        }

                        return false;
                    });

                    debug('delSourceIDTablesUploadFiles --- список задач с совпадающим ID для таблицы ' + tableName);
                    debug(list);

                    resolve(list);
                });
            });
        }).then(listTasksDrop => {
            async.each(listTasksDrop, (item, callbackEach) => {

                debug(`delSourceIDTablesUploadFiles ---  delete ${item} from table name ${tableName}`);

                redis.lrem(tableName, 0, item, err => {
                    if (err) callbackEach(err);
                    else callbackEach();
                });
            }, err => {
                if (err) callback(err);
                else callback(null);
            });
        });
    }, err => {
        if (err) cb(err);
        else cb(null);
    });

    /*let promises = listNameTables.map(tableName => {
        new Promise((resolve, reject) => {

            debug('delSourceIDTablesUploadFiles --- проверка существования таблицы ' + tableName);

            redis.exists(tableName, (err, isExist) => {
                if (err) reject(err);
                else resolve(isExist);
            });
        }).then(isExist => {
            return new Promise((resolve, reject) => {

                debug('delSourceIDTablesUploadFiles --- table is exist:' + isExist);

                if (!isExist) return resolve([]);

                redis.lrange(tableName, [0, -1], (err, listTasks) => {
                    if (err) return reject(err);

                    let list = listTasks.filter(value => {
                        if (~value.indexOf(':')) {
                            return (sourceID === value.split(':')[0]);
                        }

                        return false;
                    });

                    debug('delSourceIDTablesUploadFiles --- список задач с совпадающим ID для таблицы ' + tableName);
                    debug(list);

                    resolve(list);
                });
            });
        }).then(listTasksDrop => {
            async.each(listTasksDrop, (item, callbackEach) => {

                debug(`delSourceIDTablesUploadFiles ---  delete ${item} from table name ${tableName}`);

                redis.lrem(tableName, 0, item, err => {
                    if (err) callbackEach(err);
                    else callbackEach();
                });
            }, err => {
                if (err) throw (err);
                else return;
            });
        }).catch(err => {

            debug(err);

            throw (err);
        });
    });

    return promises;*/
}

//удаление идентификатора отключенного источника из таблиц task_turn_downloading_files и task_implementation_downloading_files
function deleteSourceIdTablesDownloadFiles(redis, sourceId, func) {
    async.parallel({
        //проверка таблицы task_turn_downloading_files
        checkTaskTurnDownloadingFiles: function(callback) {
            redis.exists('task_turn_downloading_files', (err, isExist) => {
                if (err) return callback(err);
                if (isExist !== 1) return callback(null, true);

                redis.lrem('task_turn_downloading_files', 0, sourceId, err => {
                    if (err) callback(err);
                    else callback(null, true);
                });
            });
        },
        //проверка таблицы task_implementation_downloading_files
        checkTaskImplementationDownloadingFiles: function(callback) {
            redis.exists('task_implementation_downloading_files', (err, isExist) => {
                if (err) return callback(err);
                if (isExist !== 1) return callback(null, []);

                redis.lrange('task_implementation_downloading_files', [0, -1], (err, list) => {
                    if (err) return callback(err);

                    let newArray = [];
                    for (let num = 0; num < list.length; num++) {
                        if (~list[num].indexOf(':')) {
                            let source = list[num].split(':')[0];
                            if (sourceId === source) {
                                newArray.push(list[num]);
                                redis.lrem('task_implementation_downloading_files', 0, list[num]);
                            }
                        }
                    }

                    callback(null, newArray);
                });
            });
        }
    }, function(err, result) {
        if (err) func(err);
        else func(null, result.checkTaskImplementationDownloadingFiles);
    });
}

//изменение статуса соединения
function writeConnectionStatus(hostID, connectionStatus, callback) {
    if (!globalObject.getData('sources', hostID)) return callback(null);

    if (globalObject.setData('sources', hostID, 'connectionStatus', connectionStatus)) callback(null);
    else callback(new Error(`failed to change the connection status of the source ${hostID}`));
}

//отправляем эхо-запрос при успешном установлении websocket соединения
function sendPing(connection, obj) {
    /**
     * maxCountProcessFiltering - максимальное количество запущеных процессов фильтрации
     */
    connection.sendUTF(JSON.stringify({
        'messageType': 'ping',
        'info': {
            'maxCountProcessFiltering': parseInt(obj.maxCountProcessFiltering, 10)
        }
    }));
}

//проверить наличие добавляемого источника
function checkSourceExist(redis, hostId, socketIo, callbackFun) {
    redis.lrange('remote_hosts_exist:id', [0, -1], (err) => {
        if (err) {
            writeLogFile.writeLog(`\tError: ${err.toString()}`);
            callbackFun(socketIo, 'danger', 'Ошибка: невозможно добавить источник');
        } else {
            callbackFun((item) => item === hostId);
        }
    });
}

//разбирает JSON строку
function getParseStringJSON(stringJSON) {
    let obj = {};
    try {
        if (validator.isJSON(stringJSON.utf8Data)) {
            obj = JSON.parse(stringJSON.utf8Data);
        }
    } catch (err) {
        writeLogFile.writeLog(`\tError: ${err.toString()}`);
    }
    return obj;
}