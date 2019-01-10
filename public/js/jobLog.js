'use strict';

require('chosen-js');

import { showNotify } from './common_helpers/showNotify';
import common from './common';
import submitQuery from './job_log/submitQuery';
import getSelectList from './job_log/getSelectedList';
import processPagination from './commons/processPagination';
import changeObjectStatus from './job_log/changeObjectStatus';
import openModalWindowDelete from './job_log/openModalWindowDelete';
import requestDownloadAllFiles from './job_log/requestDownloadAllFiles';
import requestDownloadChooseFiles from './job_log/requestDownloadChooseFiles';
import createTableTaskResultFilter from './job_log/createTableTaskResultFilter';
import getBodyJournalOfFiltrations from './commons/getBodyJournalOfFiltrations';
import createModalWindowFilterResults from './commons/createModalWindowFilterResults';
import createModalWindowListDownloadFiles from './job_log/createModalWindowListDownloadFiles';

(function() {
    //загрузка отфильтрованного сетевого трафика
    function importFiles(taskIndex) {
        socket.emit('get list all files obtained result filtering', { processingType: 'importFiles', taskIndex: taskIndex });
    }

    //пользователь не авторизован
    socket.on('error authentication user', function() {
        window.location.reload();
    });

    socket.on('notify information', function(data) {
        let obj = JSON.parse(data.notify);
        showNotify(obj.type, obj.message);
    });

    socket.on('show new page', function(data) {
        createTableTaskResultFilter(data);
    });

    //вывод подробной информации о задаче на фильтрацию
    socket.on('all information for task index', function(data) {
        createModalWindowFilterResults(data);
    });

    //вывод списка найденных файлов
    socket.on('list all files obtained result filtering', function(data) {
        createModalWindowListDownloadFiles(data);
    });

    socket.on('found all tasks Index', function(data) {
        if (!data.hasOwnProperty('selectList')) return;
        if (!data.hasOwnProperty('informationTasks')) return;

        //очищаем поля формы ввода даты и времени
        document.getElementById('dateTimeStart').firstElementChild.value = '';
        document.getElementById('dateTimeEnd').firstElementChild.value = '';

        //строим выпадающий список
        getSelectList(data.selectList);
        $('.chosen-select').chosen({ width: '550px' });

        //формируем таблицу с данными и пагинатор
        getBodyJournalOfFiltrations('job_log', data.informationTasks);
    });

    //изменение статуса заданного объекта
    socket.on('change object status', function(data) {
        changeObjectStatus(data);
    });

    //обновляем количество загруженных найденных файлов
    socket.on('filtering execute', function(data) {
        let trElement = document.getElementById('task_' + data.information.taskIndex);
        if (trElement === null) return;

        let countFilesFound = (+data.information.countFilesFound === 0) ? data.information.countFilesFound : `<strong>${data.information.countFilesFound}</strong>`;

        trElement.querySelectorAll('td')[7].innerHTML = countFilesFound;
        let taskInformation = trElement.querySelector('input[type="hidden"]').dataset.taskinformation;
        if (~taskInformation.indexOf(':')) {
            let dataAccessRights = taskInformation.split(':')[0];

            trElement.querySelector('input[type="hidden"]').dataset.taskinformation = dataAccessRights + ':' + data.information.countFilesFound;
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        //обработчик на кнопку 'импорт'
        (function() {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonImport"]');
            buttonsImport.forEach((element) => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = importFiles.bind(null, taskIndex);
            });
        })();

        //обработчик на кнопку 'удалить'
        (function() {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonDelete"]');
            buttonsImport.forEach((element) => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = openModalWindowDelete.bind(null, taskIndex);
            });
        })();

        //обработчик на кнопку 'полная информация'
        (function() {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonAllInformation"]');
            buttonsImport.forEach((element) => {
                let taskIndex = element.parentElement.dataset.taskIndex;
                element.onclick = (function(taskIndex) {
                    socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
                }).bind(null, taskIndex);
            });
        })();

        //обработчик на постраничные ссылки
        (function() {
            let divPagination = document.getElementsByClassName('pagination')[0];
            if (typeof divPagination !== 'undefined') divPagination.addEventListener('click', processPagination.bind('show the page number filtering'));
        })();

        //обработчик на кнопку 'поиск'
        (function() {
            let buttonSearch = document.getElementById('buttonSearch');
            if (typeof buttonSearch !== 'undefined') buttonSearch.addEventListener('click', submitQuery);
        })();

        //обработчик на кнопку 'удалить' модального окна
        (function() {
            document.querySelector('#modalDelete .btn-primary').addEventListener('click', (function() {
                let taskIndex = document.querySelector('#modalDelete .modal-body p').dataset.taskIndex;

                socket.emit('delete all information for task index', { processingType: 'deleteTaskIndex', taskIndex: taskIndex });
                //закрыть модальное окно
                $('#modalDelete').modal('hide');

                setTimeout((function() { window.location.reload(); }), 5000);
            }));
        })();

        //обработчик на кнопку 'скачать все'
        (function() {
            document.querySelector('#modalListDownloadFiles .btn-primary').addEventListener('click', function() {
                requestDownloadAllFiles(socket);
            });
        })();

        //обработчик на кнопку 'скачать выбранное'
        (function() {
            document.querySelector('#modalListDownloadFiles .btn-default').addEventListener('click', function() {
                requestDownloadChooseFiles(socket);
            });
        })();

        common.toolTip();

        $('.chosen-select').chosen({ width: '550px' });

        $(function() {
            $('#dateTimeStart').datetimepicker({ locale: 'ru' });
            $('#dateTimeEnd').datetimepicker({ locale: 'ru' });
        });
    });
})();