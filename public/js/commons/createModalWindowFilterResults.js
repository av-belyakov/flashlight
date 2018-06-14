/**
 * Формирование модального окна с результатами фильтрации
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */

'use strict';

import { helpers } from '../common_helpers/helpers';
import modalWindowFilterResults from '../index_page/modalWindowFilterResults';

export default function createModalWindowFilterResults(obj, objectTimers) {
    let objInformation = obj.information;

    //формируем модальное окно
    creatingNewModalWindow();

    //добавляем данные в модальное окно
    setDataModalWindowFilterResults(objInformation);

    $('#modalWindowTaskFilter').modal('show');

    //добавляем обработчик на кнопку 'остановить' для ОСТАНОВКИ ФИЛЬТРАЦИИ
    let buttonSubmitFilterStop = document.querySelector('.btn-danger[data-filter="filterStop"]');
    if (buttonSubmitFilterStop !== null) buttonSubmitFilterStop.addEventListener('click', modalWindowFilterResults.stopFilterTask.bind(null, objInformation.taskIndex));

    //добавляем обработчик на кнопку 'возобновить' для ВОЗОБНАВЛЕНИЯ ФИЛЬТРАЦИИ
    let buttonSubmitFilterResume = document.querySelector('.btn-danger[data-filter="filterResume"]');
    if (buttonSubmitFilterResume !== null) buttonSubmitFilterResume.addEventListener('click', modalWindowFilterResults.resumeFilterTask.bind(null, objInformation.taskIndex, objectTimers));

    //добавляем обработчик на кнопку 'остановить' для ОСТАНОВКИ ЗАГРУЗКИ ФАЙЛОВ
    let buttonSubmitDownloadStop = document.querySelector('.btn-danger[data-download="loaded"]');
    if (buttonSubmitDownloadStop !== null) buttonSubmitDownloadStop.addEventListener('click', modalWindowFilterResults.stopDownloadFiles.bind(null, objInformation.taskIndex));
    //добавляем обработчик на кнопку 'возобновить' для ВОЗОБНАВЛЕНИЯ ЗАГРУЗКИ ФАЙЛОВ
    let buttonSubmitDownloadResume = document.querySelector('.btn-danger[data-download="suspended"]');
    if (buttonSubmitDownloadResume !== null) buttonSubmitDownloadResume.addEventListener('click', modalWindowFilterResults.resumeDownloadFiles.bind(null, objInformation.taskIndex));
    //добавляем обработчик на кнопку 'отменить' для ОТМЕНЫ ЗАДАЧИ ПО ВЫГРУЗКЕ ФАЙЛОВ
    let buttonSubmitDpwnloadCancel = document.querySelector('.btn-danger[data-download="in line"]');
    if (buttonSubmitDpwnloadCancel !== null) buttonSubmitDpwnloadCancel.addEventListener('click', modalWindowFilterResults.cancelDownloadFiles.bind(null, objInformation.taskIndex));

    //формирование модального окна
    function creatingNewModalWindow() {
        /* удаляем модальное окно */
        let oldModalWindow = document.getElementById('modalWindowTaskFilter');
        if (oldModalWindow !== null) {
            oldModalWindow.innerHTML = '';
            document.body.removeChild(oldModalWindow);
        }
        /* заголовок модального окна */
        let divHeader = document.createElement('div');
        divHeader.classList.add('modal-header');

        let button = document.createElement('button');
        button.classList.add('close');
        button.setAttribute('data-dismiss', 'modal');
        button.setAttribute('aria-hidden', 'true');
        button.appendChild(document.createTextNode('x'));

        let h4 = document.createElement('h4');
        h4.classList.add('modal-title');

        divHeader.appendChild(button);
        divHeader.appendChild(h4);

        /* основное содержимое модального окна */
        let divBody = document.createElement('div');
        divBody.style.display = 'inline-block';
        divBody.classList.add('modal-body');

        /* основное модальное окно */
        let divModalWindow = document.createElement('div');
        divModalWindow.classList.add('modal');
        divModalWindow.classList.add('fade');
        divModalWindow.setAttribute('id', 'modalWindowTaskFilter');
        divModalWindow.setAttribute('tabindex', '-1');
        divModalWindow.setAttribute('role', 'dialog');

        let divModal = document.createElement('div');
        divModal.classList.add('modal-dialog');
        divModal.classList.add('modal-lg');

        let divContent = document.createElement('div');
        divContent.classList.add('modal-content');
        divContent.style.minHeight = '600px';

        divContent.appendChild(divHeader);
        divContent.appendChild(divBody);
        divModal.appendChild(divContent);
        divModalWindow.appendChild(divModal);

        document.body.appendChild(divModalWindow);
    }

    //заполняем модальное окно данными
    function setDataModalWindowFilterResults(obj) {

        setModalHeader(obj);
        setModalBody(obj);

        function getDateTime(dateTimeUnix) {
            let x = (new Date()).getTimezoneOffset() * 60000;
            let dateTimeString = (new Date((+dateTimeUnix - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));
            let dateTimeArr = dateTimeString.split(' ');
            let dateArr = dateTimeArr[0].split('-');
            return dateTimeArr[1] + ' ' + dateArr[2] + '.' + dateArr[1] + '.' + dateArr[0];
        }

        function setModalHeader(obj) {
            let headderElement = document.querySelector('#modalWindowTaskFilter .modal-title');
            headderElement.innerHTML = 'Источник №' + obj.sourceId + ' (' + obj.shortName + '), задание добавлено в ' + getDateTime(obj.dateTimeAddTaskFilter);
        }

        function setModalBody(obj) {
            let bodyElement = document.querySelector('#modalWindowTaskFilter .modal-body');
            if (obj.dateTimeStartFilter === 'null') {
                modalBodyRedject(obj);
            } else {
                modalBodyAllInformationFiltering(obj);
            }

            //вывод когда задача отклонена
            function modalBodyRedject(obj) {
                let taskFilterSettings = JSON.parse(obj.filterSettings);
                let ipaddress = taskFilterSettings.ipaddress + '';
                let listIpaddress = (ipaddress === 'null') ? '' : ipaddress.replace(new RegExp(',', 'g'), '<br>');
                let network = taskFilterSettings.network + '';
                let listNetwork = (network === 'null') ? '' : network.replace(new RegExp(',', 'g'), '<br>');
                let dateTimeStart = taskFilterSettings.dateTimeStart.split(' ');
                let dateTimeEnd = taskFilterSettings.dateTimeEnd.split(' ');

                //полное название источника
                let stringNameSource = `<div class="col-sm-12 col-md-12 col-lg-12 text-center"><h4><strong>${obj.detailedDescription}</strong></h4></div>`;

                //имя пользователя, время начала фильтрации и ее окончание
                let stringUserNameTimeStartAndEnd = `<div class="col-sm-4 col-md-4 col-lg-4 text-center">пользователь: <br>${obj.userName}</div>`;
                stringUserNameTimeStartAndEnd += '<div class="col-sm-4 col-md-4 col-lg-4 text-center">начало фильтрации: <br><strong>отклонена</strong></div>';
                stringUserNameTimeStartAndEnd += '<div class="col-sm-4 col-md-4 col-lg-4 text-center">окончание фильтрации: <br><strong>нет</strong></div>';

                //параметры фильтрации
                let stringFilterSettings = '<div class="col-sm-6 col-md-6 col-lg-6 text-center" style="margin-top: 15px; padding-top: 5px; padding-bottom: 5px; border-radius: 15px 0 15px 0; border: 1px solid #d9d9d9;">параметры фильтрации</br>';
                stringFilterSettings += '<div class="col-sm-12 col-md-12 col-lg-12">';
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>начальное время</strong><br>${dateTimeStart[1]} ${dateTimeStart[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>конечное время</strong><br>${dateTimeEnd[1]} ${dateTimeEnd[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>ip-адреса</strong><br>${listIpaddress}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>сети</strong><br>${listNetwork}</div>`;
                stringFilterSettings += '</div></div><div class="col-lg-6 text-center"></div>';

                bodyElement.innerHTML = '<div class="col-sm-12 col-md-12 col-lg-12">' + stringNameSource + stringUserNameTimeStartAndEnd + stringFilterSettings + '</div>';
            }

            //вывод информации по фильтрации, выполнется когда выполняются все действия кроме 'задача отклонена'
            function modalBodyAllInformationFiltering(obj) {
                let dateTimeEndFilter = '';
                let dateTimeStartFilter = getDateTime(obj.dateTimeStartFilter);

                if (obj.dateTimeEndFilter === 'null') {
                    dateTimeEndFilter = '<strong>выполняется</strong>';
                } else {
                    dateTimeEndFilter = getDateTime(obj.dateTimeEndFilter);
                }

                let objJobStatus = {
                    'start': 'выполняется',
                    'execute': 'выполняется',
                    'complete': 'завершена',
                    'stop': 'остановлена'
                };

                let taskFilterSettings = JSON.parse(obj.filterSettings);

                let ipaddress = taskFilterSettings.ipaddress + '';
                let listIpaddress = (ipaddress === 'null') ? '' : ipaddress.replace(new RegExp(',', 'g'), '<br>');
                let network = taskFilterSettings.network + '';
                let listNetwork = (network === 'null') ? '' : network.replace(new RegExp(',', 'g'), '<br>');
                let dateTimeStart = taskFilterSettings.dateTimeStart.split(' ');
                let dateTimeEnd = taskFilterSettings.dateTimeEnd.split(' ');
                let percent = Math.ceil((+obj.countFilesProcessed * 100) / +obj.countFilesFiltering);

                //полное название источника
                let stringNameSource = `<div class="col-sm-12 col-md-12 col-lg-12 text-center"><h4><strong>${obj.detailedDescription}</strong></h4></div>`;

                //имя пользователя, время начала фильтрации и ее окончание
                let stringUserNameTimeStartAndEnd = `<div class="col-sm-4 col-md-4 col-lg-4 text-center">пользователь: <br>${obj.userName}</div>`;
                stringUserNameTimeStartAndEnd += `<div class="col-sm-4 col-md-4 col-lg-4 text-center">начало фильтрации: <br>${dateTimeStartFilter}</div>`;
                stringUserNameTimeStartAndEnd += `<div class="col-sm-4 col-md-4 col-lg-4 text-center">окончание фильтрации: <br>${dateTimeEndFilter}</div>`;

                //параметры фильтрации
                let stringFilterSettings = '<div class="col-sm-6 col-md-6 col-lg-6 text-center" style="margin-top: 15px; padding-top: 5px; padding-bottom: 5px; border-radius: 15px 0 15px 0; border: 1px solid #d9d9d9;">параметры фильтрации</br>';
                stringFilterSettings += '<div class="col-sm-12 col-md-12 col-lg-12">';
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>начальное время</strong><br>${dateTimeStart[1]} ${dateTimeStart[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>конечное время</strong><br>${dateTimeEnd[1]} ${dateTimeEnd[0]}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>ip-адреса</strong><br>${listIpaddress}</div>`;
                stringFilterSettings += `<div class="col-sm-6 col-md-6 col-lg-6"><strong>сети</strong><br>${listNetwork}</div>`;
                stringFilterSettings += '</div></div>';

                let stringProgressBar = `<div class="col-sm-2 col-md-2 col-lg-2 text-center" style="margin-top: 15px;"><div class="progress-pie-chart" data-percent="${percent}">`;
                stringProgressBar += `<div class="c100 p${percent}"><span>${percent}%</span><div class="slice"><div class="bar"></div><div class="fill"></div></div></div></div></div>`;

                let countMaxFilesSize = helpers.changeByteSize(obj.countMaxFilesSize);
                let countFoundFilesSize = helpers.changeByteSize(obj.countFoundFilesSize);

                let stringFileInformation = '<div class="col-sm-4 col-md-4 col-lg-4" class="text-left" style="margin-top: 10px;">';
                stringFileInformation += `<div style="margin-left: 20px">статус: <strong>фильтрация ${objJobStatus[obj.jobStatus]}</strong></div>`;
                stringFileInformation += `<div style="margin-left: 20px">всего файлов: <strong>${obj.countFilesFiltering}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">общим размером: ${countMaxFilesSize}</div>`;
                stringFileInformation += `<div style="margin-left: 20px">файлов обработанно: <strong>${obj.countFilesProcessed}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">файлов найдено: <strong>${obj.countFilesFound}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">общим размером: ${countFoundFilesSize}</div>`;
                stringFileInformation += `<div style="margin-left: 20px">фильтруемых директорий: <strong>${obj.countDirectoryFiltering}</strong></div></div>`;

                let stringTargetDirectory = `<div class="col-sm-12 col-md-12 col-lg-12 text-center" style="margin-top: 15px">директория для хранения найденных файлов на источнике<br><strong>${obj.directoryFiltering}</strong></div>`;

                let disabledButton = (obj.userIsFilter === false) ? 'disabled="disabled"' : '';
                let buttonFilterAction = '';
                if (obj.jobStatus === 'execute') {
                    buttonFilterAction = `<button type="submit" data-filter="filterStop" class="btn btn-danger" ${disabledButton}>Остановить</button>`;
                } else if (obj.jobStatus === 'stop') {
                    buttonFilterAction = `<button type="submit" data-filter="filterResume" class="btn btn-danger" ${disabledButton}>Возобновить</button>`;
                }

                let button = `<div class="col-sm-12 col-md-12 col-lg-12 text-right" style="margin-top: 10px;">${buttonFilterAction}</div>`;

                bodyElement.innerHTML = '<div class="col-sm-12 col-md-12 col-lg-12">' + stringNameSource + stringUserNameTimeStartAndEnd + stringFilterSettings + stringProgressBar + stringFileInformation + stringTargetDirectory + modalBodyInformationDownloadFiles() + button + '</div>';
            }

            //вывод информации по выгрузке файлов
            function modalBodyInformationDownloadFiles() {
                let objLoadingStatus = {
                    'not loaded': 'не выполнялся',
                    'in line': 'в очереди',
                    'loaded': 'выполняется',
                    'suspended': 'приостановлен',
                    'expect': 'ожидает',
                    'uploaded': 'выполнен'
                };

                //имя пользователя, время начала фильтрации и ее окончание
                let uploadFiles = (obj.uploadFiles === 'null') ? '' : `импорт файлов: <strong>${objLoadingStatus[obj.uploadFiles]}</strong>`;
                let stringUploadFiles = `<div class="col-sm-4 col-md-4 col-lg-4 text-left" style="padding-left: 40px;">${uploadFiles}</div>`;
                let userName = (obj.userNameStartUploadFiles === 'null') ? '' : 'пользователь: ' + obj.userNameStartUploadFiles;
                if (obj.userNameStopUploadFiles !== 'null') userName = 'пользователь: ' + obj.userNameStartUploadFiles;

                let stringUserNameStartDownload = `<div class="col-sm-8 col-md-8 col-lg-8 text-center">${userName}</div>`;

                //дополнительная информация, имена пользователей остановивших и возобновивших загрузку, процент выполнения загрузки
                let majorInformation = '',
                    stringMajorInformation = '',
                    stringProgressBar = '',
                    stringLookedThisTask = '';

                if (obj.dateTimeStartUploadFiles !== 'null') {
                    let percent = Math.ceil((+obj.countFilesLoaded * 100) / +obj.countFilesFound);

                    let dateTimeEndUploadFiles = (obj.dateTimeEndUploadFiles === 'null') ? '' : getDateTime(obj.dateTimeEndUploadFiles);
                    let dateTimeStopUploadFiles = (obj.dateTimeStopUploadFiles === 'null') ? '' : getDateTime(obj.dateTimeStopUploadFiles);

                    majorInformation += `<div style="margin-top: 10px;">начало: ${getDateTime(obj.dateTimeStartUploadFiles)}</div>`;
                    majorInformation += `<div>окончание: ${dateTimeEndUploadFiles}</div>`;
                    majorInformation += `<div>отмена: ${dateTimeStopUploadFiles}</div>`;
                    majorInformation += `<div style="margin-top: 10px;">всего файлов: ${obj.countFilesFound}</div>`;
                    majorInformation += `<div>файлов загружено: ${obj.countFilesLoaded}</div>`;
                    majorInformation += `<div>файлов загружено с ошибкой: ${obj.countFilesLoadedError}</div>`;

                    let progressBar = `<div class="progress-pie-chart" data-percent="${percent}"><div class="c100 my_settings p${percent}"><span>${percent}%</span><div class="slice"><div class="bar"></div><div class="fill"></div></div></div></div>`;

                    //дополнительная информация
                    stringMajorInformation += `<div class="col-sm-4 col-md-4 col-lg-4 text-left" style="margin-top: 5px;">${majorInformation}</div>`;
                    //индикатор прогресса
                    stringProgressBar += `<div class="col-sm-3 col-md-3 col-lg-3 text-left" style="margin-top: 5px;">${progressBar}</div>`;

                    if (obj.dateTimeLookedThisTask !== 'null') {
                        let informationLooked = `<div style="margin-top: 10px;">файлы рассмотрены в ${getDateTime(obj.dateTimeLookedThisTask)}</div>`;
                        informationLooked += `<div>пользователь:<br>${obj.userNameLookedThisTask}</div>`;
                        //информация о пользователе и времени рассмотрения задачи
                        stringLookedThisTask += `<div class="col-sm-5 col-md-5 col-lg-5 text-left" style="margin-top: 5px;">${informationLooked}</div>`;
                    }
                }

                let stringInformation = stringMajorInformation + stringProgressBar + stringLookedThisTask;

                //директория для скачивания файлов
                let uploadDirectoryFiles = (obj.uploadDirectoryFiles === 'null') ? '' : `<div class="col-sm-12 col-md-12 col-lg-12 text-center" style="margin-top: 15px">директория для хранения загруженных файлов<br><strong>${obj.uploadDirectoryFiles}</strong></div>`;

                let disabledButtonStop, buttonExecute = '';
                if (obj.uploadFiles === 'loaded') {
                    disabledButtonStop = ((obj.userIsImport === true) && (obj.taskImportStop === true)) ? '' : 'disabled="disabled"';

                    buttonExecute = `<button type="submit" data-download="loaded" class="btn btn-danger" ${disabledButtonStop}>Остановить</button>`;
                } else if (obj.uploadFiles === 'suspended') {
                    disabledButtonStop = ((obj.userIsImport === true) && (obj.taskImportResume === true)) ? '' : 'disabled="disabled"';

                    buttonExecute = `<button type="submit" data-download="suspended" class="btn btn-danger" ${disabledButtonStop}>Возобновить</button>`;
                } else if (obj.uploadFiles === 'in line') {
                    disabledButtonStop = ((obj.userIsImport === true) && (obj.taskImportCancel === true)) ? '' : 'disabled="disabled"';

                    buttonExecute = `<button type="submit" data-download="in line" class="btn btn-danger" ${disabledButtonStop}>Отменить</button>`;
                }

                let button = '<div class="col-sm-12 col-md-12 col-lg-12 text-right" style="margin-top: 10px;">' + buttonExecute + '</div>';

                return '<div class="col-sm-12 col-md-12 col-lg-12" style="margin-top: 15px">' + stringUploadFiles + stringUserNameStartDownload + stringInformation + uploadDirectoryFiles + button + '</div>';
            }
        }
    }
}