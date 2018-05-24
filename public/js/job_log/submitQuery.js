/**
 * Подготовка и отправка поискового запроса
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */

'use strict';

import { showNotify } from '../common_helpers/showNotify';

export default function submitQuery() {
    let arrayChoiceQuerySelector = [];

    let divDateTimeStart = document.getElementById('dateTimeStart');
    let dateTimeStart = divDateTimeStart.firstElementChild.value;

    let divDateTimeEnd = document.getElementById('dateTimeEnd');
    let dateTimeEnd = divDateTimeEnd.firstElementChild.value;

    let divSelect = document.querySelector('.chosen-select');
    let arrayOptions = divSelect.options;

    for (let i = 0; i < arrayOptions.length; i++) {
        if (arrayOptions[i].selected === true) {
            arrayChoiceQuerySelector.push(arrayOptions[i].value);
        }
    }

    let dateTimeIsEmpty = ((dateTimeStart.length === 0) || (dateTimeEnd.length === 0));

    if (dateTimeIsEmpty && (arrayChoiceQuerySelector.length === 0)) {
        return showNotify('warning', 'не задан ни один из параметров поиска');
    }
    socket.emit('search all tasks index', {
        dateTimeStart: dateTimeStart,
        dateTimeEnd: dateTimeEnd,
        querySelector: arrayChoiceQuerySelector
    });

    document.getElementById('field_table').innerHTML = '<div class="col-md-12 text-center" style="margin-top: 30px;"><img src="/public/images/img_search_1.gif"></div>';
    document.getElementById('field_pagination').innerHTML = '';
}