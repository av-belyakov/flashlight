/**
 * Функция выполняющая сортировку
 * 
 * Версия 0.1, дата релиза 27.11.2017
 */

'use strict';

export default function sortColumns(event) {
    //изменяем иконку
    let sortOrder = changeIcon();
    let numberElement = event.target.dataset.elementOrder;

    let tableBody = document.getElementById('field_table').firstElementChild.firstElementChild.children[1];
    let trElements = tableBody.querySelectorAll('tr');

    let newTableBody = '';
    let arraySort = [];
    trElements.forEach(function(item) {
        arraySort.push({
            id: item.children[+numberElement].innerText,
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