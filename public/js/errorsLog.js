'use strict';

require('chosen-js');

import submitQuery from './errors_log/submitQuery';
import createTable from './errors_log/createTable';
import createPaginate from './errors_log/createPaginate';

(function() {
    //пользователь не авторизован
    socket.on('error authentication user', function(data) {
        window.location.reload();
    });

    socket.on('found all errors', function(data) {
        if (!data.hasOwnProperty('informationErrors')) return;
        if (!data.hasOwnProperty('informationPaginate')) return;

        if (data.informationErrors.length === 0) {
            document.getElementById('field_table').innerHTML = '';
            document.getElementById('field_information').innerHTML = '<div class="text-center"><h4 class="text-uppercase" style="margin-top: 70px; margin-bottom: 10px; color: #ef5734">нет данных</h4></div>';
            return;
        }

        //формируем таблицу с данными
        createTable(data);

        //формируем пагинатор
        createPaginate(data.informationPaginate);
    });

    socket.on('show new page errors', function(data) {
        createTable(data);
    });

    document.addEventListener('DOMContentLoaded', function() {
        //обработчик на кнопку 'Поиск'
        (function() {
            let buttonSearch = document.getElementById('buttonSearch');
            if (typeof buttonSearch !== 'undefined') buttonSearch.addEventListener('click', submitQuery);
        })();

        $('.chosen-select').chosen({ width: '450px' });

        $(function() {
            $('#dateTimeStart').datetimepicker({
                locale: 'ru'
            });

            $('#dateTimeEnd').datetimepicker({
                locale: 'ru'
            });
        });

        (function() {
            let elementChosenSingle = document.getElementsByClassName('chosen-single')[0];
            elementChosenSingle.style.height = '35px';
            elementChosenSingle.children[0].style.marginTop = '4px';
            elementChosenSingle.children[1].style.marginTop = '4px';
            elementChosenSingle.children[0].style.fontSize = '14px';
        })();
    });
})();