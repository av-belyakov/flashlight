/*
 *
 * Установление соединений через протокол websocket с удаленными хостами
 *
 * Версия 0.21, дата релиза 28.02.2018
 * */

'use strict';

const fs = require('fs');
const async = require('async');
const https = require('https');
const config = require('../configure');
const validator = require('validator');
const webSocketClient = require('websocket').client;

const debug = require('debug')('websocketClient.js');

const controllers = require('../controllers');
const globalObject = require('../configure/globalObject');
const objWebsocket = require('../configure/objWebsocket');
const writeLogFile = require('./../libs/writeLogFile');
const routeSocketIo = require('../routes/routeSocketIo');
const routeWebsocket = require('../routes/routeWebsocket');
const getRemoteHostSetupDbRedis = require('../libs/getRemoteHostSetupDbRedis');
const controllingConnectedSources = require('../libs/controllingConnectedSources');


const objGlobal = {};

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
            }, (err) => {
                if (err) reject(err);
                else resolve(null);
            });
        });
    }).then(() => {
        reconnect(redis, socketIo, function() {
            setInterval(reconnect.bind(null, redis, socketIo, (err) => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
            }), config.get('timerReconnectWebsocketClient'));
        });

        //отслеживание соединений с источниками и сброс соединений по источникам по которым отсутствуют данные заданное количество времени
        let controllingConnected = controllingConnectedSources(redis, socketIo);
        setInterval(controllingConnected.bind(null, (err) => {
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

    websocketTmp.on('connectFailed', (err) => {
        if (err) writeLogFile.writeLog(`\t${err.toString()}`);

        if (options.host === '127.0.0.1') {
            debug('--- connectFailed ----');
            debug(err);
        }

        checkSourceExist(redis, hostId, socketIo, (trigger) => {
            if (trigger) {
                redis.hset('remote_host:settings:' + hostId, 'numberConnectionAttempts', ++sourceInfo.numberConnectionAttempts);
            }
        });
    });

    websocketTmp.on('connect', (connection) => {
        let remoteHost = 'remote_host:' + hostId;

        //if (options.host === '127.0.0.1') debug(connection);

        if (typeof objWebsocket[remoteHost] !== 'undefined') return connection.drop(1000);

        objWebsocket[remoteHost] = connection;
        //изменяем состояние соединения
        writeConnectionStatus(hostId, 'connect', (err) => {
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

        //устанавливаем значение сообщающее о том что соединение с источником ранее было разорванно
        globalObject.setData('sources', hostId, 'wasThereConnectionBreak', true);

        writeLogFile.writeLog('\tInfo: connection with the remote host ' + hostId + ' established');
    });

    websocketTmp.on('error', (err) => {
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
    let req = https.request(options, function(res) {

        //проверка ответа HTTP сервера
        debug('ip address = ' + options.host);
        debug(res.statusCode + ' (' + res.statusMessage + ')');

        if (res.statusCode === 301) {

            debug('REQUEST WEBSOCKET START');
            debug('REDIRECTION FOR ' + res.headers.location);

            //запрос на соединение по протоколу webSocket
            websocketTmp.connect('wss://' + sourceInfo.ipaddress + ':' + sourceInfo.port);
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
    let remoteHost = 'remote_host:' + objSetup.hostId;

    //отправляем эхо-запрос с некоторыми параметрами
    sendPing(objSetup.connection, objSetup.sourceInfo);

    objSetup.connection.on('error', (err) => {

        debug('///////////////////// ERROR ||||||||||||||||||||||||||||||');
        debug(err);

        if (err) writeLogFile.writeLog(`\tError: connect error: ${err.toString()}`);

        //изменяем состояние соединения
        writeConnectionStatus(objSetup.hostId, 'disconnect', (err) => {
            if (err) writeLogFile.writeLog(`\tError: ${err.toString()}`);

            //изменяем статус загрузки файлов
            changeFieldUploadFiles(objSetup.redis, objSetup.hostId, (err) => {
                if (err) writeLogFile.writeLog(`\tError: connect error: ${err.toString()}`);
            });
        });
    });

    objSetup.connection.on('close', () => {

        debug('---------------------------------- connection CLOSED to PING');

        //изменяем состояние соединения
        writeConnectionStatus(objSetup.hostId, 'disconnect', (err) => {
            if (err) writeLogFile.writeLog('\tError: ' + err.toString());

            writeLogFile.writeLog(`\tInfo: connection with the remote host ${objSetup.hostId} terminated`);
            if (typeof objWebsocket[remoteHost] !== 'undefined') delete objWebsocket[remoteHost];

            //изменяем статус загрузки файлов
            changeFieldUploadFiles(objSetup.redis, objSetup.hostId, (err) => {
                if (err) writeLogFile.writeLog(`\tError: connect error: ${err.toString()}`);
            });
            routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, { messageType: 'close' });
        });
    });

    objSetup.connection.on('message', (message) => {
        if (message.type === 'utf8') {
            let stringMessage = getParseStringJSON(message);

            if (stringMessage.messageType === 'filtering') {
                debug('STATUS TASK IS');
                debug(`processing: ${stringMessage.info.processing}, task ID ${stringMessage.info.taskIndex}`);
            }

            routeWebsocket.route(stringMessage, objSetup.hostId, (err, notifyMessage) => {
                if (err) {

                    debug('---*** ERROR ***---');
                    debug(err);
                    debug('--------******--------');

                    if (err.name === 'ErrorRemoteHost') writeLogFile.writeLog(`\tError: ${err.message.toString()}`);
                    else if (err.name === 'ErrorRedisDataBase') writeLogFile.writeLog(`\tError Redis: ${err.message.toString()}`);
                    else if (err.message !== 'undefined') writeLogFile.writeLog(`\t${err.message.toString()}`);
                    else writeLogFile.writeLog(`\t${err.toString()}`);

                    routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, {
                        'messageType': 'error',
                        'errorCode': 500
                    });
                } else {

                    /*if (stringMessage.messageType !== 'information') {
                        debug('--- NOTIFY MESSAGE START ---');
                        debug(notifyMessage);
                        debug('++++++++++++++++');
                        debug(stringMessage);

                    }*/

                    routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.hostId, stringMessage, notifyMessage);
                }
            });
        }

        //как правило это прием бинарного файла сетевого трафика
        if (message.type === 'binary') {
            if (typeof objGlobal.downloadFilesTmp[objSetup.connection.remoteAddress] === 'undefined') {
                writeLogFile.writeLog('\tError, not found a temporary object \'downloadFilesTmp\' to store information about the download file');

                routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.connection.remoteAddress, {
                    messageType: 'error',
                    errorCode: 501,
                    errorMessage: '',
                    taskId: ''
                });
            } else {
                let objDownloadFiles = objGlobal.downloadFilesTmp[objSetup.connection.remoteAddress];

                let fileChunkSize = objDownloadFiles.fileChunkSize;
                let fileSizeTmp = objDownloadFiles.fileSizeTmp;

                let messageBinaryDataString = message.binaryData.toString();

                if (fileSizeTmp <= fileChunkSize) {
                    objDownloadFiles.fileSizeTmp = fileSizeTmp + messageBinaryDataString.length;
                } else {
                    objDownloadFiles.fileSizeTmp = 0;
                    objDownloadFiles.fileUploadedPercent = ++objDownloadFiles.fileUploadedPercent;

                    //генерируем событе прогресса загрузки файлов
                    routeSocketIo.eventGenerator(objSetup.socketIo, objSetup.connection.remoteAddress, {
                        messageType: 'download files',
                        processing: 'update progress'
                    });
                }
                //пишем кусочки файлов в поток
                getStreamWrite(objSetup.connection.remoteAddress).write(message.binaryData);
            }
        }
    });
}


//изменение состояния поля uploadFiles хеш таблицы task_filtering_all_information:*
function changeFieldUploadFiles(redis, sourceId, func) {
    //*удаление идентификаторов источников из таблиц task_turn_downloading_files и task_implementation_downloading_files
    deleteSourceIdTablesDownloadFiles(redis, sourceId, (err, arraySourceDownloadingFiles) => {
        if (err) return func(err);
        if (arraySourceDownloadingFiles.length === 0) return func(null);

        async.eachOf(arraySourceDownloadingFiles, (name, key, callbackEachOf) => {
            if (!~name.indexOf(':')) return callbackEachOf(new Error('undefined source ID'));

            let taskIndex = name.split(':')[1];
            redis.hset('task_filtering_all_information:' + taskIndex, 'uploadFiles', 'suspended', (err) => {
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
function deleteSourceIdTablesDownloadFiles(redis, sourceId, func) {
    async.parallel({
        //проверка таблицы task_turn_downloading_files
        checkTaskTurnDownloadingFiles: function(callback) {
            redis.exists('task_turn_downloading_files', (err, isExist) => {
                if (err) return callback(err);

                if (isExist !== 1) return callback(null, true);

                redis.lrem('task_turn_downloading_files', 0, sourceId, (err) => {
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
                                redis.lrem('task_implementation_downloading_files', 0, list);
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

    /** 
     * 
     * 
     * ТЕСТОВЫЙ ЗАПРОС НА ФИЛЬТРАЦИЮ 
     * 
     * 
     * */
    /*connection.sendUTF(JSON.stringify(testFilteringJSON));

    for (let disk in testFilteringJSON.info.settings.listFilesFilter) {
        debug(`${disk} = ${testFilteringJSON.info.settings.listFilesFilter[disk].length} counts`);
    }*/

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

//получить ресурс доступа к streamWrite
function getStreamWrite(remoteAddress) {
    if (typeof objGlobal['writeStreamLink_' + remoteAddress] === 'undefined') {
        let writeStream = fs.createWriteStream('/' + config.get('downloadDirectoryTmp:directoryName') + '/uploading_with_' + remoteAddress + '.tmp');

        writeStream.on('error', function(err) {
            writeLogFile.writeLog(`\tError: ${err.toString()}`);
        });
        objGlobal['writeStreamLink_' + remoteAddress] = writeStream;

        return writeStream;
    } else {
        return objGlobal['writeStreamLink_' + remoteAddress];
    }
}

/*let testFilteringJSON = {
    'messageType': 'filtering',
    'info': {
        'processing': 'on',
        'taskIndex': 'ccef6e4e21f79ed149862883e425a982',
        'settings': {
            'dateTimeStart': /*1459582200,*/ //1496215020, //1401929460, //1451929460,
//'dateTimeEnd': /*1461915000*/ 1498720620,
/*'ipaddress': ['45.69.4.3', '78.45.123.6', '8.8.8.8'],
            'network': ['152.89.78.6/24'],
            'useIndexes': false,
            'listFilesFilter': {
                '/__CURRENT_DISK_1': [],
                '/__CURRENT_DISK_2': [],
                '/__CURRENT_DISK_3': [],
                'directoryName_2': [
                    '19_04_2016___14_09_28_139731.tdp',
                    '1436802636_2015_07_13____18_50_36_1337.tdp',
                    '1438528517_2015_08_02____18_15_17_95442.tdp',
                    '19_04_2016___14_33_28_750682.tdp',
                ],
                'directoryName_N': []
            }
        }
    }
};

let testFilteringJSON = {
    'messageType': 'filtering',
    'info': {
        'processing': 'on',
        'taskIndex': 'dsod999fvv',
        'settings': {
            'dateTimeStart': 1461929460,
            'dateTimeEnd': 1476447300,
            'ipaddress': ['45.69.4.3', '78.45.123.6'],
            'network': ['152.89.78.6/24'],
            'useIndexes': true,
            'listFilesFilter': {
                '/__CURRENT_DISK_1': [
                    '1436805198_2015_07_13____19_33_18_4301.tdp',
                    '1438534038_2015_08_02____19_47_18_8.tdp',
                    '19_04_2016___19_08_31_246937.tdp',
                    '1436805269_2015_07_13____19_34_29_65644.tdp',
                    '1438534136_2015_08_02____19_48_56_888055.tdp',
                    '19_04_2016___19_50_32_111438.tdp',
                    '1436805442_2015_07_13____19_37_22_1495.tdp',
                    '1438534282_2015_08_02____19_51_22_559.tdp',
                    '19_04_2016___21_09_37_212054.tdp',
                    '1436805451_2015_07_13____19_37_31_932657.tdp',
                    '1438534312_2015_08_02____19_51_52_500252.tdp',
                    '26_04_2016___00_01_32.tdp',
                    '1436805625_2015_07_13____19_40_25_2241.tdp',
                    '1438534465_2015_08_02____19_54_25_1078.tdp',
                    '26_04_2016___00_05_07.tdp',
                    '1436805636_2015_07_13____19_40_36_994722.tdp',
                    '1438534496_2015_08_02____19_54_56_902849.tdp',
                    '26_04_2016___00_08_58.tdp',
                    '1436805817_2015_07_13____19_43_37_198977.tdp',
                    '1438534678_2015_08_02____19_57_58_898116.tdp',
                    '26_04_2016___00_13_50.tdp',
                    '1436805869_2015_07_13____19_44_29_3677.tdp',
                    '1438534709_2015_08_02____19_58_29_725.tdp',
                    '26_04_2016___00_17_10.tdp',
                    '1436805999_2015_07_13____19_46_39_796469.tdp',
                    '1438534861_2015_08_02____20_01_01_397403.tdp',
                    '1436806113_2015_07_13____19_48_33_298.tdp',
                    '1438527602_2015_08_02____18_00_02_30735.tdp',
                    '19_04_2016___12_51_52_610425.tdp',
                    '1436802035_2015_07_13____18_40_35_657042.tdp',
                    '1436806185_2015_07_13____19_49_45_855238.tdp',
                    '1438535044_2015_08_02____20_04_04_395458.tdp',
                    '1436806296_2015_07_13____19_51_36_75.tdp',
                    '1438535136_2015_08_02____20_05_36_2797.tdp',
                    '26_04_2016___00_33_53.tdp',
                    'dddmdiimidwiimdi.cd',
                    'odoemoocoocococc.dsdwd',
                    'dowoddododoodd'
                ],
                '/__CURRENT_DISK_2': [
                    '1436801669_2015_07_13____18_34_29_561099.tdp',
                    '1438527053_2015_08_02____17_50_53_252866.tdp',
                    '19_04_2016___12_19_02_961978.tdp',
                    '1436801782_2015_07_13____18_36_22_97.tdp',
                    '1438527236_2015_08_02____17_53_56_586199.tdp',
                    '1438534465_2015_08_02____19_54_25_1078.tdp',
                    '26_04_2016___00_05_07.tdp',
                    '1436805636_2015_07_13____19_40_36_994722.tdp',
                    '19_04_2016___12_28_53_278912.tdp',
                    '1436801851_2015_07_13____18_37_31_588766.tdp',
                    '1438527419_2015_08_02____17_56_59_157592.tdp',
                    '19_04_2016___12_38_48_263519.tdp',
                    '1436801965_2015_07_13____18_39_25_328.tdp',
                    '1438527602_2015_08_02____18_00_02_30735.tdp',
                    '19_04_2016___12_51_52_610425.tdp',
                    '1436802035_2015_07_13____18_40_35_657042.tdp',
                    '1438527786_2015_08_02____18_03_06_301085.tdp',
                    '19_04_2016___13_07_07_272801.tdp',
                    '1436802209_2015_07_13____18_43_29_65.tdp',
                    '1438527974_2015_08_02____18_06_14_89631.tdp',
                    '19_04_2016___13_18_52_570849.tdp',
                    '1436802221_2015_07_13____18_43_41_27726.tdp',
                    '1438528121_2015_08_02____18_08_41_35.tdp',
                    '19_04_2016___13_31_44_307474.tdp',
                    '1436802400_2015_07_13____18_46_40_25894.tdp',
                    '1438528152_2015_08_02____18_09_12_955443.tdp',
                    '19_04_2016___13_44_24_752929.tdp',
                    '1436802453_2015_07_13____18_47_33_2284.tdp',
                    '1438528304_2015_08_02____18_11_44_371.tdp',
                    '19_04_2016___13_59_58_430969.tdp',
                    '1436802587_2015_07_13____18_49_47_455895.tdp',
                    '1438528336_2015_08_02____18_12_16_637316.tdp',
                    '19_04_2016___14_09_28_139731.tdp',
                    '1436802636_2015_07_13____18_50_36_1337.tdp',
                    '1438528517_2015_08_02____18_15_17_95442.tdp',
                    '19_04_2016___14_33_28_750682.tdp',
                    '1436802768_2015_07_13____18_52_48_704832.tdp',
                    '1438528670_2015_08_02____18_17_50_4040.tdp',
                    '19_04_2016___14_38_19_297451.tdp',
                    '1436802880_2015_07_13____18_54_40_1039.tdp',
                    '1438528706_2015_08_02____18_18_26_652553.tdp',
                    '19_04_2016___14_44_28_361096.tdp',
                    '1436802950_2015_07_13____18_55_50_93838.tdp',
                    '1438528886_2015_08_02____18_21_26_659944.tdp',
                    '19_04_2016___14_51_29_136573.tdp'
                ],
                '/__CURRENT_DISK_3': [
                    '1436802644_2015_07_13____18_50_44_999435.tdp',
                    '1438528396_2015_08_02____18_13_16_639775.tdp',
                    '19_04_2016___14_12_52_880396.tdp',
                    '1436802697_2015_07_13____18_51_37_1851.tdp',
                    '1438528548_2015_08_02____18_15_48_708.tdp',
                    '19_04_2016___14_34_56_833836.tdp',
                    '1436802827_2015_07_13____18_53_47_271619.tdp',
                    '1438528580_2015_08_02____18_16_20_506915.tdp',
                    '19_04_2016___14_39_58_838522.tdp',
                    '1436802941_2015_07_13____18_55_41_75.tdp',
                    '1438528766_2015_08_02____18_19_26_654998.tdp',
                    '19_04_2016___14_46_06_468164.tdp',
                    '1436803010_2015_07_13____18_56_50_38569.tdp',
                    '1438528792_2015_08_02____18_19_52_185.tdp',
                    '19_04_2016___14_57_55_963735.tdp',
                    '1436803185_2015_07_13____18_59_45_8.tdp',
                    '1438528946_2015_08_02____18_22_26_662411.tdp',
                    '19_04_2016___15_14_49_670465.tdp',
                    '1436803199_2015_07_13____18_59_59_410905.tdp',
                    '1438528975_2015_08_02____18_22_55_1738.tdp',
                    '19_04_2016___15_46_25_734752.tdp'
                ],
                'directoryName_2': [
                    '19_04_2016___14_09_28_139731.tdp',
                    '1436802636_2015_07_13____18_50_36_1337.tdp',
                    '1438528517_2015_08_02____18_15_17_95442.tdp',
                    '19_04_2016___14_33_28_750682.tdp',
                ],
                '/__CURRENT_DISK_4': [
                    '1438528580_2015_08_02____18_16_20_506915.tdp',
                    '19_04_2016___14_39_58_838522.tdp',
                ],
                'directoryName_N': []
            }
        }
    }
};*/