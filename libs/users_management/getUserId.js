/*
 * Получаем идентификатор пользователя
 * на вход принимает
 * - линк соединения с БД
 * - линк соединения по SocketIO
 * - функцию обратного вызова
 *
 * Версия 0.2, дата релиза 22.06.2017
 * */

'use strict';

//получить идентификатор пользователя
module.exports.userId = function(redis, socketIo, callback) {
    if (typeof socketIo.request === 'undefined') return callback(new Error('Error socketIo, incorrect request'));
    if (typeof socketIo.request.headers === 'undefined') return callback(new Error('Error socketIo,there is no title'));
    if (typeof socketIo.request.headers.cookie === 'undefined') return callback(new Error('Error socketIo, missing the cookie'));

    if (!(~socketIo.request.headers.cookie.indexOf(';'))) return callback(new Error('Error socketIo, incorrect cookie'));

    let cookie = socketIo.request.headers.cookie.split('; ');
    let id = '';
    for (let i = 0; i < cookie.length; i++) {
        if (~cookie[i].indexOf('connect.sid')) {
            if (!(~cookie[i].indexOf('.'))) return callback(new Error('Error socketIo, incorrect cookie'));
            id = cookie[i].slice(16).split('.');
        }
    }

    if (id.length < 2) return callback(new Error('Error socketIo, incorrect cookie'));

    redis.get('socketio_id:' + id[0], function(err, user) {
        if (err) return callback(err);
        if (user === null) return callback(new Error('Error socketIo, incorrect cookie'));

        callback(null, user);
    });
};