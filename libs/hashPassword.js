/*
* Вывод хеша пароля
*
* Версия 0.1, дата релиза 11.01.2016
* */

'use strict';

const crypto = require('crypto');

module.exports.getHashPassword = function (string, salt){
    return crypto.createHash('sha256')
        .update(string)
        .update(salt)
        .digest('hex');
};