/**
 * Общий вид сообщений
 * 
 * Версия 0.1, дата релиза 23.11.2017
 */

'use strict';

let showNotify = function(type, message) {
    $.notify({
        message: message
    }, {
        type: type,
        placement: { from: 'top', align: 'right' },
        offset: { x: 0, y: 60 }
    });
};

export { showNotify };