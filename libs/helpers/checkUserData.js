/**
 * Модуль в котором выполняется проверка данных поступающих от пользователя 
 * через соединение socketio при запуске фильтрации
 * 
 * Версия 0.1, дата релиза 04.06.2018
 */

'use strict';

const validator = require('validator');

/**
 * 
 * @param {*} obj - объект с проверяемой информацией
 * @param {*} callback - функция обратного вызова 
 */
module.exports = function(obj, callback) {
    //let patternIp = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$');
    let patternNet = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)/[0-9]{1,2}$');
    //цифрового проверка идентификатора источника
    let isSourceIdTrue = validator.isInt(obj.sourceId);

    //проверка даты и времени
    let patternDataTime = new RegExp('^(\\d{1,2}).(\\d{1,2}).(\\d{2,4})\\s(\\d{1,2}):(\\d{1,2})$');
    let isDateTimeStartTrue = patternDataTime.test(obj.dateTimeStart);
    let isDateTimeEndTrue = patternDataTime.test(obj.dateTimeEnd);

    //проверка перечня ip-адресов и подсетей
    let arrayTmp = obj.ipOrNetwork.split(',');
    let isIpOrNetworkTrue = arrayTmp.every((item) => {
        if (~item.indexOf('/')) return patternNet.test(item);
        else return validator.isIP(item);
    });

    if ((+new Date(obj.dateTimeStart) >= (+new Date(obj.dateTimeEnd)))) return callback(false);

    let trigger = (isSourceIdTrue && isDateTimeStartTrue && isDateTimeEndTrue && isIpOrNetworkTrue) ? true : false;

    callback(trigger);
};