/**
 * Создание новой таблицы содержащей результаты поиска
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */

'use strict';

import openModalWindowDelete from './openModalWindowDelete';

export default function createTableTaskResultFilter(objData) {
    //удаление старой таблицы с данными
    function removeElementByClassName() {
        let removeElement = document.querySelector('#main-content .table');

        if (removeElement === null) return;

        let parentNode = removeElement.parentNode;
        parentNode.removeChild(removeElement);
    }

    //удаляем старую таблицу
    removeElementByClassName();

    function getName(userName) {
        if (!(~userName.indexOf(' '))) return userName;

        let userNameTmp = userName.split(' ');
        let newUserName = '';
        for (let i = 0; i < userNameTmp.length; i++) {
            newUserName += (i === 0) ? userNameTmp[i] + ' ' : userNameTmp[i][0] + '.';
        }
        return newUserName;
    }

    let informationTaskIndex = objData.informationTaskIndex;

    let number = 1;
    if (objData.informationPaginate.chunksNumber !== 1) {
        number = ((objData.informationPaginate.chunksNumber - 1) * objData.informationPaginate.maxCountElementsIndex) + 1;
    }

    let objJobStatus = {
        'start': ['выполняется', '#00acee'],
        'expect': ['oжидает', '#ffcc2f'],
        'rejected': ['oтклонена', '#ffcc2f'],
        'execute': ['выполняется', '#00acee'],
        'complete': ['завершена', '#2baf2b'],
        'stop': ['остановлена', '#ef5734']
    };

    let objLoadingStatus = {
        'not loaded': ['не выполнялся', '#989898'],
        'partially loaded': ['загружены частично', '#989898'],
        'in line': ['в очереди', '#ffcc2f'],
        'loaded': ['выполняется', '#00acee'],
        'suspended': ['приостановлен', '#ef5734'],
        'expect': ['ожидает', '#ffcc2f'],
        'uploaded': ['выполнен', '#2baf2b']
    };

    let inputDataAccessRights = document.getElementById('dataAccessRights').dataset.accessRights;
    let dataAccessRights = inputDataAccessRights.split(',');

    let disabledRead = (dataAccessRights[0].split('=')[1] === 'false') ? 'disabled="disabled"' : '';
    let disabledImport = (dataAccessRights[1].split('=')[1] === 'false') ? 'disabled="disabled"' : '';
    let disabledDelete = (dataAccessRights[2].split('=')[1] === 'false') ? 'disabled="disabled"' : '';

    let divElement = document.getElementById('field_table');

    let tableHeader = '<thead><tr><th>№</th><th class="text-left">дата формирования задачи</th><th class="text-right">id источника</th><th class="text-left">пользователь</th>';
    tableHeader += '<th class="text-left">ip-адреса источники</th><th class="text-left">импорт файлов</th><th class="text-left">статус задачи</th><th class="text-right">файлов найдено</th></tr></thead>';

    let tableBody = '<tbody>';
    for (let taskIndex in informationTaskIndex) {
        let x = (new Date()).getTimezoneOffset() * 60000;
        let dateTimeAddTaskFilter = (new Date((+informationTaskIndex[taskIndex].dateTimeAddTaskFilter - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));

        let textSettings, stringIpNetwork;
        try {
            let filterSettings = JSON.parse(informationTaskIndex[taskIndex].filterSettings);

            let dateTimeStart = (filterSettings.dateTimeStart === null) ? '' : filterSettings.dateTimeStart;
            let dateTimeEnd = (filterSettings.dateTimeEnd === null) ? '' : filterSettings.dateTimeEnd;

            textSettings = 'Временной интервал с ' + dateTimeStart + ' по ' + dateTimeEnd;
            textSettings += (filterSettings.ipaddress === null) ? '' : ', IP-адреса: ' + filterSettings.ipaddress.replace(/,/g, ', ');
            textSettings += (filterSettings.network === null) ? '' : ', диапазоны подсетей: ' + filterSettings.network;

            let arrayIpNetwork;
            if ((filterSettings.ipaddress !== null) && (filterSettings.network !== null)) {
                let arrayIp = filterSettings.ipaddress.split(',');
                let arrayNetwork = filterSettings.network.split(',');
                arrayIpNetwork = arrayIp.concat(arrayNetwork);
            } else if ((filterSettings.ipaddress === null) && (filterSettings.network !== null)) {
                arrayIpNetwork = filterSettings.network.split(',');
            } else if ((filterSettings.ipaddress !== null) && (filterSettings.network === null)) {
                arrayIpNetwork = filterSettings.ipaddress.split(',');
            } else {
                arrayIpNetwork = '';
            }

            if (typeof arrayIpNetwork === 'string') {
                stringIpNetwork = arrayIpNetwork;
            } else {
                arrayIpNetwork.sort();
                stringIpNetwork = arrayIpNetwork.join('<br>');
            }
        } catch (err) {
            textSettings = '';
        }
        let countFilesFound = (+informationTaskIndex[taskIndex].countFilesFound === 0) ? informationTaskIndex[taskIndex].countFilesFound : `<strong>${informationTaskIndex[taskIndex].countFilesFound}</strong>`;

        let tableBodyButton = `<td class="text-right" data-task-index="${taskIndex}"><button type="button" name="buttonAllInformation" class="btn btn-default btn-sm" ${disabledRead} title="полная информация о задаче">`;
        tableBodyButton += '<span class="glyphicon glyphicon glyphicon-info-sign"></span></button>';

        let isJobStatusComplete = (informationTaskIndex[taskIndex].jobStatus === 'complete');
        let isUploadFilesNotLoaded = ((informationTaskIndex[taskIndex].uploadFiles === 'not loaded') || (informationTaskIndex[taskIndex].uploadFiles === 'partially loaded'));
        let isGreaterZero = (informationTaskIndex[taskIndex].countFilesFound > 0);

        if (isJobStatusComplete && isUploadFilesNotLoaded && isGreaterZero) {
            tableBodyButton += `<button type="button" name="buttonImport" class="btn btn-default btn-sm btn-file" ${disabledImport} title="загрузить сетевой трафик"><span class="glyphicon glyphicon-import"></span> импорт </button>`;
        }

        tableBodyButton += `<button type="button" name="buttonDelete" class="btn btn-default btn-sm" ${disabledDelete} title="удаление задачи">`;
        tableBodyButton += '<span class="glyphicon glyphicon-trash"></span></button><input type="hidden" data-taskInformation="' + dataAccessRights[1].split('=')[1] + ':' + informationTaskIndex[taskIndex].countFilesFound + '"></td>';

        tableBody += `<tr id="task_${taskIndex}" data-toggle="tooltip" title="${textSettings}"><td style="padding-top: 15px;">${number++}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px;">${dateTimeAddTaskFilter}</td>`;
        tableBody += `<td class="text-right" style="padding-top: 15px;">${informationTaskIndex[taskIndex].sourceId}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px;">${getName(informationTaskIndex[taskIndex].userName)}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px;">${stringIpNetwork}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px; color: ${objLoadingStatus[informationTaskIndex[taskIndex].uploadFiles][1]}">${objLoadingStatus[informationTaskIndex[taskIndex].uploadFiles][0]}</td>`;
        tableBody += `<td class="text-left" style="padding-top: 15px; color: ${objJobStatus[informationTaskIndex[taskIndex].jobStatus][1]}">${objJobStatus[informationTaskIndex[taskIndex].jobStatus][0]}</td>`;
        tableBody += `<td class="text-right" style="padding-top: 15px;">${countFilesFound}</td>`;
        tableBody += tableBodyButton + '</tr>';
    }
    tableBody += '</tbody>';

    divElement.innerHTML = '<div class="table-responsive" style="margin-left: 10px; margin-right: 10px;"><table class="table table-striped table-hover table-sm">' + tableHeader + tableBody + '</table></div>';

    //загрузка отфильтрованного сетевого трафика
    function importFiles(taskIndex) {
        socket.emit('get list all files obtained result filtering', { processingType: 'importFiles', taskIndex: taskIndex });
    }

    (function() {
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
    })();

    $('[data-toggle="tooltip"]').tooltip();
}