/**
 * Модуль выполняет обработку задач по скачиванию файлов с выбранного источника
 * при РАЗРЫВЕ соединения websocket
 * 
 * Версия 0.1, дата релиза 30.10.2018
 */

'use strict';

const debug = require('debug')('processingDownloadFilesConnectionClosed');

/**
 * @param {*} redis дискриптор соединения с БД
 * @param {*} sourceID ID источника\
 * @param {*} cb функция обратного вызова
 */
module.exports = function(redis, sourceID, cb) {

};