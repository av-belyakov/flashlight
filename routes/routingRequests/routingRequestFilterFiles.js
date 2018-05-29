/**
 * Модуль для передачи информации о файлах которые необходимо отфильтровать
 * выбранному источнику, для коммуникации применяется протокол websocket
 * 
 * Версия 0.1, дата релиза 29.05.2018
 */

'use strict';

const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');

/**
 * 
 * @param {*} sourceId - идентификатор источника
 * @param {*} data - передаваемые данные
 * @param {*} callback
 */
module.exports = function(sourceId, data, callback) {

    console.log(data);

    callback(null);
};