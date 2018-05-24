'use strict';

require('chosen-js');

import { showNotify } from './common_helpers/showNotify';
import common from './common';
import submitQuery from './upload_files_log/submitQuery';
import sortColumns from './upload_files_log/sortColumns';
import processPagination from './commons/processPagination';
import openModalWindowDelete from './upload_files_log/openModalWindowDelete';
import getBodyJournalOfFiltrations from './commons/getBodyJournalOfFiltrations';
import createTableTaskUploadedFiles from './upload_files_log/createTableTaskUploadedFiles';
import createModalWindowFilterResults from './commons/createModalWindowFilterResults';

(function() {
    let globalObj = {};

    //проверка изменений в поле ввода
    function checkChangeInputIpAddress() {
        let divParentNode = document.getElementById('ipaddress');
        let tokenInvalid = divParentNode.parentNode.getElementsByClassName('invalid');
        let token = divParentNode.parentNode.getElementsByClassName('token');

        if (token.length === 0) {
            divParentNode.parentNode.parentNode.classList.remove('has-error');
            divParentNode.parentNode.parentNode.classList.remove('has-success');
        }

        if ((tokenInvalid.length === 0) && (token.length > 0)) {
            divParentNode.parentNode.parentNode.classList.remove('has-error');
            divParentNode.parentNode.parentNode.classList.add('has-success');
        }
    }

    //вывод подробной информации о задаче на фильтрацию
    socket.on('all information for task index', function(data) {
        createModalWindowFilterResults(data);
    });

    socket.on('notify information', function(data) {
        clearTimeout(globalObj.setTimeoutImg);

        try {
            let obj = JSON.parse(data.notify);
            showNotify(obj.type, obj.message);
        } catch (e) {
            showNotify('danger', 'получен некорректный JSON объект');
        }
    });

    //вывод подробной информации при поиске
    socket.on('found all tasks upload index', function(data) {
        clearTimeout(globalObj.setTimeoutImg);
        if (!data.hasOwnProperty('informationTasks')) {
            document.getElementById('field_table').previousElementSibling.innerHTML = 'всего задач найдено: <strong>0</strong>';
            document.getElementById('field_table').innerHTML = '';
            showNotify('warning', 'Ничего найдено не было');
        } else {
            getBodyJournalOfFiltrations('uploaded_files_log', data.informationTasks);
        }
    });

    //побработка запроса следующей страницы
    socket.on('show new page upload', function(data) {
        createTableTaskUploadedFiles(data.informationTasks);
    });

    socket.on('change number uploaded files', function(data) {
        setTimeout(function() {
            window.location.reload();
        }, 5000);
        document.getElementById('numberUploadedFiles').innerHTML = data.numberUploadedFiles;
    });

    document.addEventListener('DOMContentLoaded', function() {
        //Обработчик на постраничные ссылки
        (function() {
            let divPagination = document.getElementsByClassName('pagination')[0];
            if (typeof divPagination !== 'undefined') divPagination.addEventListener('click', processPagination.bind('show the page number filtering'));
        })();

        //обработчик на кнопку 'Поиск'
        (function() {
            let buttonSearch = document.getElementById('buttonSearch');
            if (typeof buttonSearch !== 'undefined') buttonSearch.addEventListener('click', submitQuery.bind(null, globalObj));
        })();

        //обработчик на кнопки сортировки
        (function() {
            let elementsByName = document.getElementsByName('sortColumns');
            elementsByName.forEach(function(item) {
                item.addEventListener('click', sortColumns);
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

        //обработчик на кнопку 'изменить статус'
        (function() {
            let buttonsImport = document.querySelectorAll('#field_table [name="buttonChangeStatus"]');
            buttonsImport.forEach((element) => {
                let taskIndex = element.dataset.sourceIdTaskIndex;
                element.onclick = (function(taskIndex) {
                    socket.emit('a mark of consideration', { processingType: 'changeStatusFile', taskIndex: taskIndex });
                }).bind(null, taskIndex);
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

        //обработчик на кнопку 'удалить' модального окна
        (function() {
            document.querySelector('#modalDelete .btn-primary').addEventListener('click', (function() {
                let label = document.querySelector('#modalDelete .modal-body label');
                let taskIndex = label.dataset.taskIndex;

                socket.emit('to remove information about files', { processingType: 'deleteTaskIndex', taskIndex: taskIndex, deleteAllFile: label.children[0].checked });
                //закрыть модальное окно
                $('#modalDelete').modal('hide');
            }));
        })();

        common.toolTip();

        $('.chosen-select').chosen({ width: '550px' });

        $(function() {
            $('#dateTimeStart').datetimepicker({
                locale: 'ru'
            });

            $('#dateTimeEnd').datetimepicker({
                locale: 'ru'
            });
        });

        $('#ipaddress').on('tokenfield:createdtoken', function(e) {
            checkChangeInputIpAddress();
            let patternIp = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$');
            let patternNet = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)/[0-9]{1,2}$');

            let inputValue = e.attrs.value;
            let isNetwork = inputValue.split('/');

            if ((isNetwork.length > 0) && (isNetwork[1] > 32)) {
                $(e.relatedTarget).addClass('invalid');
                let parentElement = document.getElementById('ipaddress');
                parentElement.parentNode.parentNode.classList.remove('has-success');
                parentElement.parentNode.parentNode.classList.add('has-error');
                return;
            }

            let validIp = patternIp.test(inputValue);
            let validNet = patternNet.test(inputValue);

            if (!validIp && !validNet) {
                $(e.relatedTarget).addClass('invalid');
                let parentElement = document.getElementById('ipaddress');
                parentElement.parentNode.parentNode.classList.remove('has-success');
                parentElement.parentNode.parentNode.classList.add('has-error');
            }
        }).on('tokenfield:removedtoken', function(e) {
            checkChangeInputIpAddress();
        }).tokenfield();
    });
})();