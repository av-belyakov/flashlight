'use strict';

import { showNotify } from '../common_helpers/showNotify';

export default function() {
    let divDateTimeStart = document.getElementById('dateTimeStart');
    let dateTimeStart = divDateTimeStart.firstElementChild.value;

    let divDateTimeEnd = document.getElementById('dateTimeEnd');
    let dateTimeEnd = divDateTimeEnd.firstElementChild.value;

    let divSelect = document.querySelector('.chosen-select');

    let selectIndexValue = divSelect.options[divSelect.options.selectedIndex].value;
    let dateTimeIsEmpty = ((dateTimeStart.length === 0) || (dateTimeEnd.length === 0));

    if (dateTimeIsEmpty && selectIndexValue === '') {
        return showNotify('warning', 'не задан ни один из параметров поиска');
    }

    socket.emit('search all errors sources', {
        dateTimeStart: dateTimeStart,
        dateTimeEnd: dateTimeEnd,
        selectorSources: selectIndexValue
    });

    document.getElementById('field_table').innerHTML = '<div class="col-md-12 text-center" style="margin-top: 30px; margin-bottom: 10px;"><img src="/public/images/img_search_1.gif"></div>';
    document.getElementById('field_pagination').innerHTML = '';
}