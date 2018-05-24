/*
 * Модуль проверки изменения пароля администратора
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */

'use strict';

export default function() {
    let elemSpanIconOne = document.getElementById('iconSuccessOne');
    let elemSpanIconTwo = document.getElementById('iconSuccessTwo');

    let parentNodeOne = elemSpanIconOne.parentNode;
    let parentNodeTwo = elemSpanIconTwo.parentNode;

    let inputPasswordOne = document.getElementById('inputPasswordOne');
    let inputPasswordTwo = document.getElementById('inputPasswordTwo');

    function throwError() {
        elemSpanIconOne.classList.add('glyphicon-remove');
        parentNodeOne.classList.add('has-error');
        elemSpanIconOne.classList.remove('glyphicon-ok');
        parentNodeOne.classList.remove('has-success');

        elemSpanIconTwo.classList.add('glyphicon-remove');
        parentNodeTwo.classList.add('has-error');
        elemSpanIconTwo.classList.remove('glyphicon-ok');
        parentNodeTwo.classList.remove('has-success');

        return false;
    }

    if (inputPasswordOne.value.length === 0) return throwError();

    if (inputPasswordTwo.value.length === 0) return throwError();

    if (inputPasswordOne.value !== inputPasswordTwo.value) return throwError();

    return true;
}