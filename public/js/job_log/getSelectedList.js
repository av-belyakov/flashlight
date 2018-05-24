/**
 * Посторение выподающего списка
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */

'use strict';

import submitQuery from './submitQuery';

export default function getSelectedList(obj) {
    let divSelectList = document.getElementById('selectList');
    let objName = {
        'statusFilter': 'СТАТУС ЗАДАЧИ',
        'statusImport': 'СТАТУС ИМПОРТА',
        'users': 'ПОЛЬЗОВАТЕЛИ',
        'sourceIndex': 'ИСТОЧНИКИ'
    };

    let selectInput = '<select data-placeholder="параметры поиска" style="display: none;" class="chosen-select" multiple="" tabindex="-1"><option value=""></option>';
    for (let type in obj) {
        selectInput += `<optgroup label="${objName[type]}">`;
        for (let item in obj[type]) {
            if (type === 'sourceIndex') selectInput += `<option value="${type}:${item}">${item} ${obj[type][item]}</option>`;
            else selectInput += `<option value="${type}:${item}">${obj[type][item]}</option>`;
        }
        selectInput += '</optgroup>';
    }
    selectInput += '</select> <button type="submit" class="btn btn-primary" id="buttonSearch">Поиск</button></div></div>';
    divSelectList.innerHTML = selectInput;

    let buttonSearch = document.getElementById('buttonSearch');
    buttonSearch.onclick = submitQuery;
}