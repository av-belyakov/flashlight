/**
 * Модуль обработки отмены задачи по скачиванию файлов находящейся в очереди
 * 
 * Версия 0.1, дата релиза 03.10.2018
 */

'use strict';

const debug = require('debug')('processingCancelTaskDownloadFiles');

const async = require('async');

const showNotify = require('../../libs/showNotify');
const globalObject = require('../../configure/globalObject');
const checkAccessRights = require('../../libs/users_management/checkAccessRights');

/**
 * 
 * @param {*} taskIndex ID задачи
 * @param {*} socketIo дискриптор соединения через протокол socketIo
 * @param {*} redis дискриптор соединения с БД
 * @param {*} cb функция обратного вызова
 */
module.exports = function(taskIndex, socketIo, redis, cb) {

    console.log('TASK DOWNLOAD FILES "CANCEL!!!"');


    new Promise((resolve, reject) => {

        debug('проверка прав доступа');

        checkAccessRights(socketIo, 'management_tasks_import', 'cancel', function(trigger) {

            debug('trigger access = ' + trigger);

            if (!trigger) reject(new Error('Не достаточно прав доступа для останова задачи по загрузке найденных файлов'));
            else resolve();
        });
    }).then(() => {

        debug('получаем идентификатор источника');

        return new Promise((resolve, reject) => {
            redis.hget(`task_filtering_all_information:${taskIndex}`, 'sourceId', (err, sourceID) => {
                if (err) reject(err);
                else resolve(sourceID);
            });
        });
    }).then(sourceID => {
        let taskIDDownloadFiles = `${sourceID}:${taskIndex}`;

        async.parallel([
            //удаляем элемент из таблицы task_turn_downloading_files
            callback => {

                debug('                //удаляем элемент из таблицы task_turn_downloading_files');

                redis.lrem('task_turn_downloading_files', 0, taskIDDownloadFiles, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            //удаляем элемент из таблицы task_implementation_downloading_files
            callback => {

                debug('                //удаляем элемент из таблицы task_implementation_downloading_files');

                redis.lrem('task_implementation_downloading_files', 0, taskIDDownloadFiles, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {

                debug('изменяем параметры в таблице task_filtering_all_information:');

                redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                    'uploadFiles': 'not loaded',
                    'uploadDirectoryFiles': 'null',
                    'userNameStartUploadFiles': 'null',
                    'dateTimeStartUploadFiles': 'null'
                }, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], err => {
            if (err) throw (err);
            else return sourceID;
        });
    }).then(sourceID => {
        //удаляем информацию о выполняемой задачи из объекта globalObject
        globalObject.deleteData('processingTasks', taskIndex);

        //генерируем событие информирующее о снятии задачи
        showNotify(socketIo, 'success', `Отмена задачи по загрузки файлов с источника №${sourceID} выполнена успешно`);

        //генерируем событие удаляющее виджет визуализирующий загрузку файла
        socketIo.emit('task upload files cancel', {
            'information': {
                'taskIndex': taskIndex,
                'sourceId': sourceID
            }
        });

        cb(null);
    }).catch(err => {
        cb(err);
    });
};