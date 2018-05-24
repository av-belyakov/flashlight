/*
 * Поисковая машина для поиска информации по загруженным файлам
 *
 * принимает следующие параметры
 * redis - ресурс соединения с БД
 * objReq - объект содержащий всю информацию необходимую для поиска
 *
 * Версия 0.1, дата релиза 16,.12.2016
 * */

'use strict';

const async = require('async');

const errorsType = require('../../errors/errorsType');
const networkCalculator = require('../networkCalculator');

module.exports.search = function(redis, objReq, func) {
    checkObjSearchInformation(objReq.objSearchInformation, function(err, objResult) {
        if (err) return func(err);

        if (isEmptyObject(objResult)) {
            func(new errorsType.receivedIncorrectData('Ошибка: поиск невозможен, получены некорректные данные'));
        } else {
            async.waterfall([
                function(callback) {
                    searchTaskIndexDateTime(redis, objResult, objReq.objSearchInformation.checkbox, function(err, result) {
                        if (err) return callback(err);
                        else callback(null, result);
                    });
                },
                function(arrayTaskIndexDateTime, callback) {
                    if (typeof objResult.selectorInputFieldIpAddress === 'undefined') {
                        callback(null, arrayTaskIndexDateTime);
                    } else {
                        searchTaskIndexIpOrNetwork(redis, objResult, objReq.objSearchInformation.checkbox.checkboxIpOrNetwork, function(err, arrayTaskIndexIpOrNetwork) {
                            if (err) return callback(err);

                            if (typeof objResult.dateTimeStart === 'undefined' || typeof objResult.dateTimeEnd === 'undefined') return callback(null, arrayTaskIndexIpOrNetwork);

                            let arrayResult = arrayTaskIndexDateTime.concat(arrayTaskIndexIpOrNetwork);
                            arrayResult.sort();

                            //получаем только повторяющиеся значения
                            let a, b;
                            callback(null, arrayResult.filter((item) => {
                                if ((item === a) && (item !== b)) {
                                    b = item;
                                    return true;
                                } else {
                                    a = item;
                                    return false;
                                }
                            }));
                        });
                    }
                },
                function(arrayFinal, callback) {
                    searchQuerySelector(redis, arrayFinal, objResult, function(err, result) {
                        if (err) callback(err);
                        else callback(null, result);
                    });
                }
            ], function(err, arrayTaskIndex) {
                if (err) return func(err);

                async.filter(arrayTaskIndex, function(id, callbackFilter) {
                    redis.hget('task_filtering_all_information:' + id, 'countFilesLoaded',
                        function(err, countFilesLoaded) {
                            callbackFilter((+countFilesLoaded > 0));
                        });
                }, function(arrayFinalTaskIndex) {
                    func(null, arrayFinalTaskIndex);
                });
            });
        }
    });
};

//поиск идентификаторов задач по дате
function searchTaskIndexDateTime(redis, objResult, objCheckbox, func) {
    if ((!objResult.hasOwnProperty('dateTimeStart')) || (!objResult.hasOwnProperty('dateTimeEnd'))) {
        return func(null, []);
    }

    //формируем массив псевдоиндексов
    let arrayTaskAction = [];
    for (let name in objCheckbox) {
        if (name === 'checkboxIpOrNetwork') continue;
        if (objCheckbox[name] === true) arrayTaskAction.push(name);
    }

    let objTableName = {
        'checkboxEvent': 'index_filter_settings_date_time',
        'checkboxFiltering': 'task_filtering_index_all',
        'checkboxUploaded': 'task_uploaded_index_all'
    };

    if (arrayTaskAction.length === 0) return func(null, []);

    async.map(arrayTaskAction, function(tableName, callbackMap) {
        redis.zrangebyscore(objTableName[tableName], [objResult.dateTimeStart, objResult.dateTimeEnd], function(err, arrayHash) {
            if (err) return callbackMap(err);
            if (arrayHash.length === 0) return callbackMap(null, []);

            if (objTableName[tableName] === 'index_filter_settings_date_time') {
                let arrayIndexTaskFilterDateTime = [];
                try {
                    for (let num = 0; num < arrayHash.length; num++) {
                        if (~arrayHash[num].indexOf(' ')) {
                            let arrayTmp = arrayHash[num].split(' ');
                            for (let i = 0; i < arrayTmp.length; i++) {
                                arrayIndexTaskFilterDateTime.push(arrayTmp[i].split(':')[1]);
                            }
                        } else {
                            arrayIndexTaskFilterDateTime.push(arrayHash[num].split(':')[1]);
                        }
                    }
                    return callbackMap(null, arrayIndexTaskFilterDateTime);
                } catch (err) {
                    return callbackMap(err);
                }
            } else {
                callbackMap(null, arrayHash);
            }
        });
    }, function(err, arrayTaskIndex) {
        if (err) return func(err);

        let arrayResult = [];
        for (let num = 0; num < arrayTaskIndex.length; num++) {
            if (arrayTaskIndex[num].length === 0) return func(null, []);

            for (let i = 0; i < arrayTaskIndex[num].length; i++) {
                arrayResult.push(arrayTaskIndex[num][i]);
            }
        }
        arrayResult.sort();

        //если поиск осуществлялся только по одному параметру
        if (arrayTaskAction.length === 1) return func(null, arrayResult);

        //получаем только повторяющиеся значения
        let a, b;
        func(null, arrayResult.filter((item) => {
            if ((item === a) && (item !== b)) {
                b = item;
                return true;
            } else {
                a = item;
                return false;
            }
        }));
    });
}

//поиск по ip адресам в ipaddress или network
function searchTaskIndexIpOrNetwork(redis, objResult, checkboxIpOrNetwork, func) {
    if (typeof objResult.selectorInputFieldIpAddress === 'undefined') return func(null, []);

    if (checkboxIpOrNetwork) {
        searchNetwork(function(err, getArrayResult) {
            if (err) func(err);
            else func(null, getArrayResult);
        });
    } else {
        searchIpAddress(function(err, getArrayResult) {
            if (err) func(err);
            else func(null, getArrayResult);
        });
    }

    //поиск ip адреса в ip адресах
    function searchIpAddress(callback) {
        async.map(objResult.selectorInputFieldIpAddress, function(ipaddress, callbackMap) {
            let ipInteger = networkCalculator.IPv4_dotquadA_to_intA(ipaddress);

            redis.zrangebyscore('index_filter_settings_src_ip', [ipInteger, ipInteger], function(err, arrayHash) {
                if (err) callbackMap(err);
                else callbackMap(null, arrayHash);
            });
        }, function(err, arrayResult) {
            if (err) return callback(err);

            let arrayFinal = [];
            try {
                for (let num = 0; num < arrayResult.length; num++) {
                    if (arrayResult[num].length === 0) continue;

                    if (~arrayResult[num][0].indexOf(' ')) {
                        let arrayTmp = arrayResult[num][0].split(' ');
                        for (let i = 0; i < arrayTmp.length; i++) {
                            arrayFinal.push(arrayTmp[i].split(':')[1]);
                        }
                    } else {
                        arrayFinal.push(arrayResult[num][0].split(':')[1]);
                    }
                }
                callback(null, arrayFinal);
            } catch (err) {
                callback(err);
            }
        });
    }

    //поиск ip адреса в подсетях
    function searchNetwork(callback) {
        redis.zrange('index_filter_settings_networks', [0, -1, 'WITHSCORES'], function(err, arrayHash) {
            if (err) return callback(err);
            if (arrayHash.length === 0) return callback(null, []);

            let counter = 0;
            let arrayScores = arrayHash.filter((item) => {
                counter++;
                return (~((counter / 2).toString().indexOf('.'))) ? false : true;
            });

            let objIpAddressMin = {};
            let objIpAddressMax = {};

            for (let i = 0; i < arrayScores.length; i++) {
                for (let a = 0; a < objResult.selectorInputFieldIpAddress.length; a++) {
                    let ipInteger = networkCalculator.IPv4_dotquadA_to_intA(objResult.selectorInputFieldIpAddress[a]);
                    if (+arrayScores[i] < ipInteger) {
                        objIpAddressMin[ipInteger] = +arrayScores[i];
                    } else {
                        if (typeof objIpAddressMax[ipInteger] === 'undefined') objIpAddressMax[ipInteger] = +arrayScores[i];
                    }
                }
            }

            let objAddressFinal = {};
            for (let key in objIpAddressMin) {
                if (typeof objIpAddressMax[key] !== 'undefined') {
                    objAddressFinal[key] = [objIpAddressMin[key], objIpAddressMax[key]];
                }
            }

            async.map(objAddressFinal, function(ipaddress, callbackMap) {
                redis.zrangebyscore('index_filter_settings_networks', [+ipaddress[0], +ipaddress[1]], function(err, arrayIndex) {
                    if (err) return callbackMap(err);
                    if (arrayIndex.length === 0) return callbackMap(null, []);

                    let array = [];
                    for (let i = 0; i < arrayIndex.length; i++) {
                        try {
                            if (!(~arrayIndex[i].indexOf(' '))) {
                                array.push(arrayIndex[i].split(':')[1]);
                            } else {
                                let arrayTmp = arrayIndex[i].split(' ');
                                array.push(arrayTmp.map((item) => {
                                    return item.split(':')[1];
                                }));
                            }
                        } catch (err) {
                            return callbackMap(err);
                        }
                    }
                    callbackMap(null, array);
                });
            }, function(err, arrayResult) {
                if (err) return callback(err);

                let arrayTaskIndex = [];
                for (let key in arrayResult) {
                    for (let i = 0; i < arrayResult[key].length; i++) {
                        arrayTaskIndex.push(arrayResult[key][i]);
                    }
                }

                arrayTaskIndex.sort();
                let taskIndexTmp = '';
                callback(null, arrayTaskIndex.filter((item) => {
                    if (item === taskIndexTmp) {
                        return false;
                    } else {
                        taskIndexTmp = item;
                        return true;
                    }
                }));
            });
        });
    }
}

//поиск по логинам пользователей и идентификаторам источников
function searchQuerySelector(redis, arrayTaskIndex, querySelector, func) {
    if (Array.isArray(arrayTaskIndex) === false) {
        return func(new errorsType.receivedIncorrectData('Ошибка: переменная arrayTaskIndex не является массивом'));
    }

    if ((arrayTaskIndex.length === 0) && (typeof querySelector.querySelectorSourceIdUserName === 'undefined')) {
        func(null, []);
    } else if (arrayTaskIndex.length === 0) {
        redis.zrange('task_filtering_index_all', [0, -1], function(err, arrayIndex) {
            if (err) return func(err);

            searchProcessing(arrayIndex, function(err, arrayResult) {
                if (err) func(err);
                else func(null, arrayResult);
            });
        });
    } else {
        searchProcessing(arrayTaskIndex, function(err, arrayResult) {
            if (err) func(err);
            else func(null, arrayResult);
        });
    }

    function searchProcessing(arrayTask, callbackSearch) {
        let querySelectorName = {
            'actionType': [],
            'users': [],
            'sourceIndex': []
        };

        let dateIsNotExist = ((typeof querySelector.dateTimeStart === 'undefined') || (typeof querySelector.dateTimeEnd === 'undefined'));

        if (typeof querySelector.querySelectorSourceIdUserName === 'undefined') {
            return (dateIsNotExist && (typeof querySelector.selectorInputFieldIpAddress === 'undefined')) ? callbackSearch(null, []) : callbackSearch(null, arrayTask);
        }

        for (let i = 0; i < querySelector.querySelectorSourceIdUserName.length; i++) {
            if (!(~querySelector.querySelectorSourceIdUserName[i].indexOf(':'))) continue;

            let [selector, value] = querySelector.querySelectorSourceIdUserName[i].split(':');
            querySelectorName[selector].push(value);
        }

        if ((querySelectorName.users.length === 0) || (querySelectorName.actionType.length === 0)) {
            delete querySelectorName.users;
            delete querySelectorName.actionType;

            if (querySelectorName.sourceIndex.length === 0) {
                callbackSearch(new errorsType.receivedIncorrectData('Ошибка: поиск невозможен, получены некорректные данные'));
            }
        }
        if (querySelectorName.sourceIndex.length === 0) {
            delete querySelectorName.sourceIndex;
        }

        if ((Object.keys(querySelectorName).length) === 0) {
            return (dateIsNotExist) ? callbackSearch(null, []) : callbackSearch(null, arrayTask);
        }

        let objActionType = {
            'filtering': ['userLogin', 1],
            'downloading': ['userLoginImport', 2],
            'changeStatus': ['loginNameLookedThisTask', 3]
        };

        async.map(arrayTask, function(taskIndex, callbackFilter) {
            redis.hmget('task_filtering_all_information:' + taskIndex,
                'sourceId',
                'userLogin',
                'userLoginImport',
                'loginNameLookedThisTask',
                function(err, result) {
                    if (err) return callbackFilter(err);

                    let objCheckedUserName = {};
                    let arrayCheckedSourceId = [];

                    //поиск по идентификатору источника
                    if (typeof querySelectorName.sourceIndex !== 'undefined') {
                        for (let i = 0; i < querySelectorName.sourceIndex.length; i++) {
                            arrayCheckedSourceId.push(querySelectorName.sourceIndex[i] === result[0]);
                        }
                    }

                    //поиск по имени пользователя и его действию
                    if (typeof querySelectorName.users !== 'undefined') {
                        for (let i = 0; i < querySelectorName.users.length; i++) {
                            objCheckedUserName[querySelectorName.users[i]] = [];
                            for (let y = 0; y < querySelectorName.actionType.length; y++) {
                                let num = objActionType[querySelectorName.actionType[y]][1];
                                let tmpStatus = (querySelectorName.users[i] === result[num]) ? true : false;
                                objCheckedUserName[querySelectorName.users[i]].push(tmpStatus);
                            }
                        }
                    }
                    let checkSourceId = arrayCheckedSourceId.some((item) => item);

                    let checkUserName = false;
                    for (let userName in objCheckedUserName) {
                        if (objCheckedUserName[userName].every((item) => item) === true) {
                            checkUserName = true;
                            break;
                        }

                    }

                    if (typeof querySelectorName.sourceIndex !== 'undefined' && typeof querySelectorName.users === 'undefined') {
                        if (checkSourceId) callbackFilter(null, taskIndex);
                        else callbackFilter(null, '');
                    } else if (typeof querySelectorName.sourceIndex === 'undefined' && typeof querySelectorName.users !== 'undefined') {
                        if (checkUserName) callbackFilter(null, taskIndex);
                        else callbackFilter(null, '');
                    } else if (typeof querySelectorName.sourceIndex !== 'undefined' && typeof querySelectorName.users !== 'undefined') {
                        if ((checkSourceId === true) && (checkUserName === true)) callbackFilter(null, taskIndex);
                        else callbackFilter(null, '');
                    } else {
                        callbackFilter(null, '');
                    }
                });
        }, function(err, arrayResultTaskIndex) {
            if (err) return callbackSearch(err);

            let arrayFinalTaskIndex = [];
            for (let i = 0; i < arrayResultTaskIndex.length; i++) {
                if (arrayResultTaskIndex[i] === '') continue;
                else arrayFinalTaskIndex.push(arrayResultTaskIndex[i]);
            }

            arrayFinalTaskIndex.reverse();

            callbackSearch(null, arrayFinalTaskIndex);
        });
    }
}

//валидация входных параметров
function checkObjSearchInformation(obj, callback) {
    let objResult = {};
    let objRegexpPattern = {
        'dateTimeStart': new RegExp('^(\\d{2}).(\\d{2}).(\\d{4})\\s(\\d{2}):(\\d{2})$'),
        'dateTimeEnd': new RegExp('^(\\d{2}).(\\d{2}).(\\d{4})\\s(\\d{2}):(\\d{2})$'),
        'querySelectorSourceIdUserName': new RegExp('^[a-zA-Z]{1,}[:][a-zA-Z0-9]+$'),
        'querySelectorInputFieldIpAddress': new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$')
    };

    //проверяем переданный объект на наличие всех свойств
    let arraySettingNames = Object.keys(objRegexpPattern);
    let isAllNotSettingNames = arraySettingNames.every((item) => (obj[item] === undefined));
    if (isAllNotSettingNames) return callback(new errorsType.receivedIncorrectData('Ошибка: поиск невозможен, получены некорректные данные'));

    //проверяем дату и время
    if (obj.dateTimeStart.length > 0 && obj.dateTimeEnd.length > 0) {
        if ((objRegexpPattern.dateTimeStart.test(obj.dateTimeStart)) && (objRegexpPattern.dateTimeEnd.test(obj.dateTimeEnd))) {
            let arrayCheckbox = [];
            for (let name in obj.checkbox) {
                if (name === 'checkboxIpOrNetwork') continue;
                arrayCheckbox.push(obj.checkbox[name]);
            }

            if (arrayCheckbox.some((item) => item)) {
                let searchTimeStartTmp = obj.dateTimeStart.split(' ');
                let dateStartTmp = searchTimeStartTmp[0].split('.');
                let timeStartTmp = searchTimeStartTmp[1].split(':');

                let searchTimeEndTmp = obj.dateTimeEnd.split(' ');
                let dateEndTmp = searchTimeEndTmp[0].split('.');
                let timeEndTmp = searchTimeEndTmp[1].split(':');

                objResult.dateTimeStart = (+new Date(dateStartTmp[2], (dateStartTmp[1] - 1), dateStartTmp[0], timeStartTmp[0], timeStartTmp[1], 0));
                objResult.dateTimeEnd = (+new Date(dateEndTmp[2], (dateEndTmp[1] - 1), dateEndTmp[0], timeEndTmp[0], timeEndTmp[1], 0));
            }
        }
    }

    //проверяем идентификаторы источников или логин пользователей
    let selectorSourceIdUserName = obj.querySelectorSourceIdUserName.filter((item) => (objRegexpPattern.querySelectorSourceIdUserName.test(item)));

    //проверяем ip-адреса
    let selectorInputFieldIpAddress = obj.querySelectorInputFieldIpAddress.filter((item) => (objRegexpPattern.querySelectorInputFieldIpAddress.test(item)));

    if (selectorSourceIdUserName.length !== 0) objResult.querySelectorSourceIdUserName = selectorSourceIdUserName;
    if (selectorInputFieldIpAddress.length !== 0) objResult.selectorInputFieldIpAddress = selectorInputFieldIpAddress;

    callback(null, objResult);
}

function isEmptyObject(obj) {
    return (Object.keys(obj).length === 0) ? true : false;
}