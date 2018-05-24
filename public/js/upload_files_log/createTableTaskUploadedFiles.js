/**
 * Создание таблицы с информацией о задачах файлы по которым были загружены
 * 
 * Версия 0.1, дата релиза 28.11.2017
 */

'use strict';

import processPagination from '../commons/processPagination';
import openModalWindowDelete from './openModalWindowDelete';

export default function createTableTaskUploadedFiles(objData) {
    function getStringFileSize(integer) {
        let fileSize = integer + '';
        if (fileSize.length <= 3) {
            return fileSize + ' байт';
        } else if (fileSize.length > 3 && 6 >= fileSize.length) {
            return (fileSize / 1000).toFixed(2) + ' Кбайт';
        } else if (fileSize.length > 6 && 9 >= fileSize.length) {
            return (fileSize / 1000000).toFixed(2) + ' Мбайт';
        } else if (fileSize.length > 9 && 12 >= fileSize.length) {
            return (fileSize / 1000000000).toFixed(2) + ' Гбайт';
        } else {
            return fileSize;
        }
    }

    let disabledDelete;
    if (document.getElementById('dataAccessRights') !== null) {
        let deleteAccessRights = document.getElementById('dataAccessRights').dataset.accessRights;
        disabledDelete = (deleteAccessRights === 'delete=false') ? 'disabled="disabled"' : '';
    }

    let informationTaskIndex = objData.informationTaskIndex;

    let number = (objData.informationPaginate.chunksNumber !== 1) ? (((objData.informationPaginate.chunksNumber - 1) * objData.informationPaginate.maxCountElementsIndex) + 1) : 1;

    let divElement = document.getElementById('field_table');

    let tableHeader = '<thead><tr><th>№</th><th class="text-left">дата выгрузки файлов</th><th class="text-right">id источника</th><th class="text-left">название источника</th>';
    tableHeader += '<th class="text-right">файлов выгруженно</th><th class="text-right">объем файлов</th><th class="text-left">пользователь</th><th></th></tr></thead>';

    let tableBody = '<tbody>';
    let tableBodyButton = '';

    for (let taskIndex in informationTaskIndex) {
        let x = (new Date()).getTimezoneOffset() * 60000;
        let dateTimeStartUploadFiles = (new Date((+informationTaskIndex[taskIndex].dateTimeStartUploadFiles - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));

        let textSettings;
        try {
            let filterSettings = JSON.parse(informationTaskIndex[taskIndex].filterSettings);

            let dateTimeStart = (filterSettings.dateTimeStart === null) ? '' : filterSettings.dateTimeStart;
            let dateTimeEnd = (filterSettings.dateTimeEnd === null) ? '' : filterSettings.dateTimeEnd;

            textSettings = `Временной интервал с ${dateTimeStart} по ${dateTimeEnd}`;
            textSettings += (filterSettings.ipaddress === null) ? '' : ', IP-адреса: ' + filterSettings.ipaddress.replace(/,/g, ', ');
            textSettings += (filterSettings.network === null) ? '' : ', диапазоны подсетей: ' + filterSettings.network;
        } catch (err) {
            textSettings = '';
        }
        tableBodyButton += `<tr id="task_${taskIndex}" data-toggle="tooltip" title="${textSettings}">`;
        tableBodyButton += `<td style="padding-top: 15px;">${number++}</td>`;
        tableBodyButton += `<td class="text-left" style="padding-top: 15px;">${dateTimeStartUploadFiles}</td>`;
        tableBodyButton += `<td class="text-right" style="padding-top: 15px;">${informationTaskIndex[taskIndex].sourceId}</td>`;
        tableBodyButton += `<td class="text-left" style="padding-top: 15px;">${informationTaskIndex[taskIndex].shortName}</td>`;
        tableBodyButton += `<td class="text-right" style="padding-top: 15px;">${informationTaskIndex[taskIndex].countFilesLoaded}</td>`;
        tableBodyButton += `<td class="text-right" style="padding-top: 15px;">${getStringFileSize(informationTaskIndex[taskIndex].countFoundFilesSize)}</td>`;
        tableBodyButton += `<td class="text-left" style="padding-top: 15px;">${informationTaskIndex[taskIndex].userNameStartUploadFiles}</td>`;
        tableBodyButton += '<td class="text-right">';
        tableBodyButton += '<button type="button" class="btn btn-default btn-sm" title="полная информация о выгруженных файлах"><span class="glyphicon glyphicon-info-sign"></span></button>';
        tableBodyButton += `<button type="button" class="btn btn-default btn-sm" ${disabledDelete} title="удаление"><span class="glyphicon glyphicon-trash"></span></button>`;
        tableBodyButton += '</td></tr>';
    }

    tableBody += tableBodyButton + '</tbody>';

    divElement.innerHTML = '<div class="table-responsive" style="margin-left: 10px; margin-right: 10px;"><table class="table table-striped table-hover table-sm">' + tableHeader + tableBody + '</table></div>';

    //обработчик на запрос удаления информации
    (function() {
        let buttonTrash = document.querySelectorAll('.glyphicon-trash');
        for (let i = 0; i < buttonTrash.length; i++) {
            let taskIndex = buttonTrash[i].parentElement.parentElement.parentElement.getAttribute('id').split('_')[1];
            buttonTrash[i].parentElement.addEventListener('click', openModalWindowDelete.bind(null, taskIndex));
        }
    })();

    //обработчик на получение всех данных
    (function() {
        let buttonTrash = document.querySelectorAll('.glyphicon-info-sign');
        for (let i = 0; i < buttonTrash.length; i++) {
            let taskIndex = buttonTrash[i].parentElement.parentElement.parentElement.getAttribute('id').split('_')[1];
            buttonTrash[i].parentElement.addEventListener('click', (function(taskIndex) {
                socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
            }).bind(null, taskIndex));
        }
    })();

    $('[data-toggle="tooltip"]').tooltip();

    divElement.previousElementSibling.innerHTML = `всего задач найдено:<strong> ${objData.informationPaginate.countElements}</strong>`;
}