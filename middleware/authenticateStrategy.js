/*
* Стратегия локальной аутентификации пользователей
*
* Версия 0.1, дата релиза 29.12.2015
* */

'use strict';

const redis = require('../controllers').connectRedis();
const hashPassword = require('../libs/hashPassword');
const writeLogFile = require('./../libs/writeLogFile');

exports.authenticate = function (username, password, done) {
    let objUser = {
        id: 'userid_' + username,
        login: username,
        password: password
    };

    redis.hget('user_authntication:userid_' + username, 'password', function (err, redisPassword) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        if(redisPassword !== hashPassword.getHashPassword(password, 'this is flashlight')) {
            done(null, false, { message: 'Incorrect username or password' });
        } else {
            done(null, objUser);
        }
    });
};

exports.serializeUser = function (user, done) {
    done(null, user.id);
};

exports.deserializeUser = function (id, done) {
    redis.hget('user_authntication:' + id, 'login', function (err, redisLogin) {
        err ? done(err) : done(null, redisLogin);
    });
};
