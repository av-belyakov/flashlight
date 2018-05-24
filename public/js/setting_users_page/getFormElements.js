/**
 * Объект с элементами формы
 */

'use strict';

export default function getFormElements() {
    return {
        login: document.getElementsByName('login')[0],
        passwordOne: document.getElementById('passwordOne'),
        passwordTwo: document.getElementById('passwordTwo'),
        userName: document.getElementsByName('userName')[0]
    };
}