/**
 * Модуль формирующий и показывающий модальное окно с полной информацией 
 * по источнику
 * 
 * @param {*} sourceId - id источника
 * @param {*} object - объект с основной информацией
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */

'use strict';

export default function showAllInformation(sourceId, object) {
    //заголовок модального окна
    document.querySelector('#modalShowRemoteHosts .modal-title').innerHTML = 'Подробная информация об источнике №' + sourceId;
    //очищаем модальное окно
    document.querySelector('#modalShowRemoteHosts .modal-body').innerHTML = '';
    let objSettings = {
        'short_name': ['Название', false],
        'detailed_description': ['Описание', false],
        'ip_address': ['IP-адрес', false],
        'port': ['Порт', false],
        'date_create': ['Дата добавления', true],
        'date_changes': ['Дата изменения', true],
        'date_last_connected': ['Дата последнего соединения', true],
        'number_connection_attempts': ['Количество попыток соединения', false],
        'token': ['Идентификационный токен', false],
        'max_count_process_filtering': ['Количество заданий на фильтрацию', false]
    };

    let x = (new Date()).getTimezoneOffset() * 60000;

    let container = document.createElement('div');
    container.classList.add('container-fluid');

    let divRow = document.createElement('div');
    divRow.classList.add('row');

    let divCol = document.createElement('div');
    divCol.classList.add('col-sm-6');
    divCol.classList.add('col-md-6');
    divCol.classList.add('col-lg-6');
    divCol.setAttribute('style', 'margin-top: 5px;');

    let divClearfix = document.createElement('div');
    divClearfix.classList.add('clearfix');

    for (let key in objSettings) {
        let newDivClearfix = divClearfix.cloneNode(false);
        let divName = divCol.cloneNode(false);
        divName.classList.add('text-right', 'strong');
        divName.innerHTML = `<strong>${objSettings[key][0]}</strong>`;
        divRow.appendChild(divName);

        let divValue = divCol.cloneNode(false);
        divValue.classList.add('text-left');
        let value = object.information[key];
        if (objSettings[key][1] === true) {
            value = (+object.information[key] === 0) ? 'дата не определена' : (new Date((+object.information[key]) - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
        }
        divValue.appendChild(document.createTextNode(value));
        divRow.appendChild(divValue);

        divRow.appendChild(newDivClearfix);
    }
    container.appendChild(divRow);

    document.querySelector('#modalShowRemoteHosts .modal-body').appendChild(container);
    $('#modalShowRemoteHosts').modal('show');
}