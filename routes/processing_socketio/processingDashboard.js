/*
 * Управление виджетами
 *
 * Версия 0.1, дата релиза 22.03.2016
 * */

'use strict';

const validator = require('validator');

const getUserId = require('../../libs/users_management/getUserId');
const showNotify = require('../../libs/showNotify');
const controllers = require('../../controllers');
const writeLogFile = require('../../libs/writeLogFile');

const redis = controllers.connectRedis();

exports.editDashboardSources = function(socketIo, obj) {
    if (!checkSourcesId(obj.information)) return showNotify(socketIo, 'danger', 'Ошибка: полученны некоректные данные');

    getUserId.userId(redis, socketIo, (err, user) => {
        if (err) {
            showNotify(socketIo, 'danger', 'Ошибка: невозможно сохранить изменения');
            writeLogFile.writeLog('\tError: ' + err.toString());
            return;
        }

        redis.hget('user_authntication:' + user, 'settings', (err, settings) => {
            if (err) {
                showNotify(socketIo, 'danger', 'Ошибка: невозможно сохранить изменения');
                writeLogFile.writeLog('\tError: ' + err.toString());
                return;
            }

            let objSettings = JSON.parse(settings);
            objSettings.remoteHosts = obj.information;
            redis.hset('user_authntication:' + user, 'settings', JSON.stringify(objSettings), (err) => {
                if (err) {
                    showNotify(socketIo, 'danger', 'Ошибка: невозможно сохранить изменения');
                    writeLogFile.writeLog('\tError: ' + err.toString());
                } else {
                    showNotify(socketIo, 'info', 'Информация сохранена');
                }
            });
        });
    });
};

//проверка списка идентификаторов источников
function checkSourcesId(arraySourcesId) {
    return arraySourcesId.every(function(sourceId) {
        return validator.isNumeric(sourceId);
    });
}