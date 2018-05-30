/**
 * Модуль для передачи информации о файлах которые необходимо отфильтровать
 * выбранному источнику, для коммуникации применяется протокол websocket
 * 
 * Версия 0.1, дата релиза 29.05.2018
 */

'use strict';

const debug = require('debug')('routingRequestFilterFiles');
const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');

/**
 * 
 * @param {*} sourceId - идентификатор источника
 * @param {*} data - передаваемые данные
 * @param {*} callback
 */
module.exports = function({ sourceId, taskIndex, listFilterFiles: listFiles }, callback) {
    let { countChunk, listFilesIndexes: arrayListFilesIndexes } = transformListIndexFiles(10, listFiles);

    let wsConnection = objWebsocket['remote_host:' + sourceId];
    const messagePattern = {
        messageType: 'filtering',
        info: {
            processing: 'on',
            taskIndex: taskIndex,
            settings: {}
        }
    };

    let countFiles = {};
    arrayListFilesIndexes.forEach(element => {
        for (let index in element) {
            if (index in countFiles) {
                countFiles[index] += element[index].length;
            } else {
                countFiles[index] = element[index].length;
            }
        }
    });

    messagePattern.info.settings = {
        countPartsIndexFiles: [0, countChunk],
        useIndexes: true,
        listFilesFilter: countFiles
    };

    //первое сообщение с информацией об общем количестве сегментов
    wsConnection.sendUTF(JSON.stringify(messagePattern));

    //последующие сообщения с сегментами сообщения
    for (let i = 0; i < arrayListFilesIndexes.length; i++) {
        messagePattern.info.settings = {
            countPartsIndexFiles: [(i + 1), countChunk],
            useIndexes: true,
            listFilesFilter: arrayListFilesIndexes[i]
        };

        wsConnection.sendUTF(JSON.stringify(messagePattern));
    }

    //добавляем информацию о задаче в глобальный объект
    globalObject.setData('processingTasks', taskIndex, {
        'taskType': 'filtering',
        'sourceId': sourceId,
        'status': 'execute',
        'timestampStart': +new Date(),
        'timestampModify': +new Date()
    });

    callback(null);
};

//делим списки файлов на фрагменты и считаем их количество
function transformListIndexFiles(sizeChunk, listFiles) {
    let maxSegmentSize = 0;
    let listFilesIndexes = [];
    let obj = {};

    let getObjectListFiles = () => {
        let newObj = {};

        for (let index in obj) {
            newObj[obj[index]] = listFiles[index].splice(0, sizeChunk);
        }

        return newObj;
    };

    for (let key in listFiles) {
        if (!~key.indexOf(':')) continue;

        let tmp = key.split(':');

        if (tmp.length < 4) continue;

        if (maxSegmentSize < listFiles[key].length) maxSegmentSize = listFiles[key].length;
        obj[key] = tmp[3];
    }

    let countChunk = Math.floor(maxSegmentSize / sizeChunk);
    let y = maxSegmentSize / sizeChunk;

    if ((y - countChunk) !== 0) countChunk++;

    if (countChunk === 0) {
        listFilesIndexes.push(getObjectListFiles());
    } else {
        for (let i = 0; i < countChunk; i++) {
            listFilesIndexes.push(getObjectListFiles());
        }
    }

    return { countChunk, listFilesIndexes };
}