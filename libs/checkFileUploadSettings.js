/*
 * Проверка параметров задания для выгрузки отфильтрованного сетевого трафика с выбранного источника
 *
 * выполняется:
 * 1. наличие задачи с полученным хешом (идентификатор хеш-таблицы task_filtering_index_all)
 * 2. статуса задачи фильтрации (поле jobStatus должно быть complete)
 * 3. количество найденных файлов (поле countFilesFound)
 * 4. загрузка сет. трафика не производилась или была приостановленна (поле uploadFiles
 *    равно not loaded или suspended)
 *
 * Версия 0.11, дата релиза 22.05.2018
 * */

'use strict';

const async = require('async');

const errorsType = require('../errors/errorsType');
const controllers = require('../controllers');
const writeLogFile = require('./writeLogFile');
const globalObject = require('../configure/globalObject');
const getSourceIdToHex = require('./getSourceIdToHex');

module.exports = function(taskIndex, func) {
    let redis = controllers.connectRedis();

    async.parallel([
        //проверка хеша регулярным выражением
        function(callback) {
            let pattern = new RegExp('^[a-zA-Z0-9\\s]+$');
            if ((taskIndex === undefined) || (!pattern.test(taskIndex))) {
                callback(new errorsType.receivedIncorrectData('Ошибка: выгрузка сетевого трафика невозможна, получены некорректные данные'));
            } else {
                callback(null, true);
            }
        },
        //проверка наличия хеша taskIndex
        function(callback) {
            redis.exists('task_filtering_all_information:' + taskIndex, function(err, result) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                if (result === 0) return callback(new errorsType.receivedIncorrectData('Ошибка: выгрузка сетевого трафика невозможна, получены некорректные данные'));

                callback(null, true);
            });
        },
        //проверка статуса задачи на фильтрацию
        function(callback) {
            redis.hget('task_filtering_all_information:' + taskIndex, 'jobStatus', function(err, jobStatus) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                if (jobStatus !== 'complete') {
                    callback(new errorsType.fieldJobStatusIsNotComplete('Ошибка: выгрузка сетевого трафика невозможна, фильтрация не завершена'));
                } else {
                    callback(null, true);
                }
            });
        },
        //проверка количества найденных файлов
        function(callback) {
            redis.hget('task_filtering_all_information:' + taskIndex, 'countFilesFound', function(err, count) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                if (+count === 0) {
                    callback(new errorsType.fieldCountFilesFoundIsZero('Ошибка: выгрузка сетевого трафика невозможна, по заданным параметрам фильтрации найдено 0 файлов'));
                } else {
                    callback(null, true);
                }
            });
        },
        //проверка статуса загрузки сетевого трафика
        function(callback) {
            redis.hget('task_filtering_all_information:' + taskIndex, 'uploadFiles', function(err, status) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                if (status === 'not loaded') return callback(null, true);
                else callback(new errorsType.fieldUploadFilesIsNotSuspendedOrNotLoaded('Ошибка: невозможно добавить задачу на выгрузку файлов, так как задача находится в очереди, выполняется загрузка или файлы уже были загружены'));
            });
        },
        //проверка статуса источника (подключен ли он)
        function(callback) {
            getSourceIdToHex(redis, taskIndex, function(err, sourceId) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                let connectionStatus = globalObject.getData('sources', sourceId, 'connectionStatus');

                if ((connectionStatus === null) || (connectionStatus === 'disconnect')) {
                    callback(new errorsType.receivedIncorrectData('Ошибка: выгрузка сетевого трафика невозможна, источник №' + sourceId + ' не подключен'));
                } else {
                    callback(null, true);
                }
            });
        }
    ], function(err, result) {
        if (err) {
            //if (err.name === 'ErrorRedisDataBase') writeLogFile.writeLog('\tError: ' + err.cause);
            func(err, err.message);
        } else {
            func(null, true);
        }
    });
};