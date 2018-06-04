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
 * @param {*} taskIndex - идентификатор задачи
 * @param {*} filterSettings - параметры фильтрации (могут быть как объект так и строка в формате JSON)
 * @param {*} listFiles - список файлов
 * @param {*} callback - функция обратного вызова
 */
module.exports = function({ sourceId, taskIndex, filterSettings, listFilterFiles: listFiles }, callback) {
    let { countChunk, listFilesIndexes: arrayListFilesIndexes } = transformListIndexFiles(10, listFiles);

    let wsConnection = objWebsocket[`remote_host:${sourceId}`];
    const messagePattern = {
        messageType: 'filtering',
        info: {
            processing: 'on',
            taskIndex: taskIndex,
            settings: {}
        }
    };

    let countFiles = 0;
    let folders = {};
    arrayListFilesIndexes.forEach(element => {
        for (let index in element) {
            folders[index] = [];
            countFiles += element[index].length;
        }
    });

    if (typeof filterSettings.dateTimeStart === 'undefined') {
        filterSettings = JSON.parse(filterSettings);
    }

    let dtStart = filterSettings.dateTimeStart.split(/\.|\s|:/);
    let dtEnd = filterSettings.dateTimeEnd.split(/\.|\s|:/);

    messagePattern.info.settings = {
        dateTimeStart: ((+new Date(dtStart[2], (dtStart[1] - 1), dtStart[0], dtStart[3], dtStart[4], 0)) / 1000),
        dateTimeEnd: ((+new Date(dtEnd[2], (dtEnd[1] - 1), dtEnd[0], dtEnd[3], dtEnd[4], 0)) / 1000),
        ipaddress: convertStringToArray(filterSettings.ipaddress),
        network: convertStringToArray(filterSettings.network),
        useIndexes: true,
        totalNumberFilesFilter: countFiles,
        countPartsIndexFiles: [0, countChunk],
        listFilesFilter: folders
    };

    debug(messagePattern.info.settings);

    //первое сообщение с информацией об общем количестве сегментов
    wsConnection.sendUTF(JSON.stringify(messagePattern));

    //последующие сообщения с сегментами сообщения
    for (let i = 0; i < arrayListFilesIndexes.length; i++) {
        messagePattern.info.settings = {
            countPartsIndexFiles: [(i + 1), countChunk],
            useIndexes: true,
            listFilesFilter: arrayListFilesIndexes[i]
        };

        debug(messagePattern.info.settings.countPartsIndexFiles);
        for (let dir in messagePattern.info.settings.listFilesFilter) {
            debug('---------- ' + dir + ' ------------');
            debug(messagePattern.info.settings.listFilesFilter[dir].length);
        }

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

//делим строку на элементы массива
function convertStringToArray(reqString) {
    if (reqString === null) return [];

    return (!(~reqString.indexOf(','))) ? [reqString] : reqString.split(',');
}