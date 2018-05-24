/*
 * Изменение статуса задачи по загруженным файлам
 *
 * Версия 0.1, дата релиза 13.12.2016
 * */

'use strict';

const async = require('async');

const getUserId = require('../../libs/users_management/getUserId');
const errorsType = require('../../errors/errorsType');
const writeLogFile = require('../../libs/writeLogFile');

module.exports = function(redis, socketIo, data, func) {
    let pattern = new RegExp('^[0-9]{1,}[:][0-9a-zA-Z]+$');

    //проверяем данные полученные от пользователя
    if (!pattern.test(data.taskIndex)) {
        writeLogFile.writeLog('\tError: Неверный идентификатор задачи, получены некорректные данные');
        return func(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    try {
        let [sourceId, taskId] = data.taskIndex.split(':');

        getUserId.userId(redis, socketIo, function(err, userId) {
            if (err) {
                writeLogFile.writeLog('\tError: Неверный идентификатор задачи, получены некорректные данные');
                return func(new errorsType.receivedIncorrectData('Ошибка: неверный идентификатор задачи, получены некорректные данные'));
            }

            redis.hmget('user_authntication:' + userId, 'login', 'user_name', function(err, result) {
                if (err) {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    return func(err);
                }

                async.parallel([
                    function(callback) {
                        redis.zrem('task_filtering_upload_not_considered', sourceId + ':' + taskId, function(err) {
                            if (err) callback(err);
                            else callback(null);
                        });
                    },
                    function(callback) {
                        redis.hmset('task_filtering_all_information:' + taskId, {
                            'dateTimeLookedThisTask': +new Date(),
                            'loginNameLookedThisTask': result[0],
                            'userNameLookedThisTask': result[1]
                        }, function(err) {
                            if (err) callback(err);
                            else callback(null)
                        });
                    }
                ], function(err) {
                    if (err) {
                        writeLogFile.writeLog('\tError: ' + err.toString());
                        func(err);
                    } else {
                        redis.zrange('task_filtering_upload_not_considered', [0, -1], function(err, listTaskUpload) {
                            if (err) func(err);
                            else func(null, listTaskUpload.length);
                        });
                    }
                });
            });
        });
    } catch (err) {
        writeLogFile.writeLog('\tError: ' + err.toString());
        func(err);
    }
};