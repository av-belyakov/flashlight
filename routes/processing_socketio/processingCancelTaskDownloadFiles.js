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
            else return;
        });
    }).then(() => {
        return sendMsgChangeTaskStatus(redis, socketIo, taskIndex);
    }).then(() => {
        //удаляем информацию о выполняемой задачи из объекта globalObject
        globalObject.deleteData('processingTasks', taskIndex);

        //генерируем событие информирующее о снятии задачи
        showNotify(socketIo, 'success', `Отмена задачи по загрузки файлов выполнена успешно`);

        let objFileInfo = {
            'information': {
                'taskIndex': taskIndex
            }
        };

        debug('удаляем информацию о выполняемой задачи из объекта globalObject');

        //генерируем событие удаляющее виджет визуализирующий загрузку файла
        socketIo.emit('task upload files cancel', objFileInfo);
        socketIo.broadcast.emit('task upload files cancel', objFileInfo);

        cb(null);
    }).catch(err => {
        cb(err);
    });
};

//сообщение об изменения статуса задач
function sendMsgChangeTaskStatus(redis, socketIoS, taskIndex) {
    //сообщения об изменении статуса задач
    return new Promise((resolve, reject) => {

        debug('    //сообщения об изменении статуса задач');


        getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
            if (err) reject(err);
            else resolve(objTaskStatus);
        });
    }).then(objTaskStatus => {
        return new Promise((resolve, reject) => {

            debug('-=-=-=-=-=-=');
            debug(objTaskStatus);

            getListsTaskProcessing((err, objListsTaskProcessing) => {
                if (err) reject(err);
                else resolve({
                    status: objTaskStatus,
                    lists: objListsTaskProcessing
                });
            });
        });
    }).then(obj => {

        debug(obj.status);

        let objStatus = {
            processingType: 'showChangeObject',
            informationPageJobLog: obj.status,
            informationPageAdmin: obj.lists
        };

        socketIoS.emit('change object status', objStatus);
        socketIoS.broadcast.emit('change object status', objStatus);
    }).catch(err => {

        debug(err);

        throw (err);
    });
}