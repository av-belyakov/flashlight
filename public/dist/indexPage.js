var indexPage =
webpackJsonp_name_([3],{

/***/ 1:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return helpers; });


let helpers = {
    //настраивает высоту отступа для элемента выводящего загрузку сетевых интерфейсов
    loadNetworkMarginTop() {
        let arrayLoadNetwork = document.getElementsByName('loadNetwork');
        if (arrayLoadNetwork.hasOwnProperty('length')) return;

        for (let key in arrayLoadNetwork) {
            let countElements = 0;
            for (let i in arrayLoadNetwork[key].children) {
                countElements++;
            }
            let num = (countElements - 4) / 3;
            let px = '0px';
            if (3 <= num && num <= 5) px = '35px';
            if (1 <= num && num <= 3) px = '40px';

            if (arrayLoadNetwork[key].nodeType === 1) {
                arrayLoadNetwork[key].style.marginTop = px;
            }
        }
    },

    //конвертирование даты и времени из формата Unix в стандартный формат
    getDate(dateUnix) {
        let x = new Date().getTimezoneOffset() * 60000;
        return new Date(+dateUnix - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
    },

    //получить цвет значения
    getColor(number) {
        if (0 <= number && number <= 35) return 'color: #83B4D7;';
        if (36 <= number && number <= 65) return 'color: #9FD783;';
        if (66 <= number && number <= 85) return 'color: #E1E691;';
        if (86 <= number) return 'color: #C78888;';
    },

    //преобразование числа в строку с пробелами после каждой третьей цифры 
    intConvert(nLoad) {
        let newString = nLoad.toString();
        let interimArray = [];
        let countCycles = Math.ceil(newString.length / 3);
        let num = 0;
        for (let i = 1; i <= countCycles; i++) {
            interimArray.push(newString.charAt(newString.length - 3 - num) + newString.charAt(newString.length - 2 - num) + newString.charAt(newString.length - 1 - num));
            num += 3;
        }
        interimArray.reverse();
        return interimArray.join(' ');
    },

    //пересчет в Кбайты, Мбайты и Гбайты
    changeByteSize(byte) {
        if (3 >= byte.length) return '<strong>' + byte + '</strong> байт';else if (3 < byte.length && byte.length <= 6) return '<strong>' + (byte / 1000).toFixed(2) + '</strong> Кбайт';else if (6 < byte.length && byte.length <= 9) return '<strong>' + (byte / 1000000).toFixed(2) + '</strong> Мбайт';else return '<strong>' + (byte / 1000000000).toFixed(2) + '</strong> Гбайт';
    },

    //конвертирование даты и вермени
    dateTimeConvert(dateUnixFormat) {
        let x = new Date().getTimezoneOffset() * 60000;
        return new Date(+dateUnixFormat - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
    },

    //получить не повторяющиеся элементы двух массивов
    getDifferenceArray(arrOne, arrTwo) {
        if (arrOne.length === 0) return arrTwo;
        if (arrTwo.length === 0) return arrOne;

        let result = [];
        if (arrOne.length === arrTwo.length) {
            for (let i = 0; i < arrOne.length; i++) {
                for (let j = 0; j < arrTwo.length; j++) {
                    if (arrOne[i] === arrTwo[j]) {
                        arrOne.splice(i, 1);
                        arrTwo.splice(j, 1);
                    }
                }
            }
            result = arrOne.concat(arrTwo.join(','));
        } else if (arrOne.length < arrTwo.length) {
            let stringOne = arrOne.join(' ');
            arrTwo.filter(item => {
                return stringOne.indexOf(item.toString()) < 0;
            });
        } else {
            let stringOne = arrTwo.join(' ');
            arrOne.filter(item => {
                return stringOne.indexOf(item.toString()) < 0;
            });
        }
        return result;
    },

    //проверка данных полученных от пользователя
    checkInputValidation(elem) {
        let objSettings = {
            'hostId': new RegExp('^[0-9]{1,7}$'),
            'shortNameHost': new RegExp('^[a-zA-Z0-9_№"\\-\\s]{3,15}$'),
            'fullNameHost': new RegExp('^[a-zA-Zа-яА-Яё0-9_№"\\-\\s\\.,]{5,}$'),
            'ipaddress': new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$'),
            'port': new RegExp('^[0-9]{1,5}$'),
            'countProcess': new RegExp('^[0-9]{1}$'),
            'intervalTransmission': new RegExp('^[0-9]{1,}$')
        };
        let pattern = objSettings[elem.name];

        if (elem.name === 'port') {
            if (!(0 <= elem.value && elem.value < 65536)) return false;
        }
        if (elem.name === 'intervalTransmission' && elem.value < 10) return false;
        return !pattern.test(elem.value) ? false : true;
    },

    //генератор токена
    tokenRand() {
        return Math.random().toString(14).substr(2) + Math.random().toString(14).substr(2);
    }
};



/***/ }),

/***/ 11:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createModalWindowFilterResults;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__ = __webpack_require__(6);
/**
 * Формирование модального окна с результатами фильтрации
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */






function createModalWindowFilterResults(obj, objectTimers) {
    let objInformation = obj.information;

    //формируем модальное окно
    creatingNewModalWindow();

    //добавляем данные в модальное окно
    setDataModalWindowFilterResults(objInformation);

    $('#modalWindowTaskFilter').modal('show');

    //добавляем обработчик на кнопку 'остановить' для ОСТАНОВКИ ФИЛЬТРАЦИИ
    let buttonSubmitFilterStop = document.querySelector('.btn-danger[data-filter="filterStop"]');
    if (buttonSubmitFilterStop !== null) buttonSubmitFilterStop.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].stopFilterTask.bind(null, objInformation.taskIndex));

    //добавляем обработчик на кнопку 'возобновить' для ВОЗОБНАВЛЕНИЯ ФИЛЬТРАЦИИ
    let buttonSubmitFilterResume = document.querySelector('.btn-danger[data-filter="filterResume"]');
    if (buttonSubmitFilterResume !== null) buttonSubmitFilterResume.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].resumeFilterTask.bind(null, objInformation.taskIndex, objectTimers));

    //добавляем обработчик на кнопку 'остановить' для ОСТАНОВКИ ЗАГРУЗКИ ФАЙЛОВ
    let buttonSubmitDownloadStop = document.querySelector('.btn-danger[data-download="loaded"]');
    if (buttonSubmitDownloadStop !== null) buttonSubmitDownloadStop.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].stopDownloadFiles.bind(null, objInformation.taskIndex));
    //добавляем обработчик на кнопку 'возобновить' для ВОЗОБНАВЛЕНИЯ ЗАГРУЗКИ ФАЙЛОВ
    let buttonSubmitDownloadResume = document.querySelector('.btn-danger[data-download="suspended"]');
    if (buttonSubmitDownloadResume !== null) buttonSubmitDownloadResume.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].resumeDownloadFiles.bind(null, objInformation.taskIndex));
    //добавляем обработчик на кнопку 'отменить' для ОТМЕНЫ ЗАДАЧИ ПО ВЫГРУЗКЕ ФАЙЛОВ
    let buttonSubmitDpwnloadCancel = document.querySelector('.btn-danger[data-download="in line"]');
    if (buttonSubmitDpwnloadCancel !== null) buttonSubmitDpwnloadCancel.addEventListener('click', __WEBPACK_IMPORTED_MODULE_1__index_page_modalWindowFilterResults__["a" /* default */].cancelDownloadFiles.bind(null, objInformation.taskIndex));

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
            let x = new Date().getTimezoneOffset() * 60000;
            let dateTimeString = new Date(+dateTimeUnix - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
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
                let listIpaddress = ipaddress === 'null' ? '' : ipaddress.replace(new RegExp(',', 'g'), '<br>');
                let network = taskFilterSettings.network + '';
                let listNetwork = network === 'null' ? '' : network.replace(new RegExp(',', 'g'), '<br>');
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
                let listIpaddress = ipaddress === 'null' ? '' : ipaddress.replace(new RegExp(',', 'g'), '<br>');
                let network = taskFilterSettings.network + '';
                let listNetwork = network === 'null' ? '' : network.replace(new RegExp(',', 'g'), '<br>');
                let dateTimeStart = taskFilterSettings.dateTimeStart.split(' ');
                let dateTimeEnd = taskFilterSettings.dateTimeEnd.split(' ');
                let percent = Math.ceil(+obj.countFilesProcessed * 100 / +obj.countFilesFiltering);

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

                let countMaxFilesSize = __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].changeByteSize(obj.countMaxFilesSize);
                let countFoundFilesSize = __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].changeByteSize(obj.countFoundFilesSize);

                let stringFileInformation = '<div class="col-sm-4 col-md-4 col-lg-4" class="text-left" style="margin-top: 10px;">';
                stringFileInformation += `<div style="margin-left: 20px">статус: <strong>фильтрация ${objJobStatus[obj.jobStatus]}</strong></div>`;
                stringFileInformation += `<div style="margin-left: 20px">всего файлов: <strong>${obj.countFilesFiltering}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">общим размером: ${countMaxFilesSize}</div>`;
                stringFileInformation += `<div style="margin-left: 20px">файлов обработанно: <strong>${obj.countFilesProcessed}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">файлов найдено: <strong>${obj.countFilesFound}</strong> шт.</div>`;
                stringFileInformation += `<div style="margin-left: 20px">общим размером: ${countFoundFilesSize}</div>`;
                stringFileInformation += `<div style="margin-left: 20px">фильтруемых директорий: <strong>${obj.countDirectoryFiltering}</strong></div></div>`;

                let stringTargetDirectory = `<div class="col-sm-12 col-md-12 col-lg-12 text-center" style="margin-top: 15px">директория для хранения найденных файлов на источнике<br><strong>${obj.directoryFiltering}</strong></div>`;

                let disabledButton = obj.userIsFilter === false ? 'disabled="disabled"' : '';
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
                let uploadFiles = obj.uploadFiles === 'null' ? '' : `импорт файлов: <strong>${objLoadingStatus[obj.uploadFiles]}</strong>`;
                let stringUploadFiles = `<div class="col-sm-4 col-md-4 col-lg-4 text-left" style="padding-left: 40px;">${uploadFiles}</div>`;
                let userName = obj.userNameStartUploadFiles === 'null' ? '' : 'пользователь: ' + obj.userNameStartUploadFiles;
                if (obj.userNameStopUploadFiles !== 'null') userName = 'пользователь: ' + obj.userNameStartUploadFiles;

                let stringUserNameStartDownload = `<div class="col-sm-8 col-md-8 col-lg-8 text-center">${userName}</div>`;

                //дополнительная информация, имена пользователей остановивших и возобновивших загрузку, процент выполнения загрузки
                let majorInformation = '',
                    stringMajorInformation = '',
                    stringProgressBar = '',
                    stringLookedThisTask = '';

                if (obj.dateTimeStartUploadFiles !== 'null') {
                    let percent = Math.ceil(+obj.countFilesLoaded * 100 / +obj.countFilesFound);

                    let dateTimeEndUploadFiles = obj.dateTimeEndUploadFiles === 'null' ? '' : getDateTime(obj.dateTimeEndUploadFiles);
                    let dateTimeStopUploadFiles = obj.dateTimeStopUploadFiles === 'null' ? '' : getDateTime(obj.dateTimeStopUploadFiles);

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
                let uploadDirectoryFiles = obj.uploadDirectoryFiles === 'null' ? '' : `<div class="col-sm-12 col-md-12 col-lg-12 text-center" style="margin-top: 15px">директория для хранения загруженных файлов<br><strong>${obj.uploadDirectoryFiles}</strong></div>`;

                let disabledButtonStop,
                    buttonExecute = '';
                if (obj.uploadFiles === 'loaded') {
                    disabledButtonStop = obj.userIsImport === true && obj.taskImportStop === true ? '' : 'disabled="disabled"';

                    buttonExecute = `<button type="submit" data-download="loaded" class="btn btn-danger" ${disabledButtonStop}>Остановить</button>`;
                } else if (obj.uploadFiles === 'suspended') {
                    disabledButtonStop = obj.userIsImport === true && obj.taskImportResume === true ? '' : 'disabled="disabled"';

                    buttonExecute = `<button type="submit" data-download="suspended" class="btn btn-danger" ${disabledButtonStop}>Возобновить</button>`;
                } else if (obj.uploadFiles === 'in line') {
                    disabledButtonStop = obj.userIsImport === true && obj.taskImportCancel === true ? '' : 'disabled="disabled"';

                    buttonExecute = `<button type="submit" data-download="in line" class="btn btn-danger" ${disabledButtonStop}>Отменить</button>`;
                }

                let button = '<div class="col-sm-12 col-md-12 col-lg-12 text-right" style="margin-top: 10px;">' + buttonExecute + '</div>';

                return '<div class="col-sm-12 col-md-12 col-lg-12" style="margin-top: 15px">' + stringUploadFiles + stringUserNameStartDownload + stringInformation + uploadDirectoryFiles + button + '</div>';
            }
        }
    }
}

/***/ }),

/***/ 50:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__common__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__common___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_1__common__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__index_page_checkChangeAdminPassword__ = __webpack_require__(51);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__commons_createModalWindowFilterResults__ = __webpack_require__(11);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__index_page_deleteElementInformationFiltering__ = __webpack_require__(52);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__index_page_createWidgetVisualizationFiltration__ = __webpack_require__(53);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__index_page_createWidgetVisualizationDownloadFiles__ = __webpack_require__(54);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__index_page_changeWidget__ = __webpack_require__(55);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_8__index_page_clearMinWidget__ = __webpack_require__(56);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_9__index_page_changeInfoMinWidget__ = __webpack_require__(57);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_10__index_page_modalWindowSourceControl__ = __webpack_require__(58);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_11__index_page_modalWindowFilterResults__ = __webpack_require__(6);
















(function () {
    let timerId = null;

    let objectTimers = {};

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
            let array = __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].getDifferenceArray(arrOne, arrTwo);

            array.forEach(item => {
                //изменяем состояние виджета
                __WEBPACK_IMPORTED_MODULE_7__index_page_changeWidget__["a" /* default */].changeWidgetForDisconnection(item);
            });
        }
    }

    (function () {
        window.onresize = function () {
            let scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);

            let minHeight = scrollHeight - 107;
            document.getElementById('rightContent').setAttribute('style', 'min-height: ' + minHeight + 'px;');
        };
    })();

    //проверка дефолтного пароля администратора
    /*function checkDefaultAdministrationPassword(trigger) {
        if (trigger === true) $('#modalPassAdmin').modal('show');
    }*/

    //обработчики событий
    (function () {
        //пользователь не авторизован
        socket.on('error authentication user', function () {
            window.location.reload();
        });

        socket.on('status list sources', function (data) {
            let statusListSources = data.statusListSources;

            let arrayConnection = [];
            let arrayDisconnection = [];

            for (let sensorId in statusListSources) {
                if (statusListSources[sensorId].statusConnection) arrayConnection.push(sensorId);else arrayDisconnection.push(sensorId);
            }

            arrayConnection.sort();
            arrayDisconnection.sort();

            let objListRemoteHost = {
                connect: arrayConnection,
                disconnect: arrayDisconnection
            };

            let list = '';
            for (let name in objListRemoteHost) {
                let named = name === 'connect' ? 'подключены' : 'недоступны';
                let styleColor = name === 'connect' ? 'color: #9FD783;' : 'color: #C78888;';

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

            Object(__WEBPACK_IMPORTED_MODULE_8__index_page_clearMinWidget__["a" /* default */])(data);
        });

        //информация о ходе фильтрации
        socket.on('filtering execute', function (data) {
            Object(__WEBPACK_IMPORTED_MODULE_5__index_page_createWidgetVisualizationFiltration__["a" /* default */])(data);
        });

        //информация о ходе фильтрации
        socket.on('filtering stop', function (data) {
            objectTimers[data.information.taskIndex] = setTimeout(__WEBPACK_IMPORTED_MODULE_4__index_page_deleteElementInformationFiltering__["a" /* default */].bind(null, data.information.taskIndex), 30000);
        });

        //вывод информационного сообщения
        socket.on('notify information', function (data) {
            let obj = JSON.parse(data.notify);
            showNotify([], [], obj.type, obj.message);
        });

        //вывод подробной информации о задаче на фильтрацию
        socket.on('all information for task index', function (data) {
            Object(__WEBPACK_IMPORTED_MODULE_3__commons_createModalWindowFilterResults__["a" /* default */])(data, objectTimers);
        });

        //обработка сообщения о поступлении новой информации об источнике
        socket.on('new information message', function (data) {
            let divInformationWidget = document.getElementById('modalWindowSource');
            let arrayMinWidgets = document.getElementsByName('minWidget');
            let elemMinWidget = null;

            for (let i = 0; i < arrayMinWidgets.length; i++) {
                if (arrayMinWidgets[i].dataset !== null && arrayMinWidgets[i].dataset.sourceId === data.sourceid) elemMinWidget = arrayMinWidgets[i];
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
        socket.on('all information for source id', function (data) {
            __WEBPACK_IMPORTED_MODULE_10__index_page_modalWindowSourceControl__["a" /* default */].showModalWindowSourceControl(data);
        });

        //вывод информации для виджета
        socket.on('information widgets', function (data) {
            Object(__WEBPACK_IMPORTED_MODULE_9__index_page_changeInfoMinWidget__["a" /* default */])(data);
        });

        //вывод информации о добавлении новой задачи для выгрузки файлов
        socket.on('task upload files added', function (data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                Object(__WEBPACK_IMPORTED_MODULE_6__index_page_createWidgetVisualizationDownloadFiles__["a" /* default */])(data.information);
            }

            document.getElementById('progress:' + data.information.taskIndex).innerHTML = '<h4 class="text-center" style="color: #9FD783;">в очереди</h4>';
            document.getElementById('file_information:' + data.information.taskIndex).style.marginTop = '-10px';
            document.getElementById('file_information:' + data.information.taskIndex).innerHTML = 'Найдено файлов: ' + data.information.countFilesFound;
        });

        //вывод информации о прогрессе в загрузке файла
        socket.on('update the download progress', function (data) {

            console.log('indexPage.js, event "update the download progress"');
            console.log(data);

            if (timerId !== null) clearTimeout(timerId);

            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                Object(__WEBPACK_IMPORTED_MODULE_6__index_page_createWidgetVisualizationDownloadFiles__["a" /* default */])(data.information);
            }

            if (document.getElementById('progress:' + data.information.taskIndex) !== null) {
                let templateProgress = '<div class="progress" style="margin-top: 10px;">';
                templateProgress += `<div class="progress-bar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: ${data.information.fileUploadedPercent}%">${data.information.fileUploadedPercent}%</div></div>`;

                document.getElementById('progress:' + data.information.taskIndex).innerHTML = templateProgress;
            }

            __WEBPACK_IMPORTED_MODULE_1__common___default.a.toolTip();
        });

        //вывод информации об успешной загрузке файла
        socket.on('file successfully downloaded', function (data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                Object(__WEBPACK_IMPORTED_MODULE_6__index_page_createWidgetVisualizationDownloadFiles__["a" /* default */])(data.information);
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

            __WEBPACK_IMPORTED_MODULE_1__common___default.a.toolTip();
        });

        //вывод информации о повторной передачи файлов принятых с ошибкой
        socket.on('file execute retransmission', function (data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                Object(__WEBPACK_IMPORTED_MODULE_6__index_page_createWidgetVisualizationDownloadFiles__["a" /* default */])(data.information);
            }

            let fileName = data.information.fileName.length > 30 ? data.information.fileName.substr(0, 30) + '...' : data.information.fileName;
            document.getElementById('file_information:' + data.information.taskIndex).innerHTML = `<div style="font-size: 9px; color: #C78888;">${fileName}</div>`;
        });

        //вывод информации об успешной загрузке ВСЕХ файлов
        socket.on('all files successfully downloaded', function (data) {
            if (document.getElementById('download:' + data.information.taskIndex) === null) {
                Object(__WEBPACK_IMPORTED_MODULE_6__index_page_createWidgetVisualizationDownloadFiles__["a" /* default */])(data.information);
            }

            document.getElementById('progress:' + data.information.taskIndex).innerHTML = '<h4 class="text-center" style="color: #9FD783;">загрузка завершена</h4>';
            document.getElementById('file_information:' + data.information.taskIndex).innerHTML = 'Загружено файлов: ' + data.information.countFilesLoaded;

            setTimeout(__WEBPACK_IMPORTED_MODULE_4__index_page_deleteElementInformationFiltering__["a" /* default */].bind(null, 'download:' + data.information.taskIndex), 30000);
        });

        //удаление задачи из очереди загрузок
        socket.on('task upload files cancel', function (data) {
            let divTaskIndex = document.getElementById('download:' + data.information.sourceId + ':' + data.information.taskIndex);

            if (divTaskIndex === null) return;

            let parentElem = divTaskIndex.parentElement;
            parentElem.removeChild(divTaskIndex);
        });
    })();

    document.addEventListener('DOMContentLoaded', function () {
        __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].loadNetworkMarginTop();
        __WEBPACK_IMPORTED_MODULE_1__common___default.a.toolTip();

        //добавляем вызов модального окна для вывода информации по источникам
        (function () {
            let div = document.getElementById('listRemoteHostConnection');
            div.addEventListener('click', __WEBPACK_IMPORTED_MODULE_10__index_page_modalWindowSourceControl__["a" /* default */].getAllInformationForSourceControl);
        })();

        //добавляем вызов модального окна для вывода задачи фильтрации
        (function () {
            let divLeftContent = document.getElementById('leftContent');
            divLeftContent.addEventListener('click', __WEBPACK_IMPORTED_MODULE_11__index_page_modalWindowFilterResults__["a" /* default */].getAllInformationForTaskFilterIndexPage);
        })();

        //настраиваем минимальную высоту правого контента (со списком источников)
        (function () {
            let scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
            let minHeight = scrollHeight - 107;
            document.getElementById('rightContent').setAttribute('style', 'min-height: ' + minHeight + 'px;');
        })();

        //проверка пароля администратора, выполняется только при изменении
        let changeAdminPassword = document.getElementById('changeAdminPassword');
        changeAdminPassword.onsubmit = __WEBPACK_IMPORTED_MODULE_2__index_page_checkChangeAdminPassword__["a" /* default */];
    });
})();

/***/ }),

/***/ 51:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 * Модуль проверки изменения пароля администратора
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */



/* harmony default export */ __webpack_exports__["a"] = (function () {
    let elemSpanIconOne = document.getElementById('iconSuccessOne');
    let elemSpanIconTwo = document.getElementById('iconSuccessTwo');

    let parentNodeOne = elemSpanIconOne.parentNode;
    let parentNodeTwo = elemSpanIconTwo.parentNode;

    let inputPasswordOne = document.getElementById('inputPasswordOne');
    let inputPasswordTwo = document.getElementById('inputPasswordTwo');

    function throwError() {
        elemSpanIconOne.classList.add('glyphicon-remove');
        parentNodeOne.classList.add('has-error');
        elemSpanIconOne.classList.remove('glyphicon-ok');
        parentNodeOne.classList.remove('has-success');

        elemSpanIconTwo.classList.add('glyphicon-remove');
        parentNodeTwo.classList.add('has-error');
        elemSpanIconTwo.classList.remove('glyphicon-ok');
        parentNodeTwo.classList.remove('has-success');

        return false;
    }

    if (inputPasswordOne.value.length === 0) return throwError();

    if (inputPasswordTwo.value.length === 0) return throwError();

    if (inputPasswordOne.value !== inputPasswordTwo.value) return throwError();

    return true;
});

/***/ }),

/***/ 52:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 * Модуль удаление элемента визуализирующего ход фильтрации 
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */



/* harmony default export */ __webpack_exports__["a"] = (function (taskIndex) {
  let divTaskIndex = document.getElementById(taskIndex);

  if (divTaskIndex === null) return;

  let parentElem = divTaskIndex.parentElement;
  parentElem.removeChild(divTaskIndex);
});

/***/ }),

/***/ 53:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 * Модуль визуализации фильтрации
 * 
 * Версия 1.0, дата релиза 16.11.2017 
 * */



/* harmony default export */ __webpack_exports__["a"] = (function (objData) {
    let percent = Math.ceil(+objData.information.countFilesProcessed * 100 / +objData.information.countFilesFiltering) + '%';

    let obj = {
        'taskIndex': objData.information.taskIndex,
        'sourceId': objData.information.sourceId,
        'countFilesFound': objData.information.countFilesFound,
        'countFilesFiltering': objData.information.countFilesFiltering,
        'countFilesProcessed': objData.information.countFilesProcessed,
        'percent': percent
    };

    let idTaskIndex = document.getElementById(objData.information.taskIndex);

    if (idTaskIndex === null) createElementInformationFiltering(obj);else changeElementInformationFiltering(obj);
});

//изменение элемента визуализирующего ход фильтрации
function changeElementInformationFiltering(objData) {
    let elementTaskIndex = document.getElementById(objData.taskIndex);
    let divProgressBar = elementTaskIndex.getElementsByClassName('progress-bar')[0];

    divProgressBar.style.width = objData.percent;
    divProgressBar.innerHTML = objData.countFilesProcessed + '/' + objData.countFilesFiltering;
    elementTaskIndex.children[0].lastElementChild.innerHTML = 'Найдено файлов: ' + objData.countFilesFound;
}

//создание елемента визуализирующего ход фильтрации
function createElementInformationFiltering(objData) {
    //создаем заголовок с номером источника
    let divSourceNumber = document.createElement('div');
    divSourceNumber.appendChild(document.createTextNode('Источник №' + objData.sourceId));
    divSourceNumber.classList.add('text-center');

    //создаем шкалу прогресса
    let divProgressBar = document.createElement('div');
    divProgressBar.classList.add('progress-bar');
    divProgressBar.style.width = objData.percent;
    divProgressBar.appendChild(document.createTextNode(objData.countFilesProcessed + '/' + objData.countFilesFiltering));
    divProgressBar.setAttribute('aria-valuenow', 0);
    divProgressBar.setAttribute('aria-valuemin', 0);
    divProgressBar.setAttribute('aria-valuemax', 100);
    let divProgress = document.createElement('div');
    divProgress.classList.add('progress');
    divProgress.style.marginTop = '10px';
    divProgress.appendChild(divProgressBar);

    //создаем элемент с информацией по файлам
    let divFilesInformation = document.createElement('div');
    divFilesInformation.classList.add('text-center');
    divFilesInformation.style.marginTop = '-10px';
    divFilesInformation.innerHTML = 'Найдено файлов: ' + objData.countFilesFound;

    //дополнительный div элемент
    let divTwo = document.createElement('div');
    divTwo.classList.add('col-md-12');
    divTwo.style.color = '#ccd1d9';

    //формируем основной div элемент
    let divOne = document.createElement('div');
    divOne.setAttribute('style', 'margin-bottom: 5px; height: 95px; padding-top: 10px; background: white; box-shadow: 1px 1px 1px grey; cursor: pointer');
    divOne.setAttribute('id', objData.taskIndex);
    divOne.setAttribute('data-source-id', objData.taskIndex);

    divTwo.appendChild(divSourceNumber);
    divTwo.appendChild(divProgress);
    divTwo.appendChild(divFilesInformation);
    divOne.appendChild(divTwo);

    let leftContent = document.getElementById('leftContent');
    leftContent.appendChild(divOne);
}

/***/ }),

/***/ 54:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 * Модуль создания виджета визуализирующего загрузку файлов
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */



/* harmony default export */ __webpack_exports__["a"] = (function (objData) {
    //создаем заголовок с номером источника
    let divSourceNumber = document.createElement('div');
    divSourceNumber.appendChild(document.createTextNode('Источник №' + objData.sourceId));
    divSourceNumber.classList.add('text-center');

    //подзаголовок с кратким описанием источника
    let divSourceShortName = document.createElement('div');
    divSourceShortName.appendChild(document.createTextNode(objData.shortName));
    divSourceShortName.classList.add('text-center');

    //создаем место где в дальнейшем будет распологатся шкала прогресса
    let divProgress = document.createElement('div');
    divProgress.setAttribute('id', 'progress:' + objData.taskIndex);

    //создаем элемент с информацией по файлам
    let divFilesInformation = document.createElement('div');
    divFilesInformation.classList.add('text-center');
    divFilesInformation.style.marginTop = '-10px';
    divFilesInformation.setAttribute('id', 'file_information:' + objData.taskIndex);

    //дополнительный div элемент
    let divTwo = document.createElement('div');
    divTwo.classList.add('col-md-12');
    divTwo.style.color = '#ccd1d9';

    //формируем основной div элемент
    let divOne = document.createElement('div');
    divOne.setAttribute('style', 'margin-bottom: 5px; height: 110px; padding-top: 10px; background: white; box-shadow: 1px 1px 1px grey; cursor: pointer');
    divOne.setAttribute('id', 'download:' + objData.taskIndex);
    divOne.setAttribute('data-source-id', objData.taskIndex.split(':')[1]);

    divTwo.appendChild(divSourceNumber);
    divTwo.appendChild(divSourceShortName);
    divTwo.appendChild(divProgress);
    divTwo.appendChild(divFilesInformation);
    divOne.appendChild(divTwo);

    let leftContent = document.getElementById('leftContent');
    leftContent.appendChild(divOne);
});

/***/ }),

/***/ 55:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers_js__ = __webpack_require__(1);
/*
 * Модуль изменяющий виджет сенсора
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */





/* harmony default export */ __webpack_exports__["a"] = ({
    //изменить виджет при отключении сенсора
    changeWidgetForDisconnection(sourceId) {
        let divSourceId = document.getElementsByName(sourceId);

        if (typeof divSourceId[0] === 'undefined') return;

        divSourceId[0].innerHTML = '<div class="text-center"><div class=" text-center"><h4>источник не подключен</h4></div></div>';
    }
});

/***/ }),

/***/ 56:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 * Модуль очистки виджета в котором содержитсякраткая информация о сенсоре.
 * срабатывает при отключении источника
 * 
 * Версия 0.1, дата релиза 18.06.2018
 * */



/* harmony default export */ __webpack_exports__["a"] = (function (listSources) {
    let listWidgets = document.querySelectorAll('[name=minWidget]');

    for (let source in listSources.statusListSources) {
        listWidgets.forEach(element => {
            if (element.dataset.sourceid === null) return;

            if (source === element.dataset.sourceid) {
                if (!listSources.statusListSources[source].statusConnection) {
                    element.innerHTML = `<div class="white-panel pn donut-chart" name="minWidget" data-sourceId="${source}">
                        <div class="white-header"><h5>${source} ${listSources.statusListSources[source].detailedDescription}</h5></div>
                            <div class="row">
                                <div class="col-sm-12 col-xs-12 goleft" name="${source}">
                                    <div class="text-center"><h4>источник не подключен</h4></div>
                                </div>
                            </div>
                        </div>`;
                }
            }
        });
    }
});

/***/ }),

/***/ 57:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(1);
/*
 * Модуль изменения виджета с краткой информацией о сенсоре
 * 
 * Версия 0.1, дата релиза 11.04.2018
 * */





/* harmony default export */ __webpack_exports__["a"] = (function (objData) {
    let information = objData.information;

    let localDateTime = information.current_date_time;
    let dateTimeReceived = information.date_time_received;

    let usedDiskSpace = '<div style="margin-top: 5px;">' + '<div class="text-center"><strong>Объём дискового пространства</strong></div>' + '<div class="text-center" style="margin-left: 2px; margin-right: 2px;">';

    information.disk_space.forEach(function (item) {
        let used = parseInt(item.used);

        usedDiskSpace += `<strong style="font-size: 18px; ${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].getColor(used)}" 
            data-toggle="tooltip" data-placement="bottom" 
            title="точка монтирования ${item.mounted}"> ${item.used} </strong>`;
    });

    let networkInterface = '<div name="loadNetwork" class="text-center" style="font-size 10px;">' + '<div class="text-center"><strong>Загрузка сетевых интерфейсов</strong></div>' + '<div class="col-sm-2"> </div><div class="col-sm-5">TX Кбит/с</div><div class="col-sm-5">RX Кбит/с</div>';

    for (let nInterface in information.load_network) {
        networkInterface += `<div class="col-sm-2">${nInterface}</div>
        <div class="col-sm-5">${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(information.load_network[nInterface].TX)}</div>
        <div class="col-sm-5">${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(information.load_network[nInterface].RX)}</div>`;
    }

    let loadRAM = (+information.random_access_memory.used * 100 / +information.random_access_memory.total).toFixed(2);

    let cpuAndRam = `<div style="margin-top: 5px;">
        <div class="col-sm-6 text-center">CPU <strong style="${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].getColor(information.load_cpu)}">${information.load_cpu}%</strong></div>
        <div class="col-sm-6 text-center">RAM <strong style="${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].getColor(loadRAM)}">${loadRAM}%</strong></div></div>`;

    let divSourceId = document.getElementsByName(information.sourceId);

    if (divSourceId.length === 0) return;

    divSourceId[0].innerHTML = `<div class="text-center"><div style="margin-top: -10px;">
        <small>Данные получены в ${dateTimeReceived.slice(-8)}</small></div>
        <div>Локальное время источника:</div><div style="font-size: 16px;"><strong>${localDateTime}</strong></div></div>
        ${usedDiskSpace}</div>${cpuAndRam} ${networkInterface}</div></div>`;

    __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].loadNetworkMarginTop();

    // инициализировать элемент, имеющий идентификатор tooltip, как компонент tooltip
    $('[data-toggle="tooltip"]').tooltip();
});

/***/ }),

/***/ 58:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__common_helpers_networkCalc__ = __webpack_require__(59);
/*
 * Модуль для формирования модального окна для выбранного источника, 
 * позволяет
 * - получить подробную информацию об источнике
 * - добавить задание на фильтрацию
 *
 * Версия 1.0, релиз 10.11.2017
 * */






/* harmony default export */ __webpack_exports__["a"] = ({
    getAllInformationForSourceControl(event) {
        if (event.target.tagName !== 'A') return;
        let sourceId = event.target.dataset.sourceId;

        let mainDiv = document.getElementById('modalWindowSource');

        if (mainDiv !== null && mainDiv.style.display === 'none') mainDiv.parentElement.removeChild(mainDiv);

        socket.emit('get all information for source id', { processingType: 'showInformationSource', sourceId: sourceId });
    },
    showModalWindowSourceControl(obj) {
        let objInformation = obj.information;
        let mainDiv = document.getElementById('modalWindowSource');

        if (mainDiv === null || mainDiv.dataset === null || mainDiv.dataset.sourceId === null) {

            //формируем модальное окно
            creatingModalWindow();
            //обработчик динамических вкладок
            handleDynamicTabs();
            //добавляем данные в модальное окно
            setDataModalWindow(objInformation);
            $('#modalWindowSource').modal('show');

            //добавляем обработчик на кнопку 'сохранить'
            let buttonSubmit = document.getElementById('buttonSubmit');

            if (buttonSubmit !== null) buttonSubmit.addEventListener('click', sendData.bind(null, objInformation.sourceId));
        } else {
            let sourceId = document.getElementById('modalWindowSource').dataset.sourceId;

            if (sourceId !== null && sourceId === objInformation.sourceId) {
                //добавляем данные в модальное окно
                formingPanelInformation(objInformation);
            }
        }
    }
});

//формирование модального окна
function creatingModalWindow() {
    /* удаляем модальное окно */
    let oldModalWindow = document.getElementById('modalWindowSource');
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
    divBody.innerHTML = '<ul id="myTab" class="nav nav-tabs"><li class="active"><a class="tabnav" data-toggle="tab" href="#panel1">Информация</a></li>' + '<li><a class="tabnav" data-toggle="tab" href="#panel2">Фильтрация</a></li></ul>' + '<div class="tab-content"><div id="panel1" class="tab-pane fade in active"></div>' + '<div id="panel2" class="tab-pane fade"></div><div id="panel3" class="tab-pane fade"></div></div>';

    /* основное модальное окно */
    let divModalWindow = document.createElement('div');
    divModalWindow.classList.add('modal');
    divModalWindow.classList.add('fade');
    divModalWindow.setAttribute('id', 'modalWindowSource');
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

//обработчик динамических вкладок
function handleDynamicTabs() {
    $(document).ready(function () {
        $("#myTab a").click(function (e) {
            e.preventDefault();
            $(this).tab('show');
        });
    });
}

//добавляем данные в модальное окно
function setDataModalWindow(objInformation) {
    /* заголовок */
    let modalWindow = document.getElementById('modalWindowSource');
    modalWindow.dataset.sourceId = objInformation.sourceId;
    let modalWindowHeader = modalWindow.querySelector('.modal-title');
    let informationData = '';
    if (objInformation.date_time_received !== undefined) {
        let dateTime = objInformation.date_time_received.split(' ');
        let onlyDate = dateTime[0].split('-');
        informationData = ` информация на ${dateTime[1]} ${onlyDate[2]}.${onlyDate[1]}.${onlyDate[0]}`;
    }
    modalWindowHeader.innerHTML = `Источник №${objInformation.sourceId} (${objInformation.name_source}) ${informationData}`;

    /* панель Информация */
    formingPanelInformation(objInformation);

    /* панель Фильтрация */
    formingPanelFiltering(objInformation);

    /* панель Сетевой трафик */
    //formingPanelloadNetworkTraffic(objInformation);
}

//добавляем информацию во вкладку 'Информация'
function formingPanelInformation(objInformation) {
    let divPanelInformation = document.getElementById('panel1');
    if (objInformation.date_time_received === undefined) {
        divPanelInformation.innerHTML = '<br><h3 style="margin-left: 35px;">информация недоступна</h3>';
        return;
    }
    let clearFix = '<div class="clearfix visible-md-block"></div><div class="col-md-12"><br></div>';

    //заголовок
    let descriptionSource = '<br><div class=" col-sm-12 col-md-12 col-lg-12"><div class="text-center"><strong>' + objInformation.description + '</strong> (IP-адрес ' + objInformation.ipaddress + ')</div>';
    descriptionSource += '<div class="text-center"><small>локальное время источника ' + objInformation.current_date_time + '</small></div></div>';

    //ЦПУ и ОП
    let ram = objInformation.random_access_memory;
    let informationCpuAndRam = `<br><div class="col-sm-5 col-md-5 col-lg-5"><div class="text-center">Загрузка центрального процессора<br><strong>${objInformation.load_cpu}%</strong></div></div>`;
    informationCpuAndRam += '<div class="col-sm-7 col-md-7 col-lg-7"><div class="text-center">Оперативная память (Кб)<br>всего: ';
    informationCpuAndRam += `<strong>${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(ram.total)}</strong>, используется: <strong>${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(ram.used)}</strong>, свободно: <strong>${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(ram.free)}</strong></div></div>`;

    //сетевые интерфейсы
    let networkInterface = '<div class="col-sm-5 col-md-5 col-lg-5"><div class="text-center"><div>Загрузка сетевых интерфейсов (Кбит/с)</div>' + '<div class="col-sm-2"><small> </small></div><div class="col-sm-5"><small>передано</small></div><div class="col-sm-5"><small>принято</small></div>';
    for (let netInterface in objInformation.load_network) {
        let TX = objInformation.load_network[netInterface].TX !== 0 ? `<strong>${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(objInformation.load_network[netInterface].TX)}</strong>` : objInformation.load_network[netInterface].TX;
        let RX = objInformation.load_network[netInterface].RX !== 0 ? `<strong>${__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].intConvert(objInformation.load_network[netInterface].RX)}</strong>` : objInformation.load_network[netInterface].RX;

        networkInterface += `<div class="col-sm-2">${netInterface}</div>`;
        networkInterface += `<div class="col-sm-5">${TX}</div>`;
        networkInterface += `<div class="col-sm-5">${RX}</div>`;
    }
    networkInterface += '</div></div>';

    //дисковое пространство
    let diskSpace = '<div class="col-sm-7 col-md-7 col-lg-7"><div class="text-center"><div>Дисковое пространство</div>' + '<div class="col-sm-3"><small>имя</small></div><div class="col-sm-3"><small>монтирование</small></div><div class="col-sm-3"><small>объем</small></div><div class="col-sm-3"><small>использование</small></div>';

    for (let i = 0; i < objInformation.disk_space.length; i++) {
        let disk = objInformation.disk_space[i];
        if (!disk.hasOwnProperty('diskName') || !disk.hasOwnProperty('mounted')) continue;
        if (!disk.hasOwnProperty('maxSpace') || !disk.hasOwnProperty('used')) continue;

        diskSpace += `<div class="col-sm-3">${disk.diskName}</div><div class="col-sm-3">${disk.mounted}</div><div class="col-sm-3">${disk.maxSpace}</div><div class="col-sm-3"><strong>${disk.used}</strong></div>`;
    }

    diskSpace += '</div></div>';

    //временной интервал файлов сетевого трафика
    let x = new Date().getTimezoneOffset() * 60000;

    let timeInterval = '<div class="col-sm-12 col-md-12 col-lg-12"><div class="text-center">Временной интервал файлов сетевого трафика</div>';
    timeInterval += '<table class="table table-striped table-hover table-sm"><thead>';
    timeInterval += '<tr><th class="text-center">директория</th><th class="text-center">с</th><th class="text-center">по</th>';
    timeInterval += '<th class="text-center">количество суток</th></tr></thead><tbody>';

    for (let folder in objInformation.time_interval) {
        let dateMin = objInformation.time_interval[folder].dateMin;
        let dateMax = objInformation.time_interval[folder].dateMax;

        if (typeof dateMin === 'undefined' || typeof dateMax === 'undefined') continue;

        let dateMinString = new Date(+dateMin - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
        let dateMaxString = new Date(+dateMax - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
        let countDays = ((dateMax - dateMin) / 86400000).toFixed(1);
        timeInterval += `<tr><td>${folder}</td><td class="text-center">${dateMinString}</td><td class="text-center">${dateMaxString}</td><td class="text-center">${countDays}</td></tr>`;
    }
    timeInterval += '<tbody></table></div>';

    divPanelInformation.innerHTML = descriptionSource + clearFix + informationCpuAndRam + clearFix + networkInterface + diskSpace + clearFix + timeInterval;
}

//формируем вкладку с помощью которой готовится задание на фильтрацию
function formingPanelFiltering(objInformation) {
    let divPanelInformation = document.getElementById('panel2');

    if (objInformation.connection === false) {
        divPanelInformation.innerHTML = '<br><h3 style="margin-left: 35px;">фильтрация невозможна, нет доступа к источнику</h3>';
        return;
    }

    if (objInformation.isAuthorization === false) {
        divPanelInformation.innerHTML = '<br><h3 style="margin-left: 35px;">ошибка авторизации, нет доступа к источнику</h3>';
        return;
    }

    function formingSelectNetMask() {
        let select = '<select class="form-control" id="selectNetMask">';
        select += '<option value="32">32</option>';
        let num = 31;

        while (num !== 0) {
            select += `<option value="${num}">${num}</option>`;
            num--;
        }

        select += '</select>';
        return select;
    }

    //поля для выбора даты и времени
    let dateTimePicker = '<div class="text-center">временной интервал (день.месяц.год час:минута)</div><div class="col-md-6">';
    dateTimePicker += '<p class="text-left"><small>начало</small></p><div class="form-group"><div class="input-group date" id="dateTimeStart">';
    dateTimePicker += '<input type="text" class="form-control text-center" name="dateTimeStart"/><span class="input-group-addon">';
    dateTimePicker += '<span class="glyphicon glyphicon-calendar"></span></span></div></div></div>';
    dateTimePicker += '<div class="col-md-6 text-center"><p class="text-left"><small>окончание</small></p><div class="form-group"><div class="input-group date" id="dateTimeEnd">';
    dateTimePicker += '<input type="text" class="form-control text-center" name="dateTimeEnd"/><span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span>';
    dateTimePicker += '</span></div></div></div></div>';

    //перечень ip-адресов
    let listIpAddress = '<p class="text-center">IP-адрес или подсеть</p>';
    listIpAddress += '<div class="col-sm-12 col-md-12 col-lg-12"><div class="form-group"><input type="text" id="ipaddress" class="form-control input-xs"/></diV></div>';

    //кнопки
    let buttons = '<div class="col-sm-12 col-md-12 col-lg-12 text-right" style="margin-top: 15px;"><button type="button" class="btn btn-default" data-dismiss="modal" style="margin-right: 5px;">Закрыть</button>';
    buttons += '<button type="submit" class="btn btn-primary" id="buttonSubmit">Сохранить</button></div>';

    //вспомогательное поле подсчета диапазона подсетей
    let auxiliaryField = '<p class="text-center">расчитать диапазон ip-адресов</p>';
    auxiliaryField += '<div class="col-xs-5">';
    auxiliaryField += '<div class="col-xs-8"><div class="input-group"><input type="text" class="form-control" id="network"><span class="glyphicon form-control-feedback"></span></div></div>';
    auxiliaryField += `<div class="col-xs-4 text-left">${formingSelectNetMask()}</div><div class="col-xs-2" style="margin-top: 10px;"><button type="button" class="btn btn-info" id="buttonCountingNetworkRange">Подсчет</button></div></div>`;
    auxiliaryField += '<div class="col-xs-7" id="tableNetworkRange"></div>';

    divPanelInformation.innerHTML = '<br><div class="col-md-12">' + dateTimePicker + listIpAddress + buttons + auxiliaryField + '</div>';

    $(function () {
        $('#dateTimeStart').datetimepicker({
            locale: 'ru'
        });

        $('#dateTimeEnd').datetimepicker({
            locale: 'ru'
        });
    });

    $('#ipaddress').on('tokenfield:createdtoken', function (e) {
        checkChangeInputIpAddress();
        let patternIp = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$');
        let patternNet = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)/[0-9]{1,2}$');

        let inputValue = e.attrs.value;
        let isNetwork = inputValue.split('/');

        if (isNetwork.length > 0 && isNetwork[1] > 32) {
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
    }).on('tokenfield:removedtoken', function (e) {
        checkChangeInputIpAddress();
    }).tokenfield();

    let buttonCountingNetworkRange = document.getElementById('buttonCountingNetworkRange');
    buttonCountingNetworkRange.onclick = countingNetworkRange;
}

//проверка изменений в поле ввода
function checkChangeInputIpAddress() {
    let divParentNode = document.getElementById('ipaddress');
    let tokenInvalid = divParentNode.parentNode.getElementsByClassName('invalid');
    let token = divParentNode.parentNode.getElementsByClassName('token');

    if (token.length === 0) {
        divParentNode.parentNode.parentNode.classList.remove('has-error');
        divParentNode.parentNode.parentNode.classList.remove('has-success');
    }

    if (tokenInvalid.length === 0 && token.length > 0) {
        divParentNode.parentNode.parentNode.classList.remove('has-error');
        divParentNode.parentNode.parentNode.classList.add('has-success');
    }
}

//подсчет диапазона подсетей
function countingNetworkRange() {
    let patternIp = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$');

    let divSelectNetworkMask = document.getElementById('selectNetMask');
    let divNetwork = document.getElementById('network');

    let valueNetworkMask = divSelectNetworkMask.options[divSelectNetworkMask.options.selectedIndex].value;
    let valueNetwork = divNetwork.value;

    let isIp = patternIp.test(valueNetwork);
    let divNetworkInput = document.getElementById('network');

    divNetworkInput.parentNode.classList.remove('has-error');
    divNetworkInput.nextElementSibling.classList.remove('glyphicon-remove');

    if (!isIp) {
        divNetworkInput.parentNode.classList.add('has-error');
        divNetworkInput.nextElementSibling.classList.add('glyphicon-remove');
    } else {
        let ip4Address = new __WEBPACK_IMPORTED_MODULE_1__common_helpers_networkCalc__["a" /* IPv4_Address */](valueNetwork, valueNetworkMask);
        let countIpAddress = parseFloat(ip4Address.netbcastInteger) - parseFloat(ip4Address.netaddressInteger) + 1;

        let divResult = '<div class="col-sm-3 col-md-3 col-lg-3"></div><div class="col-sm-4 col-md-4 col-lg-4 text-center"><strong>string</strong></div><div class="col-sm-5 col-md-5 col-lg-5 text-center"><strong>integer</strong></div>';
        divResult += `<div class="col-sm-3 col-md-3 col-lg-3">ip-address</div><div class="col-sm-4 col-md-4 col-lg-4 text-center">${valueNetwork}</div><div class="col-sm-5 col-md-5 col-lg-5 text-center">${ip4Address.addressInteger}</div>`;
        divResult += `<div class="col-sm-3 col-md-3 col-lg-3">network</div><div class="col-sm-4 col-md-4 col-lg-4 text-center">${ip4Address.netaddressDotQuad}</div><div class="col-sm-5 col-md-5 col-lg-5 text-center">${ip4Address.netaddressInteger}</div>`;
        divResult += `<div class="col-sm-3 col-md-3 col-lg-3">broadcast</div><div class="col-sm-4 col-md-4 col-lg-4 text-center">${ip4Address.netbcastDotQuad}</div><div class="col-sm-5 col-md-5 col-lg-5 text-center">${ip4Address.netbcastInteger}</div>`;
        divResult += `<div class="col-md-12"><strong>количество ip-адресов: ${countIpAddress}</strong></div>`;

        let tableNetworkRange = document.getElementById('tableNetworkRange');
        tableNetworkRange.innerHTML = divResult;
    }
}

function sendData(sourceId) {
    let parentInputIp = document.querySelector('.tokenfield').parentNode;
    changeColorDateTimeInput(false);

    let dateTimeStart = document.querySelector('#dateTimeStart input');
    let dateTimeEnd = document.querySelector('#dateTimeEnd input');

    let tokens = document.querySelectorAll('.tokenfield > .token');
    let dateTimeStartExists = dateTimeStart.value.length === 0;
    let dateTimeEndExists = dateTimeEnd.value.length === 0;

    //поля даты не должны быть пустыми
    if (dateTimeStartExists || dateTimeEndExists) {
        changeColorDateTimeInput(true);
        return false;
    }

    //начальное время не должно быть больше или равно конечному
    if (+new Date(dateTimeStart.value) >= +new Date(dateTimeEnd.value)) {
        changeColorDateTimeInput(true);
        return false;
    }

    if (tokens.length === 0) {
        parentInputIp.classList.add('has-error');
        return false;
    }

    let tokensInvalid = document.querySelectorAll('.tokenfield > .invalid');
    if (tokensInvalid.length > 0) return false;
    parentInputIp.classList.remove('has-error');

    let result = {
        'sourceId': sourceId,
        'dateTimeStart': dateTimeStart.value,
        'dateTimeEnd': dateTimeEnd.value,
        'ipOrNetwork': getInputFieldIpAddress()
    };

    socket.emit('add start filter', { processingType: 'startFilter', filterTask: result });

    $('#modalWindowSource').modal('hide');

    let modalWindowSource = document.getElementById('modalWindowSource');
    modalWindowSource.parentElement.removeChild(modalWindowSource);
}

//выделяем поля даты и времени
function changeColorDateTimeInput(trigger) {
    let divDateTimeStart = document.getElementById('dateTimeStart');
    let divDateTimeEnd = document.getElementById('dateTimeEnd');
    if (trigger) {
        divDateTimeStart.parentNode.classList.add('has-error');
        divDateTimeEnd.parentNode.classList.add('has-error');
    } else {
        divDateTimeStart.parentNode.classList.remove('has-error');
        divDateTimeEnd.parentNode.classList.remove('has-error');
    }
}

//получить список ip-адресов или сетей
function getInputFieldIpAddress() {
    let content = document.querySelectorAll('.tokenfield > .token > span');
    let result = [];

    for (let i = 0; i < content.length; i++) {
        result.push(content[i].textContent);
    }
    return result.join(',');
}

/***/ }),

/***/ 59:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return IPv4_Address; });
/*
 Copyright (c) 2010, Michael J. Skora
 All rights reserved.
 Source: http://www.umich.edu/~parsec/information/code/ip_calc.js.txt

 Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 * Redistributions of source code packaged with any other code to form a distributable product must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 * Neither the name of the author or other identifiers used by the author (such as nickname or avatar) may be used to endorse or promote products derived from this software without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */



function IPv4_Address(addressDotQuad, netmaskBits) {
    let split = addressDotQuad.split('.', 4);
    let byte1 = Math.max(0, Math.min(255, parseInt(split[0]))); /* sanity check: valid values: = 0-255 */
    let byte2 = Math.max(0, Math.min(255, parseInt(split[1])));
    let byte3 = Math.max(0, Math.min(255, parseInt(split[2])));
    let byte4 = Math.max(0, Math.min(255, parseInt(split[3])));

    if (isNaN(byte1)) byte1 = 0; /* fix NaN situations */
    if (isNaN(byte2)) byte2 = 0;
    if (isNaN(byte3)) byte3 = 0;
    if (isNaN(byte4)) byte4 = 0;

    addressDotQuad = byte1 + '.' + byte2 + '.' + byte3 + '.' + byte4;

    this.addressDotQuad = addressDotQuad.toString();
    this.netmaskBits = Math.max(0, Math.min(32, parseInt(netmaskBits))); /* sanity check: valid values: = 0-32 */

    this.addressInteger = IPv4_dotquadA_to_intA(this.addressDotQuad);
    //	this.addressDotQuad  = IPv4_intA_to_dotquadA( this.addressInteger );
    this.addressBinStr = IPv4_intA_to_binstrA(this.addressInteger);

    this.netmaskBinStr = IPv4_bitsNM_to_binstrNM(this.netmaskBits);
    this.netmaskInteger = IPv4_binstrA_to_intA(this.netmaskBinStr);
    this.netmaskDotQuad = IPv4_intA_to_dotquadA(this.netmaskInteger);

    this.netaddressBinStr = IPv4_Calc_netaddrBinStr(this.addressBinStr, this.netmaskBinStr);
    this.netaddressInteger = IPv4_binstrA_to_intA(this.netaddressBinStr);
    this.netaddressDotQuad = IPv4_intA_to_dotquadA(this.netaddressInteger);

    this.netbcastBinStr = IPv4_Calc_netbcastBinStr(this.addressBinStr, this.netmaskBinStr);
    this.netbcastInteger = IPv4_binstrA_to_intA(this.netbcastBinStr);
    this.netbcastDotQuad = IPv4_intA_to_dotquadA(this.netbcastInteger);
};

/* In some versions of JavaScript subnet calculators they use bitwise operations to shift the values left. Unfortunately JavaScript converts to a 32-bit signed integer when you mess with bits, which leaves you with the sign + 31 bits. For the first byte this means converting back to an integer results in a negative value for values 128 and higher since the leftmost bit, the sign, becomes 1. Using the 64-bit float allows us to display the integer value to the user. */
/* dotted-quad IP to integer */
function IPv4_dotquadA_to_intA(strbits) {
    let split = strbits.split('.', 4);
    let myInt = parseFloat(split[0] * 16777216) /* 2^24 */ + parseFloat(split[1] * 65536) /* 2^16 */ + parseFloat(split[2] * 256) /* 2^8  */ + parseFloat(split[3]);
    return myInt;
}

/* integer IP to dotted-quad */
function IPv4_intA_to_dotquadA(strnum) {
    let byte1 = strnum >>> 24;
    let byte2 = strnum >>> 16 & 255;
    let byte3 = strnum >>> 8 & 255;
    let byte4 = strnum & 255;
    return byte1 + '.' + byte2 + '.' + byte3 + '.' + byte4;
}

/* integer IP to binary string representation */
function IPv4_intA_to_binstrA(strnum) {
    let numStr = strnum.toString(2); /* Initialize return value as string */
    let numZeros = 32 - numStr.length; /* Calculate no. of zeros */

    if (numZeros > 0) {
        for (let i = 1; i <= numZeros; i++) {
            numStr = '0' + numStr;
        }
    }

    return numStr;
}

/* binary string IP to integer representation */
function IPv4_binstrA_to_intA(binstr) {
    return parseInt(binstr, 2);
}

/* convert # of bits to a string representation of the binary value */
function IPv4_bitsNM_to_binstrNM(bitsNM) {
    let bitString = '';
    let numberOfOnes = bitsNM;

    while (numberOfOnes--) bitString += '1'; /* fill in ones */
    let numberOfZeros = 32 - bitsNM;
    while (numberOfZeros--) bitString += '0'; /* pad remaining with zeros */

    return bitString;
}

/* The IPv4_Calc_* functions operate on string representations of the binary value because I don't trust JavaScript's sign + 31-bit bitwise functions. */
/* logical AND between address & netmask */
function IPv4_Calc_netaddrBinStr(addressBinStr, netmaskBinStr) {
    let netaddressBinStr = '';
    let aBit = 0;
    let nmBit = 0;
    for (let pos = 0; pos < 32; pos++) {
        aBit = addressBinStr.substr(pos, 1);
        nmBit = netmaskBinStr.substr(pos, 1);
        if (aBit == nmBit) {
            netaddressBinStr += aBit.toString();
        } else {
            netaddressBinStr += '0';
        }
    }
    return netaddressBinStr;
}

/* logical OR between address & NOT netmask */
function IPv4_Calc_netbcastBinStr(addressBinStr, netmaskBinStr) {
    let netbcastBinStr = '';
    let aBit = 0;
    let nmBit = 0;
    for (let pos = 0; pos < 32; pos++) {
        aBit = parseInt(addressBinStr.substr(pos, 1));
        nmBit = parseInt(netmaskBinStr.substr(pos, 1));

        if (nmBit) nmBit = 0; /* flip netmask bits */
        else nmBit = 1;

        if (aBit || nmBit) netbcastBinStr += '1';else netbcastBinStr += '0';
    }
    return netbcastBinStr;
}

/* included as an example alternative for converting 8-bit bytes to an integer in IPv4_dotquadA_to_intA */
function IPv4_BitShiftLeft(mask, bits) {
    return mask * Math.pow(2, bits);
}

/* used for display purposes */
function IPv4_BinaryDotQuad(binaryString) {
    return binaryString.substr(0, 8) + '.' + binaryString.substr(8, 8) + '.' + binaryString.substr(16, 8) + '.' + binaryString.substr(24, 8);
}



/***/ }),

/***/ 6:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/*
 * Модуль для создания модального окна вывода информации по выбранному заданию фильтрациии
 *
 * Версия 1.0, релиз 10.11.2017
 * */



/* harmony default export */ __webpack_exports__["a"] = ({
    //генерируем запрос всей информации по задаче (ДЛЯ ГЛАВНОЙ СТРАНИЦЫ)
    getAllInformationForTaskFilterIndexPage(event) {
        if (event.target.tagName !== 'DIV') return;

        let divLeftContent = document.getElementById('leftContent');
        let target = event.target;

        while (target !== divLeftContent) {
            if (target.dataset.hasOwnProperty('sourceId')) {
                let taskIndex = target.dataset.sourceId;

                //генерируем событие (запрос всей информации)
                socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
                return;
            }
            target = target.parentNode;
        }
    },

    //генерируем запрос всей информации по задаче (ДЛЯ СТРАНИЦЫ УЧЕТА ЗАДАНИЙ НА ФИЛЬТРАЦИЮ)
    getAllInformationForTaskFilterJobLogPage(taskIndex) {
        socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
    },

    //запрос на останов задачи фильтрации
    stopFilterTask(taskIndex) {
        socket.emit('request to stop the task filter', { processingType: 'stopTaskFilter', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на возобновление выполнения задачи по фильтрации
    resumeFilterTask(taskIndex, objectTimers) {
        socket.emit('request to resume the task filter', { processingType: 'resumeTaskFilter', taskIndex: taskIndex });

        if (objectTimers && taskIndex in objectTimers) {
            clearTimeout(objectTimers[taskIndex]);
            delete objectTimers[taskIndex];
        }

        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на останов загрузки файлов
    stopDownloadFiles(taskIndex) {
        socket.emit('stop download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на возобновление загрузки файлов
    resumeDownloadFiles(taskIndex) {
        socket.emit('resume download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на отмену задачи по загрузки файлов
    cancelDownloadFiles(taskIndex) {
        socket.emit('cancel download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    }
});

/***/ })

},[50]);
//# sourceMappingURL=indexPage.js.map