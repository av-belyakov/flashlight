/**
 * Модуль вызова модального окна для добавления пользователя
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */

'use strict';

const md5js = require('md5js');

import getFormElements from './getFormElements';

export default function openModalWindowAddEditUser() {
    let obj = getFormElements();
    let arrayElement = [
        obj.login,
        obj.passwordOne,
        obj.passwordTwo,
        obj.userName
    ];

    let processingTrigger = arrayElement.every(function(elem) {
        if (elem.value.length === 0) return false;
        else return true;
    });

    let loginIsTrue = /\b^[a-zA-Z0-9]{4,}$\b/.test(obj.login.value);
    let userNameIsTrue = /^[а-яё\s]+$/i.test(obj.userName.value);
    let checkPassword = obj.passwordOne.value === obj.passwordTwo.value;
    let checkPasswordRegexp = /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(obj.passwordTwo.value);

    if (processingTrigger && checkPassword && checkPasswordRegexp) {
        if (loginIsTrue && userNameIsTrue) {
            let objInformationUser = createObjInformationUser();

            socket.emit('add or edit user', objInformationUser);
            $('#modalAddEditUser').modal('hide');
        }
    }

    //формирование объекта с информацией о пользователе
    function createObjInformationUser() {
        let obj = getFormElements();
        let myModalLabel = document.getElementById('myModalLabel').getAttribute('data-type-window');
        let selectElem = document.getElementsByName('itemGroups')[0];
        let typeModal = (myModalLabel === 'add') ? 'create' : 'edit';

        return {
            actionType: typeModal,
            login: obj.login.value,
            group: selectElem.options[selectElem.options.selectedIndex].value,
            userName: obj.userName.value,
            password: md5js(obj.passwordTwo.value).toString()
        };
    }

}