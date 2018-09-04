/**
 * Модуль обрабатывающий событие на загрузку следующей порции файлов полученных в результате фильтрации
 * 
 * Версия 0.1, дата релиза 03.09.2018
 */

'use strict';

module.exports = function(data, socketIo, redis, cb) {
    new Promise((resolve, reject) => {
        redis.hgetall(`task_list_files_found_during_filtering:${data.sourceID}:${data.taskIndex}`, (err, listFiles) => {
            if (err) reject(err);
            else resolve(listFiles);
        });
    }).then(listFiles => {
        let objResult = {};

        let keysListFiles = Object.keys(listFiles);
        keysListFiles.sort();

        if (keysListFiles.length === 0) return cb(null);

        let [currentChunk, allChunks, maxChunkSize] = data.nextChunk.split(',');

        if ((+currentChunk + 1) > +allChunks) return cb(null);
        let nextListChunk = keysListFiles.splice((+currentChunk * +maxChunkSize), +maxChunkSize);

        nextListChunk.forEach(fn => {
            if (typeof listFiles[fn] !== 'undefined') {
                let obj = {};
                try {
                    let objTmp = JSON.parse(listFiles[fn]);

                    obj.fileSize = objTmp.fileSize;
                    obj.fileDownloaded = objTmp.fileDownloaded;

                    objResult[fn] = obj;
                } catch (err) {
                    obj.fileSize = '';
                    obj.fileDownloaded = '';
                }
            }
        });

        return {
            newFilesList: objResult,
            nextChunk: `${+currentChunk + 1},${allChunks},${maxChunkSize}`
        };
    }).then(objResult => {
        socketIo.emit('next list chunk files filter result', {
            taskIndex: data.taskIndex,
            sourceID: data.sourceID,
            nextChunk: objResult.nextChunk,
            listFileInformation: objResult.newFilesList
        });

        cb(null);
    }).catch(err => {
        cb(err);
    });
};