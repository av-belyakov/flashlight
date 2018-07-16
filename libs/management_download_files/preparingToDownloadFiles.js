/*
 * Предварительная подготовка к загрузке файлов с источника
 *
 * выполняются следующие действия:
 * - создаются директории и поддиректории в которых будут загружатся файлы
 * - проверяются полученные от источника данные и загружаются в таблицу task_loading_files:*
 * - удаляется идентификатор задачи из списка task_turn_downloading_files
 * - в таблице task_filtering_all_information:* измеяются следующие значения:
 *     - uploadFiles (с 'not loaded' на 'in line')
 *     - uploadDirectoryFiles (на директорию в которую загружается файлы)
 *
 * Версия 0.1, дата релиза 07.09.2016
 * */

'use strict';

const fs = require('fs');
const async = require('async');
const config = require('../../configure');
const validator = require('validator');

const errorsType = require('../../errors/errorsType');

module.exports = function(redis, objData, func) {
    let [id, taskIndex] = objData.taskIndex.split(':');

    async.waterfall([
        //получаем краткое название источника
        function(callback) {
            redis.hget('remote_host:settings:' + id, 'shortName', function(err, shortSourceName) {
                if (err) callback(err);
                else callback(null, shortSourceName);
            });
        },
        //формируем массив с данными о расположении загружаемых файлов
        function(shortSourceName, callback) {
            let newArray = shortSourceName.split(' ');
            let sourceIdShortName = newArray.join('_');

            redis.hget('task_filtering_all_information:' + taskIndex, 'filterSettings', function(err, filterSetting) {
                if (err) {
                    callback(err);
                } else {
                    let objSettings = JSON.parse(filterSetting);

                    let dateTimeStart = objSettings.dateTimeStart.replace(' ', '_');
                    let dateTimeEnd = objSettings.dateTimeEnd.replace(' ', '_');
                    let arrayDayMonthYear = (objSettings.dateTimeStart.split(' ')[0]).split('.');
                    let directory = `${dateTimeStart}_${dateTimeEnd}_${taskIndex}`;

                    let array = [
                        `${id}-${sourceIdShortName}/`,
                        arrayDayMonthYear[2] + '/',
                        arrayDayMonthYear[1] + '/',
                        arrayDayMonthYear[0] + '/',
                        directory,
                        ''
                    ];

                    callback(null, array);
                }
            });
        },
        //выполняем формирование директорий
        function(arrayDownloadDirectoryName, callback) {
            let sourceId = arrayDownloadDirectoryName.splice(0, 1);
            let mainDownloadDirectoryName = '/' + config.get('downloadDirectory:directoryName') + '/';

            async.reduce(arrayDownloadDirectoryName, sourceId, function(memo, item, done) {
                fs.lstat(mainDownloadDirectoryName + memo, function(err, obj) {
                    if (err) {
                        fs.mkdir(mainDownloadDirectoryName + memo, function(err) {
                            if (err) done(err);
                            else done(null, memo + item);
                        });
                    } else {
                        done(null, memo + item);
                    }
                });
            }, function(err, directory) {
                if (err) {
                    callback(err);
                } else {
                    let uploadDirectoryFiles = mainDownloadDirectoryName + directory;
                    callback(null, uploadDirectoryFiles);
                }
            });
        },

        /** 
         *      В МЕСТО таблицы task_loading_files: используем РАНЕЕ СОЗДАННУЮ ТАБЛИЦУ 
         * task_list_files_found_during_filtering:<ID source>:<ID task> где существуют параметры
         *      <имя_файла>: {
         *          'fileSize': <размер_файла>,
         *          'fileDownloaded': <файл_выгружен>,
         *          'fileChecked': <файл_выбран>
         *      }
         * */

        //создаем таблицу task_loading_files:*
        function(uploadDirectoryFiles, callback) {
            createTableTaskLoadingFiles.call(objData, redis, function(err) {
                if (err) callback(err);
                else callback(null, uploadDirectoryFiles);
            });
        },
        //изменяем в таблице task_filtering_all_information:* ряд значений
        function(uploadDirectoryFiles, callback) {
            redis.hmset('task_filtering_all_information:' + taskIndex, {
                'uploadFiles': 'in line',
                'uploadDirectoryFiles': uploadDirectoryFiles
            }, function(err) {
                if (err) callback(err);
                else callback(null);
            });
        }
    ], function(err) {
        if (err) func(err);
        else func(null, true);
    });
};

//создаем таблицу task_loading_files:*
function createTableTaskLoadingFiles(redis, done) {
    let self = this;
    let taskId = self.taskIndex.split(':')[1];

    if (typeof self.listFilesName === 'undefined') {
        return done(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    let num = 0;
    let arrayTmp = [];
    let arrayFilesName = self.listFilesName;

    arrayFilesName.forEach((item) => {
        let fileName = validator.escape(item[0]);
        let fileSize = (new RegExp('^[0-9]{1,}$').test(item[1])) ? item[1] : 0;

        redis.hset('task_loading_files:' + taskId, fileName, fileSize + '/0/not loaded', function(err) {
            if (err) arrayTmp.push(false);
            else arrayTmp.push(true);
            if (num === (arrayFilesName.length - 1)) {
                if (!arrayTmp.some((item) => item)) done(new errorsType.errorRedisDataBase('error Redis Data Base'));
                else done(null);
            }
            num++;
        });
    });
}