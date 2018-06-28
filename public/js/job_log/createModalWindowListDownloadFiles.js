/**
 * Создание модального окна содержащего информацию по найденным, в результате
 * фильтрации, файлам 
 * 
 * Версия 0.1, дата релиза 28.06.2018
 */

'use strict';

import { helpers } from '../common_helpers/helpers';

export default function createModalWindow(objData) {
    if (objData.information.length === 0) return;

    let modalTitle = document.querySelector('#modalLabelListDownloadFiles .modal-title');
    modalTitle.innerHTML = `Источник №${objData.sourceId} (${objData.shortName}), ${objData.detailedDescription}`;
    modalTitle.style.textAlign = 'center';

    document.getElementById('field_table').innerHTML = createTable(objData.information);

    //обработчик на кнопки сортировки
    (function() {
        let elementsByName = document.getElementsByName('sortColumns');
        elementsByName.forEach(function(item) {
            item.addEventListener('click', sortColumns);
        });
    })();

    $('#modalListDownloadFiles').modal('show');
}

function createTable(data) {
    let objFileDownload = {
        'true': ['загружен', '#2baf2b'],
        'false': ['не выгружался', '#ef5734']
    };

    let table = `<div class="table-responsive" style="margin-left: 10px; margin-right: 10px;">
        <table class="table table-striped table-hover table-sm">
            <thead>
                <tr>
                <th class="text-center">№&nbsp;<span class="glyphicon glyphicon-triangle-bottom" name="sortColumns" style="cursor: pointer" data-element-order="0"></span></th>
                <th class="text-left">имя файла&nbsp;<span class="glyphicon glyphicon-triangle-bottom" name="sortColumns" style="cursor: pointer" data-element-order="1"></span></th>
                <th class="text-right">размер (в байтах)&nbsp;<span class="glyphicon glyphicon-triangle-bottom" name="sortColumns" style="cursor: pointer" data-element-order="2"></span></th>
                <th class="text-left">фаил загружен&nbsp;<span class="glyphicon glyphicon-triangle-bottom" name="sortColumns" style="cursor: pointer" data-element-order="3"></span></th>
                <th></th>
                </tr>
            </thead>
            <tbody>`;

    let serialNumber = 0;
    for (let fn in data) {
        let fd, isChecked = '';
        if (data[fn].fileDownloaded) {
            fd = objFileDownload['true'];
        } else {
            fd = objFileDownload['false'];
            isChecked = `<input type="checkbox" name="checkbox_setFileDownload" data-file-name="${fn}" value="false">`;
        }

        table += `<tr data-toggle="tooltip">
            <td class="text-center" style="padding-top: 15px;">${++serialNumber}</td>
            <td class="text-left" style="padding-top: 15px;">${fn}</td>
            <td class="text-right" style="padding-top: 15px;" data-file-size="${data[fn].fileSize}">${helpers.intConvert(data[fn].fileSize)}</td>
            <td class="text-left" style="padding-top: 15px;"><span style="color: ${fd[1]}">${fd[0]}</span></td>
            <td class="text-right">${isChecked}</td>
            </tr>`;
    }

    table += `</tbody>
        </table>
        </div>`;

    return table;
}

function sortColumns(event) {
    //изменяем иконку
    let sortOrder = changeIcon();
    let numberElement = event.target.dataset.elementOrder;

    let tableBody = document.getElementById('field_table').firstElementChild.firstElementChild.children[1];
    let trElements = tableBody.querySelectorAll('tr');

    let newTableBody = '';
    let arraySort = [];
    trElements.forEach(function(item) {
        let valueID = item.children[+numberElement].innerText;

        if (+numberElement === 0) {
            valueID = Number(item.children[+numberElement].innerText);
        } else if (+numberElement === 2) {
            valueID = Number(item.children[+numberElement].dataset.fileSize);
        }

        arraySort.push({
            id: valueID,
            value: item.outerHTML
        });
    });

    arraySort.sort(compare);
    if (!sortOrder) arraySort.reverse();

    //формируем новое тело таблицы
    arraySort.forEach(function(item) {
        newTableBody += item.value.toString();
    });

    tableBody.innerHTML = newTableBody;

    $('[data-toggle="tooltip"]').tooltip();

    function changeIcon() {
        let elementSpan = event.target;
        let sortIn = elementSpan.classList.contains('glyphicon-triangle-bottom');

        if (sortIn) {
            elementSpan.classList.remove('glyphicon-triangle-bottom');
            elementSpan.classList.add('glyphicon-triangle-top');
        } else {
            elementSpan.classList.remove('glyphicon-triangle-top');
            elementSpan.classList.add('glyphicon-triangle-bottom');
        }
        return sortIn;
    }

    function compare(a, b) {
        if (a.id < b.id) return -1;
        if (a.id > b.id) return 1;
        return 0;
    }
}