/*
* Изменение пароля администратора установленого по умолчанию
*
* Версия 0.1, дата релиза 12.01.2016
* */

'use strict';

let crypto = require('crypto');

let controllers = require('../.././controllers');
let hashPassword = require('../hashPassword');
let writeLogFile = require('../writeLogFile');

module.exports.writeNewPasswordAdmin = function (req, res) {
    let salt = 'this is flashlight';
    let newPasswordOne = req.body.newPasswordOne;
    let newPasswordTwo = req.body.newPasswordTwo;
    let redis = controllers.connectRedis();

    if(newPasswordOne === newPasswordTwo){
        let md5string = crypto.createHash('md5')
            .update(newPasswordOne)
            .digest('hex');
        let newPassword = hashPassword.getHashPassword(md5string, salt);
        redis.hset('user_authntication:userid_administrator', 'password', newPassword, function (err) {
            if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        });
    }
};