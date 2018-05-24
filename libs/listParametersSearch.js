/*
* Для журнала логов фильтрации,
* формирование объекта состящего из списка параметров используемых для поиска
*
* Версия 0.1, дата релиза 10.06.2016
* */

'use strict';

const async = require('async');

const writeLogFile = require('./writeLogFile');

//получить список всех пользователей
function getListUsers (redis, done) {
    redis.keys('user_authntication:userid_*', function (err, listLogin) {
        if(err) return done(err);

        let obj = {};
        async.map(listLogin, function (item, callbackMap) {
            redis.hget(item, 'user_name', function (err, name) {
                if(err) return callbackMap(err);

                try {
                     let login = item.split('_')[2];
                     obj[login] = name;

                     callbackMap(null, obj);
                } catch (err) {
                    callbackMap(err);
                }
            });
        }, function (err, arrayResult) {
            if(err) done(err);
            else done(null, arrayResult[0]);
        });
    });
}

//получить список всех источников
function getListSourceId (redis, done) {
    redis.lrange('remote_hosts_exist:id', [0, -1], function (err, listSource) {
        if(err) return done(err);

        let obj = {};
        async.map(listSource, function (item, callbackMap) {
            redis.hget('remote_host:settings:' + item, 'shortName', function (err, shortName) {
                if(err) return callbackMap(err);

                obj[item] = shortName;
                callbackMap(null, obj);
            })
        }, function (err, arrayResult) {
            if(err) done(err);
            else done(null, arrayResult[0]);
        });
    });
}

exports.jobLog = function (redis, func) {
    async.parallel({
        statusFilter : function (callback) {
            callback(null, {
                'rejected' : 'oтклонена',
                'execute' : 'выполняется',
                'complete' : 'завершена',
                'stop' : 'остановлена'
            });
        },
        statusImport : function (callback) {
            callback(null, {
                'not loaded' : 'не выполнялся',
                'in line' : 'в очереди',
                'loaded' : 'выполняется',
                'suspended' : 'приостановлен',
                'uploaded' : 'выполнен'
            });
        },
        users : function (callback) {
            getListUsers(redis, function (err, listUser) {
                if(err) callback(err);
                else callback(null, listUser);
            });
        },
        sourceIndex : function (callback) {
            getListSourceId(redis, function (err, listSourceId) {
                if(err) callback(err);
                else callback(null, listSourceId);
            })
        }
    }, function (err, objResult) {
        if(err){
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            func(objResult);
        }
    });
};

exports.uploadFile = function (redis, func) {
    async.parallel({
        actionType : function (callback) {
            callback(null, {
                'filtering' : 'фильтрация',
                'downloading' : 'скачивание',
                'changeStatus' : 'изменение статуса'
            });
        },
        users : function (callback) {
            getListUsers(redis, function (err, listUser) {
                if(err) callback(err);
                else callback(null, listUser);
            });
        },
        sourceIndex : function (callback) {
            getListSourceId(redis, function (err, listSourceId) {
                if(err) callback(err);
                else callback(null, listSourceId);
            })
        }
    }, function (err, objResult) {
        if(err){
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            func(objResult);
        }
    });
};