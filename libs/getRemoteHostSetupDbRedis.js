/*
 * возвращает объект с информацией из remote_host:settings:*
 * Версия 0.2, дата релиза 21.05.2018
 * */

'use strict';

module.exports = function(redis, hostId, callback) {
    redis.hmget('remote_host:settings:' + hostId,
        'shortName',
        'detailedDescription',
        'ipaddress',
        'port',
        'dateLastConnected',
        'numberConnectionAttempts',
        'token',
        'maxCountProcessFiltering',
        function(err, arrData) {
            if (err) callback(err);
            else callback(null, {
                'shortName': arrData[0],
                'detailedDescription': arrData[1],
                'ipaddress': arrData[2],
                'port': arrData[3],
                'dateLastConnected': arrData[4],
                'numberConnectionAttempts': arrData[5],
                'token': arrData[6],
                'maxCountProcessFiltering': arrData[7],
            });
        });
};