/*
 * Подсчет количества не рассмотренных задач, файлы по которым были выгружены
 *
 * Версия 0.1, дата релиза 31.01.2017
 * */

'use strict';

const writeLogFile = require('./writeLogFile');

module.exports = function (redis, func) {
    redis.zrange('task_filtering_upload_not_considered', [0, -1], function (err, listTaskUpload) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        else func(listTaskUpload.length);
    });
};