/*
 * Управление источниками (удаленными хостами)
 *
 * - добавление
 * - редактирование
 * - удаление
 *
 * Версия 0.2, дата релиза 07.11.2016
 * */

'use strict';

const async = require('async');
const validator = require('validator');

const showNotify = require('../../libs/showNotify');
const errorsType = require('../../errors/errorsType');
const controllers = require('../../controllers');
const writeLogFile = require('../../libs/writeLogFile');
const globalObject = require('../../configure/globalObject');
const objWebsocket = require('../../configure/objWebsocket');

const redis = controllers.connectRedis();

//добавление или редактирование источника
exports.addEditSoutce = function(socketIo, obj) {
    const objSetting = obj.information;
    /* создание источника */
    if (obj.processingType === 'addSource') {
        async.series([
            //проверка корректности передоваемиых данных
            function(callback) {
                if (!checkInput(objSetting)) {
                    callback(new errorsType.receivedIncorrectData('Ошибка: невозможно добавить источник, получены некорректные данные'));
                } else {
                    callback(null, true);
                }
            },
            //проверка наличия источника с заданным идентификатором
            function(callback) {
                checkSourceExist(objSetting.hostId, function(trigger) {
                    if (trigger) {
                        callback(new errorsType.sourceIsExist(`Ошибка: источник с идентификатором №${objSetting.hostId} уже существует`));
                    } else {
                        callback(null, true);
                    }
                });
            },
            //добавление всей информаци об источнике
            function(callback) {
                redis.hmset('remote_host:settings:' + objSetting.hostId, {
                    'shortName': objSetting.shortNameHost,
                    'detailedDescription': objSetting.fullNameHost,
                    'ipaddress': objSetting.ipaddress,
                    'port': objSetting.port,
                    'dateCreate': +new Date(),
                    'dateChanges': +new Date(),
                    'dateLastConnected': 0,
                    'numberConnectionAttempts': 0,
                    'token': objSetting.token,
                    'maxCountProcessFiltering': parseInt(objSetting.countProcess),
                    'isAuthorization': true
                }, function(err) {
                    if (err) {
                        callback(new errorsType.undefinedServerError('Ошибка: невозможно добавить источник', err.toString()));
                    } else {
                        callback(null, true);
                    }
                });
            },
            //добавление идентификатора источника в списки 'remote_hosts_exist:id' и 'remote_host_connect:disconnect'
            function(callback) {
                redis.rpush('remote_hosts_exist:id', objSetting.hostId, (err) => {
                    if (err) return callback(new errorsType.undefinedServerError('Ошибка: невозможно добавить источник', err.toString()));
                });

                globalObject.setData('sources', objSetting.hostId, {
                    'connectionStatus': 'disconnect',
                    'shortName': objSetting.shortNameHost,
                    'detailedDescription': objSetting.fullNameHost,
                    'ipaddress': objSetting.ipaddress,
                    'port': objSetting.port,
                    'dateLastConnected': 0,
                    'numberConnectionAttempts': 0,
                    'token': objSetting.token,
                    'maxCountProcessFiltering': parseInt(objSetting.countProcess)
                });

                callback(null, true);
            }
        ], function(err, result) {
            if (err) {
                if (err.name === 'UndefinedServerError') {
                    showNotify(socketIo, 'danger', err.message);
                    writeLogFile.writeLog('\tError: ' + err.cause);
                    return;
                }

                return showNotify(socketIo, 'danger', err.message);
            }

            if (result.every((item) => item)) showNotify(socketIo, 'info', `Информация об источнике №<strong>${objSetting.hostId}</strong> успешно добавлена`);
        });
    }
    /* редактирование источника */
    if (obj.processingType === 'editSource') {
        async.series([
            //проверка корректности передаваемых данных
            function(callback) {
                if (!checkInput(objSetting)) {
                    callback(new errorsType.receivedIncorrectData('Ошибка: невозможно редактировать источник, получены некорректные данные'));
                } else {
                    callback(null, true);
                }
            },
            //проверяем выполняется ли фильтрация на данном источнике
            function(callback) {
                let listTaskFilter = Object.keys(globalObject.getDataTaskFilter());

                if (listTaskFilter.length === 0) return callback(null, true);

                let num = 0;
                let arrayTmp = [];
                listTaskFilter.forEach((item) => {
                    redis.hget('task_filtering_all_information:' + item, 'sourceId', (err, id) => {
                        if (err) {
                            return callback(new errorsType.undefinedServerError('Ошибка: невозможно редактировать источник', err.toString()));
                        }

                        if (id === objSetting.hostId) arrayTmp.push(false);
                        else arrayTmp.push(true);

                        if (num === (listTaskFilter.length - 1)) {
                            if (!arrayTmp.some((item) => item)) callback(new errorsType.sourceIsBusy(`Ошибка: невозможно редактировать источник №<strong>${objSetting.hostId}</strong>, идет процесс фильтрации`));
                            else callback(null, true);
                        }
                        num++;
                    });
                });
            },
            //закрываем соединение и удаляем линк из объекта objWebsocket
            function(callback) {
                let webSocketSourceId = objWebsocket['remote_host:' + objSetting.hostId];
                if (typeof webSocketSourceId !== 'undefined') {
                    webSocketSourceId.close();
                    delete objWebsocket['remote_host:' + objSetting.hostId];
                }
                callback(null, true);
            },
            //добавление всей информаци об источнике
            function(callback) {
                globalObject.setData('sources', objSetting.hostId, {
                    'connectionStatus': 'disconnect',
                    'shortName': objSetting.shortNameHost,
                    'detailedDescription': objSetting.fullNameHost,
                    'ipaddress': objSetting.ipaddress,
                    'port': objSetting.port,
                    'dateLastConnected': 0,
                    'numberConnectionAttempts': 0,
                    'token': objSetting.token,
                    'maxCountProcessFiltering': parseInt(objSetting.countProcess)
                });

                redis.hmset('remote_host:settings:' + objSetting.hostId, {
                    'shortName': objSetting.shortNameHost,
                    'detailedDescription': objSetting.fullNameHost,
                    'ipaddress': objSetting.ipaddress,
                    'port': objSetting.port,
                    'dateChanges': +new Date(),
                    'token': objSetting.token,
                    'maxCountProcessFiltering': objSetting.countProcess
                }, (err) => {
                    if (err) callback(new errorsType.undefinedServerError('Ошибка: невозможно редактировать источник', err.toString()));
                    else callback(null, true);
                });
            }
        ], function(err, result) {
            if (err) {
                if (err.name === 'UndefinedServerError') {
                    showNotify(socketIo, 'danger', err.message);
                    writeLogFile.writeLog('\tError: ' + err.cause);
                } else {
                    showNotify(socketIo, 'danger', err.message);
                }
            }
            if (result.every((item) => item)) showNotify(socketIo, 'info', 'Информация об источнике №<strong>' + objSetting.hostId + '</strong> успешно изменена');
        });
    }

    //проверка получаемых от пользователя данных
    function checkInput(obj) {
        let objSettingName = {
            hostId: 'int',
            shortNameHost: 'stringEnInt',
            fullNameHost: 'stringRuEnInt',
            ipaddress: 'ipaddressString',
            port: 'int',
            countProcess: 'int',
            token: 'stringToken'
        };
        let objRegexpPattern = {
            int: new RegExp('^[0-9]{1,7}$'),
            stringEnInt: new RegExp('^[a-zA-Z0-9_\\-\\s]{3,15}$'),
            stringToken: new RegExp('^[a-zA-Z0-9\\s]+$'),
            stringRuEnInt: new RegExp('^[a-zA-Zа-яА-Яё0-9_\\-\\s\\.,]+$'),
            ipaddressString: new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$')
        };

        let array = [];
        for (let key in objSettingName) {
            let pattern = objRegexpPattern[objSettingName[key]];
            let checkIsTrue = false;
            if ((typeof obj[key] !== 'undefined') && (pattern.test(obj[key]))) {
                //проверка порта
                if (key === 'port') {
                    checkIsTrue = ((0 <= obj[key]) && (obj[key] < 65536)) ? true : false;
                } else {
                    checkIsTrue = true;
                }
            }
            array.push(checkIsTrue);
        }

        return array.every((item) => item);
    }

    //проверить наличие добавляемого источника
    function checkSourceExist(hostId, callbackFun) {
        redis.lrange('remote_hosts_exist:id', [0, -1], (err, data) => {
            if (err) {
                showNotify(socketIo, 'danger', 'Ошибка: невозможно добавить источник');
                writeLogFile.writeLog('\tError: ' + err.toString());
                return;
            }
            callbackFun(data.some((item) => (item === hostId)));
        });
    }
};

//удаление информации об источнике
exports.deleteSource = function(socketIo, obj) {
    if (!validator.isNumeric(obj.sourceId)) {
        showNotify(socketIo, 'danger', 'Ошибка: неверный идентификатор хоста');
        writeLogFile.writeLog('\tError: invalid host ID');
        return;
    }

    async.series([
        //проверяем выполняется ли фильтрация на данном источнике
        function(callback) {
            let listTaskFilter = Object.keys(globalObject.getDataTaskFilter());

            if (listTaskFilter.length === 0) return callback(null, true);

            let isExist = false;
            let processingTasks = globalObject.getData('processingTasks');
            listTaskFilter.forEach((taskIndex) => {
                if (processingTasks[taskIndex].sourceId === obj.sourceId) isExist = true;
            });

            if (!isExist) callback(null, true);
            else callback(new errorsType.sourceIsBusy(`Ошибка: невозможно удалить источник №<strong>${obj.sourceId}</strong>, идет процесс фильтрации`));

            /*async.each(listTaskFilter, (item, callbackEach) => {
                redis.hget('task_filtering_all_information:' + item, 'sourceId', (err, id) => {
                    if (err) {
                        callbackEach(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                    } else if (id === obj.sourceId) {
                        callbackEach(new errorsType.sourceIsBusy(`Ошибка: невозможно удалить источник №<strong>${obj.sourceId}</strong>, идет процесс фильтрации`));
                    } else {
                        callbackEach(null);
                    }
                });
            }, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });*/
        },
        //проверяем выполняется ли загрузка файлов с данного источника (таблица task_implementation_downloading_files)
        function(callback) {
            redis.lrange('task_implementation_downloading_files', [0, -1], (err, arrayTask) => {
                if (err) return callback(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                if (arrayTask.length === 0) return callback(null, true);

                for (let i = 0; i < arrayTask.length; i++) {
                    if (!(~arrayTask[i].indexOf(':'))) return callback(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                    if (arrayTask[i].split(':')[0] === obj.sourceId) return callback(new errorsType.sourceIsBusy(`Ошибка: невозможно удалить источник №<strong>${obj.sourceId}</strong>, задача на загрузку файлов с данного источника уже выполняется`));
                }
                callback(null, true);
            });
        },
        //проверяем находится ли данный источник в очереди на выгрузку файлов (таблица task_turn_downloading_files)
        function(callback) {
            redis.lrange('task_turn_downloading_files', [0, -1], (err, arrayTask) => {
                if (err) callback(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                if (arrayTask.length === 0) return callback(null, true);

                for (let i = 0; i < arrayTask.length; i++) {
                    if (!(~arrayTask[i].indexOf(':'))) return callback(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                    if (arrayTask[i].split(':')[0] === obj.sourceId) return callback(new errorsType.sourceIsBusy(`Ошибка: невозможно удалить источник №<strong>${obj.sourceId}</strong>, задача на загрузку файлов с данного источника находится в очереди`));
                }
                callback(null, true);
            });
        },
        //закрываем соединение и удаляем линк из объекта objWebsocket
        function(callback) {
            let webSocketSourceId = objWebsocket['remote_host:' + obj.sourceId];

            if (typeof webSocketSourceId !== 'undefined') {
                webSocketSourceId.close();
                delete objWebsocket['remote_host:' + obj.sourceId];
            }
            callback(null, true);
        },
        function(callback) {
            if (!obj.hasOwnProperty('sourceId')) return callback(null, true);

            globalObject.deleteData('sources', obj.sourceId);

            callback(null, true);
        },
        function(callback) {
            if (!obj.hasOwnProperty('sourceId')) return callback(null, true);

            redis.lrem('remote_hosts_exist:id', 0, obj.sourceId, (err) => {
                if (err) callback(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                else callback(null, true);
            });
        },
        function(callback) {
            redis.del('remote_host:settings:' + obj.sourceId, (err) => {
                if (err) callback(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                else callback(null, true);
            });
        },
        function(callback) {
            redis.del('remote_host:information:' + obj.sourceId, (err) => {
                if (err) callback(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                else callback(null, true);
            });
        }
    ], function(err) {
        if (err) {
            if (err.name === 'UndefinedServerError') {
                writeLogFile.writeLog('\tError: ' + err.cause);
                return showNotify(socketIo, 'danger', err.message);
            } else {
                return showNotify(socketIo, 'danger', err.message);
            }
        }

        async.waterfall([
            function(callback) {
                redis.keys('user_authntication:*', (err, users) => {
                    if (err) callback(err);
                    else callback(null, users);
                });
            },
            function(arrayUsers, callback) {
                async.eachOf(arrayUsers, (name, key, callbackForEachOf) => {
                    redis.hget(name, 'settings', (err, object) => {
                        if (err) {
                            return callbackForEachOf(new errorsType.undefinedServerError('Ошибка: невозможно удалить источник', err.toString()));
                        }

                        try {
                            let objSettings = JSON.parse(object);
                            if (objSettings.hasOwnProperty('remoteHosts') && objSettings.remoteHosts.length > 0) {
                                for (let num = 0; num < objSettings.remoteHosts.length; num++) {
                                    if (obj.sourceId === objSettings.remoteHosts[num]) {
                                        objSettings.remoteHosts.splice(num, 1);
                                        let newObjSettings = objSettings;

                                        redis.hset(name, 'settings', (JSON.stringify(newObjSettings)), (err) => {
                                            if (err) return callbackForEachOf(err);
                                        });
                                    }
                                }
                            }
                        } catch (error) {
                            return callbackForEachOf(error);
                        }
                        callbackForEachOf();
                    });
                }, function(err) {
                    if (err) callback(err);
                    else callback(null, true);
                });
            }
        ], function(err) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                showNotify(socketIo, 'danger', `Ошибка: невозможно удалить источник №<strong>${obj.sourceId}</storng>`);
            } else {
                showNotify(socketIo, 'info', `Информация об источнике №<strong>${obj.sourceId}</strong> успешно удалена`);
            }
        });
    });
};

//вывод подробной информации о выбранном источнике
exports.readFullInformationSource = function(socketIo, obj) {
    getInformationSource(socketIo, obj, (objRemoteHost) => {
        socketIo.emit('show source information', { sourceInformation: JSON.stringify({ processingType: 'showInformationSource', information: objRemoteHost }) });
    });
};

//вывод краткой информации о выбранном источнике
exports.readShortInformationSource = function(socketIo, obj) {
    getInformationSource(socketIo, obj, (objRemoteHost) => {
        let arrayDelete = ['date_create', 'date_changes', 'date_last_connected', 'number_connection_attempts'];
        arrayDelete.forEach((item) => {
            delete objRemoteHost[item];
        });

        socketIo.emit('show source information edit', { sourceInformation: JSON.stringify({ processingType: 'showInformationSource', information: objRemoteHost }) });
    });
};

//информация о выбранном источнике
function getInformationSource(socketIo, obj, callback) {
    if (!(new RegExp('^[0-9]{1,}$')).test(obj.sourceId)) {
        writeLogFile.writeLog('\tError: invalid host ID');
        showNotify(socketIo, 'danger', 'Ошибка: неверный идентификатор хоста');
        return;
    }

    redis.hmget('remote_host:settings:' + obj.sourceId,
        'shortName',
        'detailedDescription',
        'ipaddress',
        'port',
        'dateCreate',
        'dateChanges',
        'dateLastConnected',
        'numberConnectionAttempts',
        'token',
        'maxCountProcessFiltering',
        'isAuthorization',
        (err, arrData) => {
            if (err) {
                showNotify(socketIo, 'danger', `Ошибка: хост №${obj.sourceId} не найден`);
                writeLogFile.writeLog('\tError: ' + err.toString());
            } else {
                if (arrData[0] === null) {
                    return showNotify(socketIo, 'danger', `Ошибка: хост №${obj.sourceId} не найден`);
                }

                callback({
                    'id': obj.sourceId,
                    'short_name': arrData[0],
                    'detailed_description': arrData[1],
                    'ip_address': arrData[2],
                    'port': arrData[3],
                    'date_create': arrData[4],
                    'date_changes': arrData[5],
                    'date_last_connected': arrData[6],
                    'number_connection_attempts': arrData[7],
                    'token': arrData[8],
                    'max_count_process_filtering': arrData[9],
                    'isAuthorization': arrData[10]
                });
            }
        });
}