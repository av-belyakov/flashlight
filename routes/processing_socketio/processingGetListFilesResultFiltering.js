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
    const MAX_SIZE_CHUNK = 25;

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
    }).then(objectData => {
        let objResult = {};

        let listFiles = Object.keys(objectData.listFiles);
        listFiles.sort();

        let countChunk = getCountChunk(MAX_SIZE_CHUNK, listFiles.length);
        let nextListChunk = listFiles.splice(0, MAX_SIZE_CHUNK);

        nextListChunk.forEach(fn => {
            let obj = {};
            try {
                let objTmp = JSON.parse(objectData.listFiles[fn]);

                obj.fileSize = objTmp.fileSize;
                obj.fileDownloaded = objTmp.fileDownloaded;

                objResult[fn] = obj;
            } catch (err) {
                obj.fileSize = '';
                obj.fileDownloaded = '';
            }
        });

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
                        'information': objResult,
                        'numberMessageParts': [1, countChunk, MAX_SIZE_CHUNK],
                    });
                });
        });
    }).then(resultObj => {
        callback(null, resultObj);
    }).catch(err => {
        callback(err);
    });
};

//вернуть количество частей
function getCountChunk(maxChunkSize, countList) {
    let countChunk = Math.floor(countList / maxChunkSize);
    let y = countList / maxChunkSize;
    if ((y - countChunk) !== 0) countChunk++;

    return countChunk;
}