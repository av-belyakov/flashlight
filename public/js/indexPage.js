'use strict';

import { helpers } from './common_helpers/helpers';
import common from './common';
import checkChangeAdminPassword from './index_page/checkChangeAdminPassword';
import createModalWindowFilterResults from './commons/createModalWindowFilterResults';
import deleteElementInformationFiltering from './index_page/deleteElementInformationFiltering';
import createWidgetVisualizationFiltration from './index_page/createWidgetVisualizationFiltration';
import createWidgetVisualizationDownloadFiles from './index_page/createWidgetVisualizationDownloadFiles';

import changeWidget from './index_page/changeWidget';
import changeInfoMinWidget from './index_page/changeInfoMinWidget';
import modalWindowSourceControl from './index_page/modalWindowSourceControl';
import modalWindowFilterResults from './index_page/modalWindowFilterResults';

(function() {
    let timerId = null;

    //вывод информационного сообщения
    function showNotify(arrOne, arrTwo, type, message) {
        if (type === 'danger' || type === 'success' || type === 'warning') {
            $.notify({
                message: message
            }, {
                type: type,
                placement: { from: 'top', align: 'right' },
                offset: { x: 0, y: 60 }
            });
        } else {
            let array = helpers.getDifferenceArray(arrOne, arrTwo);

            array.forEach((item) => {
                //изменяем состояние виджета
                changeWidget.changeWidgetForDisconnection(item);
            });
        }
    }

    (function() {
        window.onresize = function() {
            let scrollHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );

            let minHeight = scrollHeight - 107;
            document.getElementById('rightContent').setAttribute('style', 'min-height: ' + minHeight + 'px;');
        };
    })();

    //проверка дефолтного пароля администратора
    /*function checkDefaultAdministrationPassword(trigger) {
        if (trigger === true) $('#modalPassAdmin').modal('show');
    }*/

    //обработчики событий
    (function() {
        //пользователь не авторизован
        socket.on('error authentication user', function(data) {
            window.location.reload();
        });

        socket.on('status list sources', function(data) {
            let statusListSources = data.statusListSources;

            let arrayConnection = [];
            let arrayDisconnection = [];

            for (let sensorId in statusListSources) {
                if (statusListSources[sensorId].statusConnection) arrayConnection.push(sensorId);
                else arrayDisconnection.push(sensorId);
            }

            arrayConnection.sort();
            arrayDisconnection.sort();

            let objListRemoteHost = {
                connect: arrayConnection,
                disconnect: arrayDisconnection
            };

            let list = '';
            for (let name in objListRemoteHost) {
                let named = (name === 'connect') ? 'подключены' : 'недоступны';
                let styleColor = (name === 'connect') ? 'color: #9FD783;' : 'color: #C78888;';

                list += `<div style="padding-left: 15px;">
                ${named}<strong style="${styleColor} font-size: 14px;"> ${objListRemoteHost[name].length}</strong>
                </div><ul>`;

                for (let i = 0; i < objListRemoteHost[name].length; i++) {
                    list += `<li class="sub-menu"><a href="#" data-source-id="${objListRemoteHost[name][i]}">
                    ${objListRemoteHost[name][i]}&nbsp;${statusListSources[objListRemoteHost[name][i]].shortName}</a></li>`;
                }
                list += '</ul>';
            }

            let oldDisconnectString = document.getElementById('disconnectString');
            let arrayOldConnect = JSON.parse(oldDisconnectString.dataset.sourceDisconnect);

            showNotify(objListRemoteHost.disconnect, arrayOldConnect, 'info', 'Изменение статуса источника №');
            oldDisconnectString.dataset.sourceDisconnect = JSON.stringify(objListRemoteHost.disconnect);

            let div = document.getElementById('listRemoteHostConnection');
            div.innerHTML = list;
        });

        //информация о ходе фильтрации
        socket.on('filtering execute', function(data) {
            createWidgetVisualizationFiltration(data);
        });

        //информация о ходе фильтрации
        socket.on('filtering stop', function(data) {
            setTimeout(deleteElementInformationFiltering.bind(null, data.information.taskIndex), 30000);
        });

        //вывод информационного сообщения
        socket.on('notify information', function(data) {
            var obj = JSON.parse(data.notify);
            showNotify([], [], obj.type, obj.message);
        });

        //вывод подробной информации о задаче на фильтрацию
        socket.on('all information for task index', function(data) {
            createModalWindowFilterResults(data);
        });

        //обработка сообщения о поступлении новой информации об источнике
        socket.on('new information message', function(data) {
            let divInformationWidget = document.getElementById('modalWindowSource');
            let arrayMinWidgets = document.getElementsByName('minWidget');
            let elemMinWidget = null;

            for (let i = 0; i < arrayMinWidgets.length; i++) {
                if ((arrayMinWidgets[i].dataset !== null) && (arrayMinWidgets[i].dataset.sourceId === data.sourceid)) elemMinWidget = arrayMinWidgets[i];
            }

            if (divInformationWidget === null && elemMinWidget === null) return;

            if (divInformationWidget !== null) {
                if (divInformationWidget.style.display === 'none') {
                    return divInformationWidget.parentElement.removeChild(divInformationWidget);
                }
                socket.emit('get all information for source id', { sourceId: data.sourceId });
            } else {
                socket.emit('get information for source id', { sourceId: data.sourceId });
            }
        });

        //вывод подробной информации об источнике и добавление задачи на фильтрацию
        socket.on('all information for source id', function(data) {
            modalWindowSourceControl.showModalWindowSourceControl(data);
        });

        //вывод информации для виджета
        socket.on('information widgets', function(data) {
            changeInfoMinWidget(data);
        });

        //вывод информации о добавлении новой задачи для выгрузки файлов
        socket.on('task upload files added', function(data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                createWidgetVisualizationDownloadFiles(data.information);
            }

            document.getElementById('progress:' + data.information.taskIndex).innerHTML = '<h4 class="text-center" style="color: #9FD783;">в очереди</h4>';
            document.getElementById('file_information:' + data.information.taskIndex).style.marginTop = '-10px';
            document.getElementById('file_information:' + data.information.taskIndex).innerHTML = 'Найдено файлов: ' + data.information.countFilesFound;
        });

        //вывод информации о прогрессе в загрузке файла
        socket.on('update the download progress', function(data) {
            if (timerId !== null) clearTimeout(timerId);

            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                createWidgetVisualizationDownloadFiles(data.information);
            }

            if (document.getElementById('progress:' + data.information.taskIndex) !== null) {
                let templateProgress = '<div class="progress" style="margin-top: 10px;">';
                templateProgress += `<div class="progress-bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: ${data.information.fileUploadedPercent}%">${data.information.fileUploadedPercent}%</div></div>`;

                document.getElementById('progress:' + data.information.taskIndex).innerHTML = templateProgress;
            }

            common.toolTip();
        });

        //вывод информации об успешной загрузке файла
        socket.on('file successfully downloaded', function(data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                createWidgetVisualizationDownloadFiles(data.information);
            }

            if (document.getElementById('progress:' + data.information.taskIndex) !== null) {
                let templateProgress = '<div class="progress" style="margin-top: 10px;">';
                //templateProgress += '<div class="progress-bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: ' + data.information.fileUploadedPercent + '%">' + data.information.fileUploadedPercent + '%</div></div>';
                templateProgress += '<div class="progress-bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%">0%</div></div>';

                document.getElementById('progress:' + data.information.taskIndex).innerHTML = templateProgress;
            }

            let templateFileInformation = `<span style="font-size: 16px;" data-toggle="tooltip" data-placement="bottom" title="файлов загружено"><strong>${data.information.countFilesLoaded}</strong></span> / `;
            templateFileInformation += `<span style="font-size: 16px; color: #C78888;" data-toggle="tooltip" data-placement="bottom" title="файлов загружено с ошибкой">${data.information.countFilesLoadedError}</span> / `;
            templateFileInformation += `<span style="font-size: 16px; color: #9FD783;" data-toggle="tooltip" data-placement="bottom" title="всего файлов">${data.information.countFilesFound}</span>`;

            document.getElementById('file_information:' + data.information.taskIndex).style.marginTop = '-10px;';
            document.getElementById('file_information:' + data.information.taskIndex).innerHTML = templateFileInformation;

            common.toolTip();
        });

        //вывод информации о повторной передачи файлов принятых с ошибкой
        socket.on('file execute retransmission', function(data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                createWidgetVisualizationDownloadFiles(data.information);
            }

            let fileName = (data.information.fileName.length > 30) ? data.information.fileName.substr(0, 30) + '...' : data.information.fileName;
            document.getElementById('file_information:' + data.information.taskIndex).innerHTML = `<div style="font-size: 9px; color: #C78888;">${fileName}</div>`;
        });

        //вывод информации об успешной загрузке ВСЕХ файлов
        socket.on('all files successfully downloaded', function(data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                createWidgetVisualizationDownloadFiles(data.information);
            }

            document.getElementById('progress:' + data.information.taskIndex).innerHTML = '<h4 class="text-center" style="color: #9FD783;">загрузка завершена</h4>';
            document.getElementById('file_information:' + data.information.taskIndex).innerHTML = 'Загружено файлов: ' + data.information.countFilesLoaded;

            setTimeout(deleteElementInformationFiltering.bind(null, 'download:' + data.information.taskIndex), 30000);
        });

        //удаление задачи из очереди загрузок
        socket.on('task upload files cancel', function(data) {
            let divTaskIndex = document.getElementById('download:' + data.information.sourceId + ':' + data.information.taskIndex);

            if (divTaskIndex === null) return;

            let parentElem = divTaskIndex.parentElement;
            parentElem.removeChild(divTaskIndex);
        });
    })();

    document.addEventListener('DOMContentLoaded', function() {
        helpers.loadNetworkMarginTop();
        common.toolTip();

        //добавляем вызов модального окна для вывода информации по источникам
        (function() {
            let div = document.getElementById('listRemoteHostConnection');
            div.addEventListener('click', modalWindowSourceControl.getAllInformationForSourceControl);
        })();

        //добавляем вызов модального окна для вывода задачи фильтрации
        (function() {
            let divLeftContent = document.getElementById('leftContent');
            divLeftContent.addEventListener('click', modalWindowFilterResults.getAllInformationForTaskFilterIndexPage);
        })();

        //настраиваем минимальную высоту правого контента (со списком источников)
        (function() {
            let scrollHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            let minHeight = scrollHeight - 107;
            document.getElementById('rightContent').setAttribute('style', 'min-height: ' + minHeight + 'px;');
        })();

        //проверка пароля администратора, выполняется только при изменении
        let changeAdminPassword = document.getElementById('changeAdminPassword');
        changeAdminPassword.onsubmit = checkChangeAdminPassword;
    });
})();