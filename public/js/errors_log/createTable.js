/**
 * Создание таблицы с информацией по ошибкам
 * 
 * Версия 0.1, дата релиза 24.11.2017
 */

'use strict';

import { showNotify } from '../common_helpers/showNotify';

export default function(obj) {
    let divElement = document.getElementById('field_table');
    let number = 1;
    if (obj.informationPaginate.chunksNumber !== 1) number = ((obj.informationPaginate.chunksNumber - 1) * obj.informationPaginate.maxCountElementsIndex) + 1;

    let tableHeader = '<thead><tr><th>№</th><th>дата получения ошибки</th><th>id источника</th><th>код</th><th>описание</th></thead>';

    let tableBody = '<tbody>';
    obj.informationErrors.forEach(function(item) {
        try {
            let objInform = JSON.parse(item);
            let x = (new Date()).getTimezoneOffset() * 60000;
            let dateTimeError = (new Date((+objInform.dateTime - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));

            let errorCode = (objInform.errorCode === '500') ? `<span style="color: #ef5734">${objInform.errorCode}</span>` : objInform.errorCode;

            tableBody += `<tr><td>${number++}</td><td>${dateTimeError}</td><td>${objInform.sourceId}</td>`;
            tableBody += `<td>${errorCode}</td><td>${objInform.errorMessage}</td></tr>`;
        } catch (err) {
            showNotify('warning', 'ошибка JSON парсера');
        }
    });
    tableBody += '</tbody>';

    divElement.innerHTML = '<div class="table-responsive" style="margin-left: 10px; margin-right: 10px;"><table class="table table-striped table-hover table-sm">' + tableHeader + tableBody + '</table></div>';

    let elementFieldInformation = document.getElementById('field_information');
    elementFieldInformation.innerHTML = '';
}