/**
 * Изменение статуса выполняемой задачи
 * 
 * Версия 0.11, дата релиза 20.02.2018
 */

'use strict';

export default function(data) {
    let divTaskIndex = document.getElementById('task_' + data.informationPageJobLog.idElement);

    if (divTaskIndex === null) return;

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
        'in line': ['в очереди', '#ffcc2f'],
        'loaded': ['выполняется', '#00acee'],
        'suspended': ['приостановлен', '#ef5734'],
        'expect': ['ожидает', '#ffcc2f'],
        'uploaded': ['выполнен', '#2baf2b']
    };

    if (data.informationPageJobLog.typeElement === 'uploadFiles') {
        divTaskIndex.children[5].innerHTML = objLoadingStatus[data.informationPageJobLog.newStatus][0];
        divTaskIndex.children[5].style.color = objLoadingStatus[data.informationPageJobLog.newStatus][1];

        let isExpect = (data.informationPageJobLog.newStatus === 'expect');
        let isUploaded = (data.informationPageJobLog.newStatus === 'uploaded');
        let isLoaded = (data.informationPageJobLog.newStatus === 'loaded');

        //удаление кнопки 'импорт'
        if (isExpect || isUploaded || isLoaded) {
            let buttonImport = divTaskIndex.querySelector('.glyphicon-import');

            if (buttonImport === null) return;

            let parentElement = buttonImport.parentElement.parentElement;
            parentElement.removeChild(buttonImport.parentElement);
        }
    } else if (data.informationPageJobLog.typeElement === 'jobStatus') {

        divTaskIndex.children[6].innerHTML = objJobStatus[data.informationPageJobLog.newStatus][0];
        divTaskIndex.children[6].style.color = objJobStatus[data.informationPageJobLog.newStatus][1];

        //добавление кнопки 'импорт'
        if (data.informationPageJobLog.newStatus === 'complete') {
            let taskInformation = divTaskIndex.querySelector('input[type="hidden"]').dataset.taskinformation;

            if (~taskInformation.indexOf(':')) {
                let tmpInformation = taskInformation.split(':');
                let dataAccessRights = tmpInformation[0];
                let countFilesUploaded = tmpInformation[1];

                if (countFilesUploaded > 0) {
                    let buttonTrash = divTaskIndex.querySelector('.glyphicon-trash').parentElement;

                    if (buttonTrash === null) return;

                    let elemSpan = document.createElement('span');
                    elemSpan.setAttribute('class', 'glyphicon glyphicon-import');

                    let elemButton = document.createElement('button');
                    elemButton.setAttribute('type', 'button');
                    elemButton.setAttribute('class', 'btn btn-default btn-sm btn-file');
                    elemButton.setAttribute('title', 'загрузить сетевой трафик');
                    elemButton.setAttribute('style', 'margin-right: 4px;');

                    if (dataAccessRights === false) elemButton.setAttribute('disabled', 'disabled');

                    elemButton.appendChild(elemSpan);
                    elemButton.appendChild(document.createTextNode(' импорт'));

                    buttonTrash.parentElement.insertBefore(elemButton, buttonTrash);
                    elemButton.addEventListener('click', (function(taskIndex) {
                        socket.emit('import all files obtained result filtering', { processingType: 'importFiles', taskIndex: taskIndex });
                    }).bind(null, data.informationPageJobLog.idElement));
                }
            }
        }
    }
}