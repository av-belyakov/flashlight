/**
 * Модуль обработки отмены задачи по скачиванию файлов находящейся в очереди
 * 
 * Версия 0.1, дата релиза 03.10.2018
 */

'use strict';

const async = require('async');

const showNotify = require('../../libs/showNotify');
const globalObject = require('../../configure/globalObject');
const checkAccessRights = require('../../libs/users_management/checkAccessRights');
const getListsTaskProcessing = require('../../libs/getListsTaskProcessing');
const getTaskStatusForJobLogPage = require('../../libs/getTaskStatusForJobLogPage');


/**
 * 
 * @param {*} taskIndex ID задачи
 * @param {*} socketIo дискриптор соединения через протокол socketIo
 * @param {*} redis дискриптор соединения с БД
 * @param {*} cb функция обратного вызова
 */
module.exports = function(taskIndex, socketIo, redis, cb) {
    new Promise((resolve, reject) => {
        checkAccessRights(socketIo, 'management_tasks_import', 'cancel', function(trigger) {
            if (!trigger) reject(new Error('Не достаточно прав доступа для останова задачи по загрузке найденных файлов'));
            else resolve();
        });
    }).then(() => {
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
                redis.lrem('task_turn_downloading_files', 0, taskIDDownloadFiles, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            //удаляем элемент из таблицы task_implementation_downloading_files
            callback => {
                redis.lrem('task_implementation_downloading_files', 0, taskIDDownloadFiles, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {
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
            else return;
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            getObjChangeTaskStatus(redis, taskIndex, (err, objChangeTaskStatus) => {
                if (err) reject(err);
                else resolve(objChangeTaskStatus);
            });
        });
    }).then(objChangeTaskStatus => {
        //удаляем информацию о выполняемой задачи из объекта globalObject
        globalObject.deleteData('processingTasks', taskIndex);

        //генерируем событие информирующее о снятии задачи
        showNotify(socketIo, 'success', `Отмена задачи по загрузки файлов выполнена успешно`);

        let objFileInfo = {
            'information': {
                'taskIndex': taskIndex
            }
        };

        //генерируем события изменяющие кнопку 'импорт'
        socketIo.emit('change object status', objChangeTaskStatus);
        socketIo.broadcast.emit('change object status', objChangeTaskStatus);

        //генерируем событие удаляющее виджет визуализирующий загрузку файла
        socketIo.emit('task upload files cancel', objFileInfo);
        socketIo.broadcast.emit('task upload files cancel', objFileInfo);

        cb(null);
    }).catch(err => {
        cb(err);
    });
};

//сообщение об изменения статуса задач
function getObjChangeTaskStatus(redis, taskIndex, cb) {
    console.log('processingCancelTaskDownloadFiles --- 4.1');

    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
        if (err) return cb(err);

        console.log('processingCancelTaskDownloadFiles --- 4.2');
        console.log(objTaskStatus);

        let objStatus = {
            processingType: 'showChangeObject',
            informationPageJobLog: objTaskStatus,
            informationPageAdmin: getListsTaskProcessing()
        };

        cb(null, objStatus);
    });
}