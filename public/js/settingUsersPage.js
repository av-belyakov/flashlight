'use strict';

import { showNotify } from './common_helpers/showNotify';
import { managementIcon } from './commons/managementIcon';
import getFormElements from './setting_users_page/getFormElements';
import openModalWindow from './setting_users_page/openModalWindow';
import openModalWindowAddEditUser from './setting_users_page/openModalWindowAddEditUser';

(function() {
    socket.on('notify information', function(data) {
        let obj = JSON.parse(data.notify);
        showNotify(obj.type, obj.message);

        if (obj.type === 'info') {
            setTimeout(function() {
                window.location.reload();
            }, 5000);
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        //обработчик на кнопку добавить пользователя
        (function() {
            let buttonAddUser = document.getElementById('addUserButton');
            if (buttonAddUser !== null) {
                buttonAddUser.addEventListener('click', openModalWindow.bind(null, 'addUser'));
            }
        })();

        //обработчик на кнопки редактирование информации о пользователе
        (function() {
            let editUserButtons = document.querySelectorAll('#main-content [name="editUserButton"]');
            editUserButtons.forEach((elementButton) => {
                elementButton.addEventListener('click', openModalWindow.bind(null, 'editUser'));
            });
        })();

        //обработчик на кнопки удаления пользователей
        (function() {
            let delUserButtons = document.querySelectorAll('#main-content [name="delUserButton"]');
            delUserButtons.forEach((elementButton) => {
                elementButton.addEventListener('click', openModalWindow.bind(null, 'delUser'));
            });
        })();

        //обработчик на поля ввода информации в модальном окне
        (function() {
            //проверка по регулярным выражениям
            function checkFieldRegexp(event) {
                if (event === 'undefined' || event.target === 'undefined') return;

                let elem = event.target;
                let pattern = '';
                if (elem.name === 'login') pattern = /\b^[a-zA-Z0-9]{4,}$\b/;
                if (elem.name === 'userName') pattern = /^[а-яё\s]+$/i;

                if (!pattern.test(elem.value)) managementIcon.showIcon(elem, false);
                else managementIcon.showIcon(elem, true);
            }

            //сравнение паролей
            function checkPassword() {
                let obj = getFormElements();
                let passwordOne = obj.passwordOne;
                let passwordTwo = obj.passwordTwo;
                let checkPasswordRegexp = /(?=^.{8,}$)((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/.test(passwordTwo.value);
                if (passwordOne.value !== passwordTwo.value || !checkPasswordRegexp) {
                    managementIcon.showIcon(passwordOne, false);
                    managementIcon.showIcon(passwordTwo, false);
                } else {
                    managementIcon.showIcon(passwordOne, true);
                    managementIcon.showIcon(passwordTwo, true);
                }
            }

            document.querySelector('#modalAddEditUser [name="login"]').addEventListener('change', checkFieldRegexp);
            document.querySelector('#modalAddEditUser [name="userName"]').addEventListener('change', checkFieldRegexp);

            document.getElementById('passwordTwo').addEventListener('change', checkPassword);
        })();

        //обработчик на кнопку 'отправить' для модального окна
        (function() {
            let submitElementModalWindow = document.querySelector('#modalAddEditUser [type="submit"]');
            submitElementModalWindow.addEventListener('click', openModalWindowAddEditUser);
        })();

        //обработчик на кнопку 'удалить' модального окна подтверждения удаления
        (function() {
            document.querySelector('#modalDelete .btn-primary').addEventListener('click', () => {
                let login = document.querySelector('#modalDelete strong').innerHTML;

                socket.emit('delete user', { processingType: 'deleteUser', login: login });
                $('#modalDelete').modal('hide');
            });
        })();
    });
})();