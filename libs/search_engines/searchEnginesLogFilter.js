/*
 * Поисковая машина для поиска информации по задачам на фильтрацию
 *
 * принимает следующие параметры
 * redis - ресурс соединения с БД
 * objSearchInformation - объект содержащий информацию по которой выполняется поиск
 *
 * Версия 0.1, дата релиза 26.05.2016
 * */

'use strict';

const async = require('async');

module.exports.search = function(redis, objSearchInformation, func) {
    if (isEmptyObject(objSearchInformation)) {
        /* если объект пуст */
        getAllTasks(redis, function(err, result) {
            if (err) return func(err);
            else func(null, result);
        });
    } else {
        /* если объект содержит свойства по которым необходимо выполнить поиск */
        getFindTasks(redis, objSearchInformation, function(err, result) {
            if (err) return func(err);
            else func(null, result);
        });
    }
};

//получить список всех задач
function getAllTasks(redis, func) {
    redis.zrange('task_filtering_index_all', [0, -1], function(err, list) {
        if (err) return func(err);
        else func(null, list.reverse());
    });
}

//выполнить поиск задач подходящих под заданные критерии
function getFindTasks(redis, objSearchInformation, callbackFunc) {
    checkObjSearchInformation(objSearchInformation, function(objResult) {
        //если все передоваемые данные были не корректны, выводим пустой объект
        if (isEmptyObject(objResult)) return callbackFunc(null, []);

        async.waterfall(
            [
                //поиск по временному диапазону
                function(callback) {
                    if (!objResult.hasOwnProperty('dateTimeStart') || !objResult.hasOwnProperty('dateTimeEnd')) return callback(null, []);

                    redis.zrangebyscore('task_filtering_index_all', [objResult.dateTimeStart, objResult.dateTimeEnd], function(err, array) {
                        if (err) callback(err);
                        else callback(null, array);
                    });
                },
                //поиск по выполненным задачам
                function(arrayDuplicate, callback) {
                    if (!objResult.hasOwnProperty('statusFilter')) return callback(null, arrayDuplicate);

                    let statusFilterIsTrue = objResult.statusFilter.some((item) => (item === 'complete'));
                    if (!statusFilterIsTrue) return callback(null, arrayDuplicate);

                    redis.lrange('task_filtering_index_processing_completed', [0, -1], function(err, arrayList) {
                        if (err) return callback(err);

                        let newArray = arrayDuplicate.concat(arrayList);
                        callback(null, getArrayDuplicate(newArray, 1));
                    });
                },
                //поиск содержимого в полной информации по задачам
                function(arrayDuplicate, callback) {
                    let userIsExist = objResult.hasOwnProperty('users');
                    let sourceIndexIsExist = objResult.hasOwnProperty('sourceIndex');
                    let statusFilterIsExist = objResult.hasOwnProperty('statusFilter');
                    let statusImportIsExist = objResult.hasOwnProperty('statusImport');

                    if (!userIsExist && !sourceIndexIsExist && !statusFilterIsExist && !statusImportIsExist) {
                        return callback(null, arrayDuplicate);
                    }

                    let isTrueStatusFilter = false;
                    if (objResult.hasOwnProperty('statusFilter')) {
                        isTrueStatusFilter = objResult.statusFilter.some((item) => (item === 'rejected' || item === 'execute' || item === 'stop'));
                    }

                    if (arrayDuplicate.length === 0 || isTrueStatusFilter) {
                        redis.zrange('task_filtering_index_all', [0, -1], function(err, array) {
                            if (err) callback(err);
                            getTaskIndex(redis, array, objResult, function(err, arrayTaskIndex) {
                                if (err) callback(err);
                                else callback(null, arrayTaskIndex);
                            });
                        });
                    } else {
                        getTaskIndex(redis, arrayDuplicate, objResult, function(err, arrayTaskIndex) {
                            if (err) callback(err);
                            else callback(null, arrayTaskIndex);
                        });
                    }
                }
            ],
            function(err, result) {
                if (err) callbackFunc(err);
                else callbackFunc(null, result.reverse());
            });
    });
}

//поиск идентификаторов задач по рассишенной информации (имя пользователя, цифровой идентификатор источника)
function getTaskIndex(redis, arrayTaskIndex, objNameSearch, func) {
    /*
                    !!! ВНИМАНИЕ !!!
      если заданны больше 2 параметров поиска, таких как
      имя пользователя, цифровой идентификатор источника
      и статус задачи то в результате поиска могут быть найдены
      дополнительные поля, так как получается дополнительное совпадение
      идентификаторов
    * */

    delete objNameSearch.dateTimeStart;
    delete objNameSearch.dateTimeEnd;

    let countSettings = getCountObjNameSearch(objNameSearch);

    var num = 0;
    var arrayResult = [];
    arrayTaskIndex.forEach(function(item) {
        redis.hmget('task_filtering_all_information:' + item,
            'jobStatus',
            'uploadFiles',
            'userLogin',
            'sourceId',
            function(err, result) {
                if (err) return func(err);

                for (var name in objNameSearch) {
                    for (let i = 0; i < objNameSearch[name].length; i++) {
                        for (let j = 0; j < result.length; j++) {
                            if (objNameSearch[name][i] === result[j]) arrayResult.push(item);
                        }
                    }
                }
                if (num === (arrayTaskIndex.length - 1)) {
                    return func(null, getArrayDuplicate(arrayResult, countSettings));
                }
                num++;
            });
    });
}

//получаем только повторяющиеся элементы массива
function getArrayDuplicate(array, countSettings) {
    var arrayTmp = [];
    var arrayResult = [];
    var objResult = {};

    for (let i = 0; i < array.length; i++) {
        for (let j = 0; j < array.length; j++) {
            if (array[i] === arrayTmp[j]) arrayResult.push(array[i]);
        }
        arrayTmp.push(array[i]);
    }

    arrayResult.forEach(function(item) {
        objResult[item] = '';
    });
    let newArray = Object.keys(objResult);
    if (countSettings > 1) return newArray;
    if (newArray.length === 0) return array;
    return newArray;
}

//считаем количество переданных параметров
function getCountObjNameSearch(obj) {
    var count = 0;
    for (var settingName in obj) {
        for (let i = 0; i < obj[settingName].length; i++) count++;
    }
    return count;
}

function checkObjSearchInformation(obj, callback) {
    let objResult = {};
    let arraySettingNames = ['dateTimeStart', 'dateTimeEnd', 'querySelector'];
    let objSettingName = {
        users: 'stringEnInt',
        dateTimeEnd: 'dateTime',
        sourceIndex: 'int',
        statusFilter: 'stringEn',
        statusImport: 'stringEnSpace',
        dateTimeStart: 'dateTime'
    };
    let objRegexpPattern = {
        int: new RegExp('^[0-9]+$'),
        stringEn: new RegExp('^[a-zA-Z]+$'),
        stringEnSpace: new RegExp('^[a-zA-Z\\s]+$'),
        stringEnInt: new RegExp('^[a-zA-Z0-9]+$'),
        dateTime: new RegExp('^(\\d{2}).(\\d{2}).(\\d{4})\\s(\\d{2}):(\\d{2})$')
    };

    //проверяем переданный объект на наличие всех свойств
    let isAllNotSettingNames = arraySettingNames.some((item) => (typeof obj[item] === 'undefined'));
    if (isAllNotSettingNames) return callback(objResult);

    //проверяем дату и время
    if (obj.dateTimeStart.length > 0 && obj.dateTimeEnd.length > 0) {
        if ((objRegexpPattern[objSettingName.dateTimeStart].test(obj.dateTimeStart)) && (objRegexpPattern[objSettingName['dateTimeEnd']].test(obj.dateTimeEnd))) {

            let shearchTimeStartTmp = obj.dateTimeStart.split(' ');
            let dateStartTmp = shearchTimeStartTmp[0].split('.');
            let timeStartTmp = shearchTimeStartTmp[1].split(':');

            let shearchTimeEndTmp = obj.dateTimeEnd.split(' ');
            let dateEndTmp = shearchTimeEndTmp[0].split('.');
            let timeEndTmp = shearchTimeEndTmp[1].split(':');

            objResult.dateTimeStart = (+new Date(dateStartTmp[2], (dateStartTmp[1] - 1), dateStartTmp[0], timeStartTmp[0], timeStartTmp[1], 0));
            objResult.dateTimeEnd = (+new Date(dateEndTmp[2], (dateEndTmp[1] - 1), dateEndTmp[0], timeEndTmp[0], timeEndTmp[1], 0));
        }
    }

    var querySelectorLength = obj.querySelector.length;
    if (querySelectorLength === 0) return callback(objResult);
    let count = 0;
    let objArrays = {
        users: [],
        sourceIndex: [],
        statusFilter: [],
        statusImport: []
    };

    obj.querySelector.forEach(function(item) {
        if (~item.indexOf(':')) {
            let arrayName = item.split(':');
            let pattern = objRegexpPattern[objSettingName[arrayName[0]]];

            if (pattern != undefined && pattern.test(arrayName[1])) {
                objArrays[arrayName[0]].push(arrayName[1]);
            }
        }
        if (count === (querySelectorLength - 1)) {
            if (objArrays.users.length > 0) objResult.users = objArrays.users;
            if (objArrays.sourceIndex.length > 0) objResult.sourceIndex = objArrays.sourceIndex;
            if (objArrays.statusFilter.length > 0) objResult.statusFilter = objArrays.statusFilter;
            if (objArrays.statusImport.length > 0) objResult.statusImport = objArrays.statusImport;

            return callback(objResult);
        }
        count++;
    });
}

//проверяем пустой ли объект
function isEmptyObject(obj) {
    return (Object.keys(obj).length === 0) ? true : false;
}