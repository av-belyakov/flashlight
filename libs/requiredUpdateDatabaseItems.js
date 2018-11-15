/**
 * вспомогательный модуль для внесения изменений в БД выполняемых с целью 
 * обеспечения совместимости со старыми версиями приложения
 * 
 * @param {*} redis - дискриптор соединения с БД
 * 
 * Версия 0.1, дата релиза 05.02.2018
 */

'use strict';

const async = require('async');

const writeLogFile = require('./writeLogFile');

module.exports = function(redis) {
    let objInformationChange = {
        'add': {
            'all': {
                'userGroup': addNewElementUserGroup
            },
            'selected': {}
        },
        'delete': {},
        'replace': {}
    };

    let arrayChange = [{
        elementParent: 'none',
        elementChild: 'none',
        data: {
            management_task: {
                name: 'Управление задачами',
                data: {
                    'read': [false, 'просмотр'],
                    'status_change': [false, 'изменение статуса'],
                    'delete': [false, 'удаление'],
                    'resumption': [false, 'возобновление']
                }
            }
        }
    }, {
        elementParent: 'menu',
        elementChild: 'data',
        data: {
            settings_task: [false, 'управление задачами']
        }
    }];

    //добавляем информацию в 'user_group:*'
    async.forEachOf(arrayChange, (objChange, key, callbackForEachOfOne) => {
        objInformationChange.add.all.userGroup(objChange, redis, (err, result) => {
            if (err) callbackForEachOfOne(err);
            else callbackForEachOfOne(null, result);
        });
    }, function(err) {
        if (err) writeLogFile.writeLog(`\tError: ${err.toString()}`);
    });
};

function changeElementToObject(obj, strSeach, strReplace) {
    let stringTmp = JSON.stringify(obj);
    let newStringTmp = stringTmp.replace(new RegExp(strSeach, 'g'), strReplace);

    return JSON.parse(newStringTmp);
}

//добавление информации в хеш таблицу user_group
function addNewElementUserGroup(objAddElement, redis, func) {
    new Promise((resolve, reject) => {
        redis.keys('user_group:*', (err, arrayGroups) => {
            if (err) reject(err);
            else resolve(arrayGroups);
        });
    }).then((arrayGroups) => {
        async.forEachOf(arrayGroups, (group, index, callbackForEachOfTwo) => {
            let sourceObjAddElement = objAddElement;
            if (group === 'user_group:administrator') {
                sourceObjAddElement = changeElementToObject(objAddElement, false, true);
            }

            if (sourceObjAddElement.elementParent === 'none' || sourceObjAddElement.elementChild === 'none') {
                redis.hkeys(group, (err, keys) => {
                    if (err) return callbackForEachOfTwo(err);

                    async.forEachOf(sourceObjAddElement.data, (objElem, element, callbackForEachThree) => {
                        let groupsNeedChange = keys.some((key) => element === key);

                        if (!groupsNeedChange) {
                            redis.hset(group, element, JSON.stringify(objElem), (err) => {
                                if (err) callbackForEachThree(err);
                                else callbackForEachThree(null);
                            });
                        } else {
                            callbackForEachThree(null);
                        }
                    }, function(err) {
                        if (err) callbackForEachOfTwo(err);
                        else callbackForEachOfTwo(null, { 'group': group, 'change': 'yes' });
                    });
                });
            } else {
                redis.hget(group, sourceObjAddElement.elementParent, (err, elemParent) => {
                    if (err) return callbackForEachOfTwo(err);
                    if (elemParent === null) return callbackForEachOfTwo(new Error(`group ${group} not found parent element`));

                    let objElementParent = JSON.parse(elemParent);
                    if (typeof objElementParent[sourceObjAddElement.elementChild] === 'undefined') return callbackForEachOfTwo(new Error(`group ${group} not found children element`));

                    let isAddElementNotExist = [];

                    for (let addElem in sourceObjAddElement.data) {
                        let elemIsExist = false;
                        for (let elemGroup in objElementParent[sourceObjAddElement.elementChild]) {
                            if (addElem === elemGroup) {
                                elemIsExist = true;
                                break;
                            }
                        }
                        if (!elemIsExist) isAddElementNotExist.push(addElem);
                    }

                    if (isAddElementNotExist.length === 0) return callbackForEachOfTwo(null);

                    isAddElementNotExist.forEach((elem) => {
                        objElementParent.data[elem] = sourceObjAddElement.data[elem];
                    });

                    redis.hset(group, sourceObjAddElement.elementParent, JSON.stringify(objElementParent), (err) => {
                        if (err) callbackForEachOfTwo(err);
                        else callbackForEachOfTwo(null);
                    });
                });
            }
        }, function(err) {
            if (err) func(err);
            else func(null);
        });
    }).catch((err) => {
        func(err);
    });
}