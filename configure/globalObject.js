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
 *   '<ID источника>' : {
 *    'taskIndex': <id задачи>
 *    'fileName': <имя загружаемого файла>
 *    'fileHash': <хеш файла>
 *    'fileFullSize': <полный размер файла>
 *    'fileChunkSize': <размер 1%, для подсчета % загрузки>
 *    'fileUploadedSize': <загруженный объем файла>
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
 *     'status': <'expect' и 'execute' (для фильрации), 'expect', 'in line', 'loaded' (для загрузки файлов)>
 *     'timestampStart': <дата в формате unix>
 *     'timestampModify': <дата в формате unix>
 *     'uploadInfo': {
 *         'fileSelectionType': <отметка о загрузки всех файлов или выбранных только пользователем>,
 *         'numberFilesUpload': <количество скачиваемых в задаче файлов>,
 *         'numberFilesUploaded': <количество загруженных в результате выполнения данной задачи файлов>,
 *         'numberFilesUploadedError': <количество загруженных файлов с ошибками>
 *         'numberPreviouslyDownloadedFiles': <количество файлов загруженных ранее>,
 *         'listFiles': <список файлов выбранных пользователем для скачивания>
 *     },
 *     'uploadEvents': <Event Emitter для события по загрузке сет. трафика>
 *    }}
 *
 *  потоки для записи файлов
 *   'writeStreamLinks': {
 *    'writeStreamLink'_<source_ip>_<file_name>: writeStream
 *   }
 * 
 * Версия 0.1, дата релиза 21.05.2018
 */

'use strict';

class GlobalObject {
    constructor() {
        this.obj = {
            'sources': {},
            'processingTasks': {},
            'downloadFilesTmp': {},
            'writeStreamLinks': {}
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

    _getListDownloadFiles() {
        return this.obj.downloadFilesTmp;
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

    //получить всю информацию о загружаемых с указанного ip адреса файлов
    getInformationDownloadFiles(sourceIP) {
        let listDownloadFiles = this._getListDownloadFiles();
        for (let ip in listDownloadFiles) {
            if (ip === sourceIP) return listDownloadFiles[ip];
        }

        return {};
    }

    /**
     * дабавляет данные по выбранному типу, ID группы и ключу
     * @param type тип модифицированного объекта ('sources', 'processingTasks', 'downloadFilesTmp', 'writeStreamLinks')
     * @param group группа (может быть ID задачи  или источника)
     * @param key имя устанавливаемого поля
     * @param value значение устанавливаемого поля
     * 
     * пример:
     *    globalObject.setData('processingTasks', taskIndex, {
     *        'taskType': 'upload',
     *        'sourceId': sourceId,
     *        'status': 'expect',
     *        'timestampStart': +new Date(),
     *        'timestampModify': +new Date()
     *    });
     */
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

    /**
     * модифицирует информацию по выбранному типу 
     * @param type тип модифицированного объекта ('sources', 'processingTasks', 'downloadFilesTmp', 'writeStreamLinks')
     * @param group группа (может быть ID задачи  или источника)
     * @param arrayData массив с изменяемыми данными
     * 
     * пример:
     *    globalObject.modufyData('processingType', taskIndex, [
     *          ['status', 'in line'],
     *          ['timestampModify', +new Date()]
     *     }]);
     */
    modifyData(type, group, arrayData) {
        if (this._checkKeys(type)) return false;
        if (typeof group === 'undefined') return false;

        arrayData.forEach(element => {
            if (Array.isArray(element) && (element.length === 2)) {
                this.obj[type][group][element[0]] = element[1];
            }
        });

        return true;
    }

    /**
     * увеличивает на единицу количество загруженных или количество загруженных с ошибкой файлов
     * @param taskIndex ID задачи
     * @param field имя поля значение которого нужно увеличить на единицу
     * 
     * пример: 
     *     globalObject.incrementNumberFiles(taskIndex, 'numberFilesUploaded');
     */
    incrementNumberFiles(taskIndex, field) {
        let processingTaskInfo = this.obj.processingTasks[taskIndex];

        console.log('******************** globalObject.incrementNumberFiles() *******************');
        /*        console.log(`taskIndex = ${taskIndex}, field = ${field}`);
                console.log(this.obj.processingTasks);
                console.log('typeof processingTaskInfo === \'undefined\' ' + (typeof processingTaskInfo === 'undefined'));
        */
        if (typeof processingTaskInfo === 'undefined') return false;

        //        console.log("(typeof processingTaskInfo.uploadInfo === 'undefined') " + (typeof processingTaskInfo.uploadInfo === 'undefined'));
        //        console.log("(typeof processingTaskInfo.uploadInfo[field] === 'undefined') " + (typeof processingTaskInfo.uploadInfo[field] === 'undefined'));

        if ((typeof processingTaskInfo.uploadInfo === 'undefined') || (typeof processingTaskInfo.uploadInfo[field] === 'undefined')) return false;

        //        console.log(`++++++++++++++++++++++++++++++ ` + this.obj.processingTasks[taskIndex].uploadInfo[field]);

        this.obj.processingTasks[taskIndex].uploadInfo[field]++;

        //        console.log(this.obj.processingTasks);

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