/**
 * Модуль отправляющий пользователю информационное сообщение
 * 
 * Версия 0.1, дата релиза 20.02.2018
 */

'use strict';

const writeLogFile = require('./writeLogFile');

module.exports = function(socketIo = null, type = 'danger', message = 'сообщение не определено') {
    if (socketIo === null) return writeLogFile.writeLog('\tError: the \'socketIo\' variable is not defined');

    socketIo.emit('notify information', {
        notify: JSON.stringify({ type: type, message: message })
    });
};