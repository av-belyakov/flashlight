/**
 * Модуль для передачи информации о файлах которые необходимо отфильтровать
 * выбранному источнику, для коммуникации применяется протокол websocket
 * 
 * Версия 0.1, дата релиза 29.05.2018
 */

'use strict';

const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');

/**
 * 
 * @param {*} sourceId - идентификатор источника
 * @param {*} data - передаваемые данные
 * @param {*} callback
 */
module.exports = function(sourceId, listFiles, callback) {

    console.log(listFiles);
    let [countChunk, arrayListFilesIndex] = transformListIndexFiles(30, listFiles);

    console.log('countChunk:' + countChunk);
    console.log('arrayListFiles');
    console.log(arrayListFilesIndex);

    callback(null);
};

//делим списки файлов на фрагменты и считаем их количество
function transformListIndexFiles(sizeChunk, listFilesIndexes) {
    let maxSegmentSize = 0;
    let listFiles = [];
    let obj = {};

    for (let key in listFilesIndexes) {
        if (!~key.indexOf(':')) continue;

        let tmp = key.split(':');

        if (tmp.length < 4) continue;

        if (maxSegmentSize < listFilesIndexes[key].length) maxSegmentSize = listFilesIndexes[key].length;
        obj[key] = tmp[3];
    }

    console.log(obj);

    let countChunk = Math.floor(maxSegmentSize / sizeChunk);
    let y = maxSegmentSize / sizeChunk;

    if ((y - countChunk) === 0) countChunk++;

    for (let i = 0; i < countChunk; i++) {

        console.log('num: ' + i);

        let newObj = {};
        for (let index in obj) {
            console.log(index);
            newObj[obj[index]] = listFilesIndexes[index].splice(0, (sizeChunk + 1));
        }
        listFiles.push(newObj);
    }

    return { countChunk, listFiles };
}