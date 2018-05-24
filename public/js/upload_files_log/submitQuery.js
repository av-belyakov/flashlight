/**
 * Подготовка и отправка поискового запроса
 * 
 * Версия 0.1, дата релиза 27.11.2017
 */

'use strict';

import { showNotify } from '../common_helpers/showNotify';

export default function submitQuery(globalObj) {
    let arraySourceIdUserName = [];
    let arrayInputFieldIpAddress = [];
    let checkBoxChecked = {};

    let divDateTimeStart = document.getElementById('dateTimeStart');
    let dateTimeStart = divDateTimeStart.firstElementChild.value;

    let divDateTimeEnd = document.getElementById('dateTimeEnd');
    let dateTimeEnd = divDateTimeEnd.firstElementChild.value;

    let arrayNameChecked = [
        'checkboxEvent',
        'checkboxFiltering',
        'checkboxUploaded'
    ];

    for (let i = 0; i < arrayNameChecked.length; i++) {
        checkBoxChecked[arrayNameChecked[i]] = document.querySelector('#' + arrayNameChecked[i] + ' > label > div > input').checked;
    }

    checkBoxChecked.checkboxIpOrNetwork = document.querySelector('#checkboxIpOrNetwork > div > input').checked;

    //идентификаторы источников и имена пользователей
    let arrayOptionsSourceIdOrUser = document.querySelector('.chosen-select').options;
    for (let i = 0; i < arrayOptionsSourceIdOrUser.length; i++) {
        if (arrayOptionsSourceIdOrUser[i].selected === true) {
            arraySourceIdUserName.push(arrayOptionsSourceIdOrUser[i].value);
        }
    }

    //ip-адреса
    let listInputFieldIpAddress = document.querySelectorAll('.tokenfield > .token > span');
    for (let i = 0; i < listInputFieldIpAddress.length; i++) {
        arrayInputFieldIpAddress.push(listInputFieldIpAddress[i].textContent);
    }

    let dateTimeIsEmpty = ((dateTimeStart.length === 0) || (dateTimeEnd.length === 0));

    if (dateTimeIsEmpty && (arraySourceIdUserName.length === 0) && (arrayInputFieldIpAddress.length === 0)) {
        return showNotify('warning', 'не задан ни один из параметров поиска');
    }

    socket.emit('search all information for uploaded files', {
        'dateTimeStart': dateTimeStart,
        'dateTimeEnd': dateTimeEnd,
        'querySelectorSourceIdUserName': arraySourceIdUserName,
        'querySelectorInputFieldIpAddress': arrayInputFieldIpAddress,
        'checkbox': checkBoxChecked
    });

    globalObj.setTimeoutImg = setTimeout(function() {
        document.getElementById('field_table').innerHTML = '<div class="col-md-12 text-center" style="margin-top: 30px;"><img src="/public/images/img_search_1.gif"></div>';
    }, 1000);

    document.getElementById('field_pagination').innerHTML = '';
}