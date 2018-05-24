/*
* Поиск информации об ошибках получаемых с источников
*
* Версия 0.1, дата релиза 29.06.2016
* */

'use strict';

const async = require('async');

const errorsType = require('../../errors/errorsType');
const writeLogFile = require('../writeLogFile');
const objResultFindErrors = require('../../configure/objResultFindErrors');

/*
 * objReq.userId,
 * objReq.objSearchInformation,
 * objReq.isNewReq,
 * objReq.chunkNumber
 * */

module.exports = function (redis, objReq, func) {
    const MAX_COUNT_ERRORS = 18;

    if(objReq.isNewReq === true) {
        //получить информацию при поиске
        getStartInformation (function (err, result) {
            if(err){
                writeLogFile.writeLog('\tError: ' + err.toString());
                func({});
            } else {
                func(result);
            }
        });
    }
    if(objReq.isNewReq === false){
        //получить информацию при переходе по постраничным ссылкам
        getInformationForChoicePage (function (err, result) {
            if(err){
                writeLogFile.writeLog('\tError: ' + err.toString());
                func({});
            } else {
                func(result)
            }
        });
    }


    /* получить информацию при поиске */
    function getStartInformation (callFunc) {
        async.waterfall([
            //проверка параметров получаемых от пользователя
            function (callback) {
                //если все передоваемые данные были не корректны, выводим пустой объект
                if(isEmptyObject(objReq.objSearchInformation)) return callback(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить поиск, получены некорректные данные'));
                checkObjSearchInformation(objReq.objSearchInformation, function (objSearchInformation) {
                    callback(null, objSearchInformation);
                });
            },
            //поиск информации по заданным параметрам
            function (objSearchInformation, callback) {
                searchInformation(redis, objSearchInformation, function (err, arrayErrors) {
                    if(err) callback(err);
                    else callback(null, arrayErrors);
                });
            },
            //получить массив из частей идентификаторов задач
            function (arrayErrors, callback) {
                if(arrayErrors.length == 0) return callback(new errorsType.receivedEmptyArray('Принят пустой массив'));

                var arrayErrorsLength = arrayErrors.length;

                var countChunks = Math.ceil(arrayErrorsLength / MAX_COUNT_ERRORS);
                var newArray = [];
                for(let num = 0; num < countChunks; num++){
                    newArray[num] = arrayErrors.splice(0, MAX_COUNT_ERRORS);
                }

                callback(null, arrayErrorsLength, newArray, countChunks);
            },
            //записать части идентификаторов задач в объект objResultFindErrors
            function (countErrors, newArray, countChunks, callback) {
                objResultFindErrors[objReq.userId] = newArray;
                objResultFindErrors[objReq.userId].countErrors = countErrors;

                callback(null, objResultFindErrors[objReq.userId][0], countChunks);
            },
            //получить информацию по первой части идентификаторов задач
            function (chunkErrors, countChunks, callback) {
                callback(null, {
                    informationErrors: chunkErrors,
                    informationPaginate: {
                        maxCountElementsIndex: MAX_COUNT_ERRORS,
                        chunksNumber: 1,
                        countChunks: countChunks,
                        countElements: objResultFindErrors[objReq.userId].countErrors
                    }
                });
            }
        ], function (err, result) {
            if(err) {
                if(err.name == 'ReceivedEmptyArray') return callFunc(null, { informationErrors: [], informationPaginate: {} });
                return callFunc(err);
            }
            callFunc(null, result);
        });
    }

    /* получить информацию при переходе по постраничным ссылкам */
    function getInformationForChoicePage (callFunc) {
        if(objResultFindErrors[objReq.userId] === undefined || Array.isArray(objResultFindErrors[objReq.userId]) == false){
            return callFunc(new Error('userId is not defined'));
        }

        let patternTaskIndex = new RegExp('^[0-9]$');
        if(!patternTaskIndex.test(objReq.chunkNumber)) return callFunc(new Error('incorrect chunk number'));

        let nextChunkNumber = +objReq.chunkNumber;
        let newArray = objResultFindErrors[objReq.userId][nextChunkNumber - 1];

        callFunc(null, {
            informationErrors: newArray,
            informationPaginate: {
                maxCountElementsIndex: MAX_COUNT_ERRORS,
                chunksNumber: nextChunkNumber,
                countChunks: newArray.length,
                countElements: objResultFindErrors[objReq.userId].countErrors
            }
        });
    }
};

//поиск информации об ошибках по заданным пользователем параметрам
function searchInformation (redis, objSearch, callback) {
    var countSettings = 0;
    for(let i in objSearch) countSettings++;

    //проверяем количество парамеетров для поиска
    if(countSettings == 0) return callback(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить поиск, получены некорректные данные'));

    function ExecuteSearch (redis, objSearch) {
        this.redis = redis;
        this.objSearch = objSearch;
    }

    //поиск по источнику
    ExecuteSearch.prototype.oneParameters = function (func) {
        var self = this;
        if(self.objSearch.selectorSources === undefined) return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить поиск, получены некорректные данные'));

        this.redis.zrange('remote_host:errors:' + self.objSearch.selectorSources, [ 0, -1 ], function (err, errorsList) {
            if(err) return func(err);

            func(null, jsonModification(errorsList, self.objSearch.selectorSources));
        });
    };

    //поиск по времени
    ExecuteSearch.prototype.twoParameters = function (func) {
        var dateTimeIsExist = (this.objSearch.dateTimeStart == undefined || this.objSearch.dateTimeEnd == undefined);
        if(dateTimeIsExist) return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить поиск, получены некорректные данные'));

        var self = this;

        async.waterfall([
            //получаем список источников
            function (callback) {
                self.redis.lrange('remote_hosts_exist:id', [ 0, -1 ], function (err, sourcesList) {
                    if(err) callback(err);
                    else callback(null, sourcesList);
                });
            },
            //выполняем поиск по источникам указанного временного диапазона
            function (sourcesList, callback) {
                var arrayTmp = [];
                var count = 0;
                sourcesList.forEach(function (source) {
                    self.redis.zrangebyscore('remote_host:errors:' + source, [ self.objSearch.dateTimeStart, self.objSearch.dateTimeEnd ],function (err, errorsList) {
                        if(err) callback(err);
                        errorsList.forEach(function (item) {
                            var objErrorInformation = parseJSON(item);
                            objErrorInformation.sourceId = source;
                            var newStringJson = JSON.stringify(objErrorInformation);

                            arrayTmp.push({ index: objErrorInformation.dateTime, stringInformation: newStringJson });
                        });
                        if(count == sourcesList.length - 1){
                            arrayTmp.sort((a, b) => b.index - a.index);
                            let arrayResult = arrayTmp.map((item) => item.stringInformation);
                            callback(null, arrayResult);
                        }
                        count++;
                        });
                    });
                }
        ], function (err, result) {
            if(err) return (err);
            else func(null, result);
        });
    };

    //поиск по источнику и времени
    ExecuteSearch.prototype.threeParameters = function (func) {
        var self = this;

        var dateTimeIsExist = (this.objSearch.dateTimeStart == undefined || this.objSearch.dateTimeEnd == undefined);
        if((this.objSearch.selectorSources === undefined) || (dateTimeIsExist == true)) return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить поиск, получены некорректные данные'));

        this.redis.zrangebyscore('remote_host:errors:' + self.objSearch.selectorSources, [ this.objSearch.dateTimeStart, this.objSearch.dateTimeEnd ],function (err, errorsList) {
            if(err) func(err);
            else func(null, jsonModification(errorsList, self.objSearch.selectorSources));
        });
    };

    let executeSearch = new ExecuteSearch(redis, objSearch);

    //поиск только по источнику
    if(countSettings == 1) executeSearch.oneParameters(function (err, result) {
        if(err) callback(err);
        else callback(null, result);
    });
    //поиск только по дате
    else if(countSettings == 2) executeSearch.twoParameters(function (err, result) {
        if(err) callback(err);
        else callback(null, result);
    });
    //поиск по дате и по источнику
    else if (countSettings == 3) executeSearch.threeParameters(function (err, result) {
        if(err) callback(err);
        else callback(null, result);
    });
    else callback(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить поиск, неверный набор параметров'));
}

//проверить получаемые от пользователя данные
function checkObjSearchInformation (obj, callback) {
    var objResult = {};
    var arraySettingNames = [ 'dateTimeStart', 'dateTimeEnd', 'selectorSources' ];
    var objSettingName = {
        dateTimeStart : 'dateTime',
        dateTimeEnd : 'dateTime',
        selectorSources : 'int'
    };
    var objRegexpPattern = {
        int : new RegExp('^[0-9]+$'),
        dateTime : new RegExp('^(\\d{2}).(\\d{2}).(\\d{4})\\s(\\d{2}):(\\d{2})$')
    };

    //проверяем переданный объект на наличие всех свойств
    let isAllNotSettingNames = arraySettingNames.some((item) => (obj[item] == undefined));
    if(isAllNotSettingNames) return callback(objResult);

    //проверяем дату и время
    if(obj.dateTimeStart.length > 0 && obj.dateTimeEnd.length > 0){
        if((objRegexpPattern[objSettingName['dateTimeStart']].test(obj.dateTimeStart)) && (objRegexpPattern[objSettingName['dateTimeEnd']].test(obj.dateTimeEnd))){

            var shearchTimeStartTmp = obj.dateTimeStart.split(' ');
            var dateStartTmp = shearchTimeStartTmp[0].split('.');
            var timeStartTmp = shearchTimeStartTmp[1].split(':');

            var shearchTimeEndTmp = obj.dateTimeEnd.split(' ');
            var dateEndTmp = shearchTimeEndTmp[0].split('.');
            var timeEndTmp = shearchTimeEndTmp[1].split(':');

            objResult['dateTimeStart'] = (+new Date(dateStartTmp[2], (dateStartTmp[1] - 1), dateStartTmp[0], timeStartTmp[0], timeStartTmp[1], 0));
            objResult['dateTimeEnd'] = (+new Date(dateEndTmp[2], (dateEndTmp[1] - 1), dateEndTmp[0], timeEndTmp[0], timeEndTmp[1], 0));
        }
    }

    //проверяем идентификатор источника
    if(obj.selectorSources.length > 0){
        if(objRegexpPattern[objSettingName['selectorSources']].test(obj.selectorSources)) objResult['selectorSources'] = obj.selectorSources;
    }
    callback(objResult);
}

function jsonModification (arrayStringJson, indexSource) {
    var newArray = [];
    for(let i = 0; i < arrayStringJson.length; i++){
        var object = parseJSON(arrayStringJson[i]);
        object.sourceId = indexSource;
        newArray.push(JSON.stringify(object));
    }
    return newArray;
}

//парсинг строки в формате JSON
function parseJSON (stringJSON) {
    try {
        return JSON.parse(stringJSON);
    } catch (err) {
        writeLogFile.writeLog('\tError: ' + err.toString());
        return {};
    }
}

//проверяем пустой ли объект
function isEmptyObject (obj) {
    for(let i in obj) return false;
    return true;
}