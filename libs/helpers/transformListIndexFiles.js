/**
 * Модуль делит списки файлов на фрагменты и считает их количество
 * 
 * Версия 0.1, дата релиза 04.06.2018
 */

'use strict';

/**
 * 
 * @param {*} listFilesIndexes - список файлов формата 
 *  {
 *    <directory_1>: [<имя_файла_1>, <имя_файла_2>, <имя_файла_n>],
 *    <directory_2>: [<имя_файла_1>, <имя_файла_2>, <имя_файла_n>],
 *    <directory_n>: [<имя_файла_1>, <имя_файла_2>, <имя_файла_n>]
 *      } 
 */
module.exports = function(listFilesIndexes) {
    const sizeChunk = 30;

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

    let countChunk = Math.floor(maxSegmentSize / sizeChunk);
    let y = maxSegmentSize / sizeChunk;

    if ((y - countChunk) === 0) countChunk++;

    for (let i = 0; i < countChunk; i++) {
        let newObj = {};
        for (let index in obj) {
            newObj[index[obj]] = listFilesIndexes[index].splice(0, (sizeChunk + 1));
        }
        listFiles.push(newObj);
    }

    return { countChunk, listFiles };
};