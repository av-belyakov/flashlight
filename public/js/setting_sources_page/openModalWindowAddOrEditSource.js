/**
 * Модуль формирования и открытия модального окна преднозначенного для создания
 * или редактирования источника
 * 
 * @param {*} typeWindow - тип модального окна
 * @param {*} sourceId - id источника
 * @param {*} object - объект с информацией по источнику
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */

'use strict';

import { managementIcon } from '../commons/managementIcon';

import getFormElements from './getFormElements';

export default function addEditSource(typeWindow, sourceId, object) {
    let objElements = getFormElements();
    let modalLabel = document.getElementById('myModalLabel');

    if (typeWindow === 'addSource') addSource();
    if (typeWindow === 'editSource') editSource(sourceId, object);

    //добавление источника
    function addSource() {
        for (let key in objElements) {
            objElements[key].value = '';
            if (key !== 'token') managementIcon.removeIcon(objElements[key]);
        }

        modalLabel.innerHTML = 'Добавить источник';
        modalLabel.removeAttribute('typeWindow');
        modalLabel.setAttribute('typeWindow', typeWindow);

        objElements.hostId.removeAttribute('readonly');
        objElements.countProcess.value = '5';
        objElements.token.innerHTML = '<strong style="line-height: 200%;">&nbsp;</strong>';

        $('#modalAddEditHosts').modal('show');
    }

    //редактирование источника
    function editSource(sourceId, object) {
        let objInformation = object.information || {};

        modalLabel.innerHTML = 'Редактировать источник';
        modalLabel.removeAttribute('typeWindow');
        modalLabel.setAttribute('typeWindow', typeWindow);

        objElements.hostId.value = objInformation.id;
        objElements.hostId.setAttribute('readonly', '');
        objElements.shortNameHost.value = objInformation.short_name;
        objElements.fullNameHost.value = objInformation.detailed_description;
        objElements.ipaddress.value = objInformation.ip_address;
        objElements.port.value = objInformation.port;
        objElements.countProcess.value = objInformation.max_count_process_filtering;
        objElements.token.innerHTML = `<strong style="line-height: 200%;">${objInformation.token}</strong>`;

        $('#modalAddEditHosts').modal('show');
    }
}