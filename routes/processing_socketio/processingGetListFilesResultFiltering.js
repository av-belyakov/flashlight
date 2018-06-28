/**
 * Модуль формирующий список файлов полученных в результате фильтрации
 * 
 * Версия 0.1, дата релиза 28.06.2018
 */

'use strict';

/**
 * @param redis - дескриптор соединения с БД
 * @param data - набор параметров (идентификатор задачи)
 * @param callback - функция обратного вызова
 */
module.exports = function(redis, data, callback) {
    let checkOddValue = (value) => {
        return value % 2 === 0;
    };

    new Promise((resolve, reject) => {
        redis.hget(`task_filtering_all_information:${data.taskIndex}`, 'sourceId', (err, sourceId) => {
            if (err) reject(err);
            else resolve(sourceId);
        });
    }).then((sourceId) => {
        return new Promise((resolve, reject) => {
            redis.hgetall(`task_list_files_found_during_filtering:${sourceId}:${data.taskIndex}`, (err, listFiles) => {
                if (err) reject(err);
                else resolve({
                    sourceId: sourceId,
                    listFiles: listFiles
                });
            });
        });
    }).then((objectData) => {
        let i = 1;
        let objResult = {};
        let fileName = '';

        for (let fn in objectData.listFiles) {
            let obj = {};
            if (!checkOddValue(i)) {
                obj[fileName] = fn;
                fileName = fn;
            } else {
                try {
                    let objTmp = JSON.parse(objectData.listFiles[fn]);

                    obj.fileSize = objTmp.fileSize;
                    obj.fileDownloaded = objTmp.fileDownloaded;

                    objResult[fn] = obj;
                } catch (err) {
                    obj.fileSize = '';
                    obj.fileDownloaded = '';
                }
            }

            i++;
        }

        return new Promise((resolve, reject) => {
            redis.hmget(`remote_host:settings:${objectData.sourceId}`,
                'shortName',
                'detailedDescription',
                (err, finalResult) => {
                    if (err) reject(err);
                    else resolve({
                        'sourceId': objectData.sourceId,
                        'shortName': finalResult[0],
                        'detailedDescription': finalResult[1],
                        'taskIndex': data.taskIndex,
                        'information': objResult
                    });
                });
        });
    }).then((resultObj) => {
        callback(null, resultObj);
    }).catch((err) => {
        callback(err);
    });
};