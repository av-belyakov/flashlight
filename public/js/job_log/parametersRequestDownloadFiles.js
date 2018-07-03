/**
 * Шаблон для формирования запроса на скачивание файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */

'use strict';

export default class ParametersRequestDownloadFiles {
    constructor(id) {
        this.id = id;
    }

    getElementId() {
        let element = document.getElementById(this.id);

        return (element !== null) ? element : false;
    }

    getDataSet(dataSetName) {
        let element = this.getElementId();
        if (!element || (element.dataset === null)) return '';

        let targetValue = element.dataset[dataSetName];

        if (targetValue === null) return '';

        return targetValue;
    }

    getObjectData(listName) {
        let objResult = {};
        listName.forEach(element => {
            objResult[element] = this.getDataSet(element);
        });

        return objResult;
    }
}