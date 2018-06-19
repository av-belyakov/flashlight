/**
 * Модуль формирующий объект со списком источников в формате
 * {
 * 'идентификатор источника': { 
 *     statusConnection: 'тип bool',
 *     shortName: 'краткое имя источника'
 *     }
 * }
 * 
 * Версия 0.11, дата релиза 22.05.2018
 */

'use strict';

const globalObject = require('../../configure/globalObject');

module.exports = function(callback) {
    let objResult = {};
    let sources = globalObject.getData('sources');

    for (let hostId in sources) {
        let statusConnection = (sources[hostId].connectionStatus === 'connect');

        objResult[hostId] = {
            'statusConnection': statusConnection,
            'shortName': sources[hostId].shortName,
            'detailedDescription': sources[hostId].detailedDescription
        };
    }

    callback(null, objResult);
};