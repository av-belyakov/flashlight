/*
 * Контроль подключенных источников
 * сброс соединения с источником если от него долго не поступают данные
 *
 * Версия 0.2, дата релиза 22.05.2018
 * */

'use strict';

const async = require('async');

const globalObject = require('../configure/globalObject');
const objWebsocket = require('../configure/objWebsocket');
const routeSocketIo = require('../routes/routeSocketIo');

module.exports = function(redis, socketIo) {
    let objConnectedSources = {};

    return function controlling(callback) {
        async.eachOf(globalObject.sources, (value, hostId, callbackEachOf) => {
            if (value.connectionStatus === 'disconnect') return callbackEachOf(null);

            redis.hget('remote_host:information:' + hostId, 'currentDateTime', (err, currentDateTime) => {
                if (err) return callbackEachOf(err);

                if (typeof objConnectedSources[hostId] === 'undefined') {
                    objConnectedSources[hostId] = currentDateTime;
                    callbackEachOf(null, false);
                } else {
                    if (+currentDateTime === +objConnectedSources[hostId]) {
                        globalObject.sources[hostId].connectionStatus = 'disconnect';

                        //разрываем соединение
                        objWebsocket['remote_host:' + value].drop(1000);
                        //удаляем информацию по источнику
                        delete objConnectedSources[value];

                        //изменяем статус соединения
                        routeSocketIo.eventGenerator(socketIo, value, { messageType: 'close' });
                    } else {
                        objConnectedSources[value] = currentDateTime;
                        callbackEachOf(null);
                    }
                }
            });
        }, (err) => {
            if (err) callback(err);
            else callback(null);
        });
    };
};