/*
 * Модуль удаление элемента визуализирующего ход фильтрации 
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */

'use strict';

export default function(taskIndex) {
    let divTaskIndex = document.getElementById(taskIndex);

    if (divTaskIndex === null) return;

    let parentElem = divTaskIndex.parentElement;
    parentElem.removeChild(divTaskIndex);
}