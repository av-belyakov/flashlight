/**
 * Модуль осуществляющий обработку запроса пользователя на остановку задачи по выгрузке файлов
 * 
 * Версия 0.1,дата релиза 03.10.2018
 */

'use strict';

/**
 * 
 * @param {*} data - содержит следующие параметры:
 * @param {*} socketIo - дискриптор соединения с клиентом по протоколу websocket
 * @param {*} redis - дискриптор соединения с БД
 * @param {*} callback - функция обратного вызова
 */
module.exports = function(data, socketIo, redis, callback) {
    new Promise((resolve, reject) => {
        //проверка прав доступа пользователя
        checkAccessRights(socketIo, 'management_tasks_import', 'stop', (trigger) => {
            if (!trigger) reject(new Error('Не достаточно прав доступа для останова задачи по загрузке найденных файлов'));
            else resolve();
        });
    }).then(() => {

        callback(null);
    }).catch(err => {
        callback(err);
    });
};