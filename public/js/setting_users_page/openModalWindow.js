/**
 * Модуль формирования и открытия модального окна
 * 
 * @param {тип окна} typeWindow 
 * @param {элемент источник события} event 
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */

'use strict';

import { managementIcon } from '../commons/managementIcon';
import getFormElements from './getFormElements';

export default function openModalWindow(typeWindow, event) {
    let obj = getFormElements();

    //чистим поле password
    obj.passwordOne.value = '';
    obj.passwordTwo.value = '';

    //убираем значки успешного и неуспешного ввода
    for (let key in obj) {
        managementIcon.removeIcon(obj[key]);
    }

    let arraySelectOptions = document.querySelectorAll('option');
    arraySelectOptions[0].parentNode.removeAttribute('disabled');

    //сформировать список
    function setSelected(group) {
        for (let i = 0; i < arraySelectOptions.length; i++) {
            arraySelectOptions[i].removeAttribute('selected');
            if (arraySelectOptions[i].value === group) arraySelectOptions[i].setAttribute('selected', '');
        }
    }

    let myModalLabel = document.getElementById('myModalLabel');
    if (typeWindow === 'addUser') {
        myModalLabel.innerText = 'Добавить пользователя';
        myModalLabel.setAttribute('data-type-window', 'add');
        obj.login.value = '';
        obj.login.removeAttribute('readonly');
        obj.userName.value = '';
        setSelected('administrator');

        $('#modalAddEditUser').modal('show');
    } else {
        let userInformation = (function(elem) {
            if (elem.target.tagName === 'BUTTON' && elem.target.dataset.userInformation !== 'undefined') {
                return elem.target.dataset.userInformation;
            }
            let currentElement = elem.target;
            while (currentElement !== null) {
                if (currentElement !== 'undefined' &&
                    currentElement.tagName === 'BUTTON' &&
                    currentElement.dataset.userInformation !== 'undefined') {
                    return currentElement.dataset.userInformation;
                }
                currentElement = currentElement.parentElement;
            }
        })(event);

        if (typeWindow === 'editUser') {
            let [login, group, userName] = userInformation.split('|');

            myModalLabel.innerText = 'Редактировать информацию о пользователе';
            myModalLabel.setAttribute('data-type-window', 'edit');
            obj.login.value = login;
            obj.login.setAttribute('readonly', '');
            obj.userName.value = userName;

            //для администратора возможность изменения группы выключена
            if (login === 'administrator') {
                arraySelectOptions[0].parentNode.setAttribute('disabled', 'disabled');
            }
            setSelected(group);

            $('#modalAddEditUser').modal('show');
        }
        if (typeWindow === 'delUser') {
            let login = userInformation;
            document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
            let modalBody = document.querySelector('#modalDelete .modal-body');
            modalBody.innerHTML = `<p>Действительно удалить пользователя <strong>${login}</strong>?</p>`;

            $('#modalDelete').modal('show');
        }
    }
}