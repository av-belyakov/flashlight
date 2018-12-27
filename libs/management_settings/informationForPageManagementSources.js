/*
 * Подготовка информации для вывода на странице settings_sources
 *
 * Версия 0.1, дата релиза 24.12.2018
 * */

'use strict';

const async = require('async');

const getListSources = require('../../libs/helpers/getListSources');

/* получить краткую информацию об всех источниках
 * на вход принимает следующие параметры
 * - redis линк соединения с БД
 * - req объект запроса
 * - cb функцию обратного вызова
 */
exports.getShortInformationForTable = function(redis, req, cb) {
    new Promise((resolve, reject) => {
        getListSources((err, objListSources) => {
            if (err) reject(err);
            else resolve(objListSources);
        });
    }).then(objListSources => {
        let listSources = Object.keys(objListSources);

        return new Promise((resolve, reject) => {
            async.eachOf(listSources, (sourceID, key, callbackEachOf) => {
                async.parallel({
                    version: (callbackParallel) => {
                        redis.hget('remote_host_version_list', sourceID, (err, versionApp) => {
                            if (err) return callbackParallel(err);

                            if (versionApp === null) versionApp = 'нет данных';

                            callbackParallel(null, { 'versionApp': versionApp });
                        });
                    },
                    settings: (callbackParallel) => {
                        redis.hmget(`remote_host:settings:${sourceID}`,
                            'dateCreate',
                            'dateChanges',
                            'dateLastConnected',
                            'numberConnectionAttempts',
                            (err, arrData) => {
                                if (err) callbackParallel(err);
                                else callbackParallel(null, {
                                    'dateCreate': arrData[0],
                                    'dateChanges': arrData[1],
                                    'dateLastConnected': arrData[2],
                                    'numberConnectionAttempts': arrData[3]
                                });
                            });
                    }
                }, (err, result) => {
                    if (err) return callbackEachOf(err);

                    Object.assign(objListSources[sourceID], result.version);
                    Object.assign(objListSources[sourceID], result.settings);

                    callbackEachOf(null);
                });
            }, (err) => {
                if (err) reject(err);
                else resolve(objListSources);
            });
        });
    }).then(result => {
        redis.hget('system_settings', 'currentVersionApp', (err, currentVersionApp) => {
            if (err) throw (err);
            let objFinaly = {
                'currentVersionApp': currentVersionApp,
                'sources': result
            };

            cb(null, objFinaly);
        });
    }).catch(err => {
        cb(err);
    });
};