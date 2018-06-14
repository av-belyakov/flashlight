/* 
 * Глобальный объект для промежуточного хрнения данных
 * содержит:
 *
 * структура объектов
 *  список источников и их статус 
 *   'sources' : { 
 *    '<ID источника>' : {
 *     'connectionStatus': <connect/>disconnect>,
 *     'shortName': <краткое название>
 *     'detailedDescription': <полное название>
 *     'ipaddress': <адрес>
 *     'port': <порт>
 *     'dateLastConnected': <дата последнего соединения>
 *     'wasThereConnectionBreak': <был ли разрыв соединения>
 *     'numberConnectionAttempts': <количество попыток соединения>
 *     'token': <идентификационный токен>
 *     'maxCountProcessFiltering': <максимальное количество одновременно запузщенных задач фильтрации> 
 *  }}
 *
 *  загружаемые файлы
 *   'downloadFilesTmp' : { 
 *   '<ip_адрес>' : {
 *    'taskIndex': <id задачи>
 *    'fileName': <имя загружаемого файла>
 *    'fileFullSize': <полный размер файла>
 *    'fileChunkSize': <размер 1%, для подсчета % загрузки>
 *    'fileUploadedSize': <загруженный размер файла>
 *    'fileSizeTmp': <временный размер файла>
 *    'fileUploadedPercent': <объем загруженного файла в %>
 *    'uploadDirectoryFiles': <директория для сохранения файлов>
 *   }}
 *
 *  выполняемые задачи
 *   'processingTasks': {
 *    '<tasksIndex>': {
 *     'taskType': <filtering'/'upload>
 *     'sourceId': <идентификатор источника>
 *     'status': <expect' и 'execute' (для фильрации), 'expect', 'in line', 'loaded' (для загрузки файлов)>
 *     'timestampStart': <дата в формате unix>
 *     'timestampModify': <дата в формате unix>
 *    }}
 *
 * Версия 0.1, дата релиза 21.05.2018
 */

'use strict';

class GlobalObject {
    constructor() {
        this.obj = {
            'sources': {},
            'processingTasks': {},
            'downloadFilesTmp': {}
        };
    }

    _checkKeys(type) {
        if (type === null) return true;
        if (typeof this.obj[type] === 'undefined') return true;

        return false;
    }


    _getDataTask(taskType) {
        let processingTasks = this.getData('processingTasks');
        let objResult = {};

        for (let taskIndex in processingTasks) {
            if (processingTasks[taskIndex].taskType !== taskType) continue;

            objResult[taskIndex] = processingTasks[taskIndex];
        }

        return objResult;
    }

    //получить данные по выбранному типу, ID группы и ключу
    getData(type, group = null, key = null) {
        if (this._checkKeys(type)) return null;
        if (group === null) return this.obj[type];
        if (key === null) return this.obj[type][group];
        if (typeof this.obj[type][group][key] === 'undefined') return null;

        return this.obj[type][group][key];
    }

    //получить все выполняемые задачи по фильтрации 
    getDataTaskFilter() {
        return this._getDataTask('filtering');
    }

    //получить все выполняемые задачи по выгрузки файлов
    getDataTaskDownloadFiles() {
        return this._getDataTask('upload');
    }

    //дабавить данные по выбранному типу, ID группы и ключу
    setData(type, group, key = null, value = null) {
        if (this._checkKeys(type)) return false;
        if (typeof group === 'undefined') return false;
        if (key === null) return false;

        if ((value === null) && (typeof key === 'object')) {
            this.obj[type][group] = key;
            return true;
        }

        this.obj[type][group][key] = value;
        return true;
    }

    //удалить данные по выбранному типу и ID группы
    deleteData(type, group) {
        if (this._checkKeys(type)) return false;

        delete this.obj[type][group];
        return true;
    }
}


let objectGlobal;

module.exports = createObject();

function createObject() {
    if (objectGlobal instanceof GlobalObject) return objectGlobal;

    objectGlobal = new GlobalObject();
    return objectGlobal;
}