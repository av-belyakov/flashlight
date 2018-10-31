/**
 * Модуль добавляющий задачу по скачиванию файлов в список ожидающих выполнение
 * 
 * Версия 0.1, дата релиза 31.10.2018
 */

'use strict';

const globalObject = require('../../configure/globalObject');

/**
 * @param {*} redis дискриптор соединения с БД
 * @param {*} taskIndex ID источника
 */
module.exports = function addTaskQueue(redis, taskIndex) {
    return new Promise((resolve, reject) => {
        //получаем sourceID
        redis.hget(`task_filtering_all_information:${taskIndex}`, 'sourceId', (err, sourceID) => {
            if (err) reject(err);
            else resolve(sourceID);
        });
    }).then(sourceID => {
        //изменяем статус загрузки файлов в таблице task_filtering_all_information:
        return new Promise((resolve, reject) => {
            redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'in line', err => {
                if (err) reject(err);
                else resolve(sourceID);
            });
        });
    }).then(sourceID => {
        //удаляем задачу из таблицы task_implementation_downloading_files и добавляем ее в task_turn_downloading_files 
        return new Promise((resolve, reject) => {
            redis.lrem('task_implementation_downloading_files', 0, `${sourceID}:${taskIndex}`, err => {
                if (err) return reject(err);

                redis.lpush('task_turn_downloading_files', `${sourceID}:${taskIndex}`, err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }).then(() => {
        globalObject.modifyData('processingTasks', taskIndex, [
            ['status', 'in line'],
            ['timestampModify', +new Date()]
        ]);
    });
};