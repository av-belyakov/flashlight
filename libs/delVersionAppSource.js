/**
 * Модуль удаляет из таблицы 'remote_host_version_list' всю информацию
 * о версии программоного обеспечения
 * 
 * Версия 0.1, дата релиза 28.12.2018
 */

'use strict';

module.exports = function(redis, sourceID) {
    return new Promise((resolve, reject) => {
        redis.hdel('remote_host_version_list', sourceID, err => {
            if (err) reject(err);
            else resolve();
        });
    });
};