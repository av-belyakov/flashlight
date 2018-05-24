'use strict';

const md5js = require('md5js');

(function() {
    document.addEventListener('DOMContentLoaded', function() {
        let authForm = document.forms[0];
        if (authForm !== null) authForm.onsubmit = checkForm;

        displayError();
    });

    //вывод ошибки при неверной аутентификации
    function displayError() {
        let parametersString = window.location.search.substring(1);
        let parametrs = parametersString.split('&');
        for (let i = 0; i < parametrs.length; i++) {
            let string = parametrs[i].split('=');
            if (string[0] === 'username' && string[1] === 'error') {
                let div = document.getElementById('divAlert');
                div.style.display = '';
            }
        }
    }

    //проверка формы
    function checkForm() {
        let divLogin = document.getElementById('inputLogin').value;
        let divPassword = document.getElementById('inputPassword').value;

        if (divLogin.length === 0) return false;
        if (divPassword.length === 0) return false;
        if (!/^\w+$/.test(divLogin)) {
            let divAlert = document.getElementById('divAlert');
            divAlert.style.display = '';
            return false;
        }

        md5Hash(divPassword);
    }

    //хеширование пароля пользователя с помощью алгоритма md5
    function md5Hash(password) {
        let div = document.getElementById('inputPassword');
        div.value = md5js(password).toString();

        return true;
    }
})();