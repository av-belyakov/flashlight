var settingSourcesPage =
webpackJsonp_name_([4],{

/***/ 0:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return showNotify; });
/**
 * Общий вид сообщений
 * 
 * Версия 0.1, дата релиза 23.11.2017
 */



let showNotify = function (type, message) {
    $.notify({
        message: message
    }, {
        type: type,
        placement: { from: 'top', align: 'right' },
        offset: { x: 0, y: 60 }
    });
};



/***/ }),

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

    //конвертирование даты и вермени из формата Unix в стандартный формат
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
            'shortNameHost': new RegExp('^[a-zA-Z0-9_\\-\\s]{3,15}$'),
            'fullNameHost': new RegExp('^[a-zA-Zа-яА-Яё0-9_\\-\\s\\.,]{5,}$'),
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

/***/ 22:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = getFormElements;
/**
 * Модуль возвращающий объект с данными формы источника
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */



function getFormElements() {
    return {
        'hostId': document.getElementsByName('hostId')[0],
        'shortNameHost': document.getElementsByName('shortNameHost')[0],
        'fullNameHost': document.getElementsByName('fullNameHost')[0],
        'ipaddress': document.getElementsByName('ipaddress')[0],
        'port': document.getElementsByName('port')[0],
        'countProcess': document.getElementsByName('countProcess')[0],
        'token': document.getElementById('token')
    };
}

/***/ }),

/***/ 69:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__common_helpers_showNotify__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__commons_managementIcon__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__setting_sources_page_importXmlFile__ = __webpack_require__(70);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__setting_sources_page_exportXmlFile__ = __webpack_require__(71);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_5__setting_sources_page_transmissionInformationSource__ = __webpack_require__(72);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_6__setting_sources_page_openModalWindowAddOrEditSource__ = __webpack_require__(74);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_7__setting_sources_page_openModalWindowSourceInformation__ = __webpack_require__(75);











(function () {
    function addHandlerForButton(buttons, buttonType) {
        let objType = {
            show: 'get full information source',
            edit: 'get short information source'
        };

        buttons.forEach(element => {
            let dataSetSourceId = element.parentElement.dataset;

            if (typeof dataSetSourceId !== 'undefined' && typeof dataSetSourceId.sourceId !== 'undefined') {
                let sourceId = dataSetSourceId.sourceId;

                element.addEventListener('click', () => {
                    socket.emit(objType[buttonType], { processingType: 'showInformationSource', sourceId: sourceId });
                });
            }
        });
    }

    socket.on('notify information', function (data) {
        let obj = JSON.parse(data.notify);
        Object(__WEBPACK_IMPORTED_MODULE_1__common_helpers_showNotify__["a" /* showNotify */])(obj.type, obj.message);
        if (obj.type === 'info') {
            setTimeout(function () {
                window.location.reload();
            }, 5000);
        }
    });

    socket.on('show source information', function (data) {
        let obj = JSON.parse(data.sourceInformation);
        Object(__WEBPACK_IMPORTED_MODULE_7__setting_sources_page_openModalWindowSourceInformation__["a" /* default */])(obj.information.id, obj);
    });

    socket.on('show source information edit', function (data) {
        let obj = JSON.parse(data.sourceInformation);
        Object(__WEBPACK_IMPORTED_MODULE_6__setting_sources_page_openModalWindowAddOrEditSource__["a" /* default */])('editSource', obj.information.id, obj);
    });

    document.addEventListener('DOMContentLoaded', function () {
        //обработчик на кнопку для открытия модального окна создания нового источника
        (function () {
            let buttonCreateSource = document.getElementById('buttonCreateSource');
            if (buttonCreateSource !== null) {
                buttonCreateSource.addEventListener('click', __WEBPACK_IMPORTED_MODULE_6__setting_sources_page_openModalWindowAddOrEditSource__["a" /* default */].bind(null, 'addSource'));
            }
        })();

        //обработчик на кнопку 'сохранить' модального окна
        (function () {
            let buttonSubmit = document.getElementById('buttonSubmit');
            if (buttonSubmit !== null) {
                buttonSubmit.addEventListener('click', __WEBPACK_IMPORTED_MODULE_5__setting_sources_page_transmissionInformationSource__["a" /* default */]);
            }
        })();

        //обработчики на поля ввода модального окна
        (function () {
            let inputs = document.querySelectorAll('#modalAddEditHosts .modal-body input');

            if (inputs.length === 0) return;

            inputs.forEach(input => {
                input.addEventListener('blur', function (elem) {
                    let e = elem.target;
                    __WEBPACK_IMPORTED_MODULE_2__commons_managementIcon__["a" /* managementIcon */].showIcon(e, __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].checkInputValidation(e));
                    /*if (helpers.checkInputValidation(elem)) managementIcon.showIcon(elem, true);
                    else managementIcon.showIcon(elem, false);*/
                });
            });
        })();

        //обработчик на ссылку 'сгенерировать идентификационный токен'
        (function () {
            let linkProcessTokenId = document.getElementById('token').parentElement.firstElementChild;

            if (linkProcessTokenId !== null) {
                linkProcessTokenId.addEventListener('click', () => {
                    document.querySelector('#token strong').innerHTML = __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].tokenRand();
                });
            }
        })();

        //обработчик на кнопку получения полной информации об источнике
        (function () {
            let buttons = document.querySelectorAll('#main-content, [name="buttonShowInformation"]');
            if (buttons.length === 0) return;

            addHandlerForButton(buttons, 'show');
        })();

        //обработчик на кнопку редактирования источника
        (function () {
            let buttons = document.querySelectorAll('#main-content, [name="buttonSaveInformation"]');
            if (buttons.length === 0) return;

            addHandlerForButton(buttons, 'edit');
        })();

        //обработчик на кнопку удаления источника
        (function () {
            let buttonShow = document.querySelectorAll('#main-content, [name="buttonSourceDelete"]');
            if (buttonShow.length === 0) return;

            buttonShow.forEach(element => {
                let dataSetSourceId = element.parentElement.dataset;

                if (typeof dataSetSourceId !== 'undefined' && typeof dataSetSourceId.sourceId !== 'undefined') {
                    element.addEventListener('click', () => {
                        document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
                        let modalBody = document.querySelector('#modalDelete .modal-body');
                        modalBody.innerHTML = `<p>Действительно удалить всю информацию об источнике №<strong>${dataSetSourceId.sourceId}</strong>?</p>`;

                        let modalDelete = document.querySelector('#modalDelete [type="submit"]');

                        if (modalDelete.getAttribute('data-exist') !== null) {
                            $('#modalDelete').modal('show');
                            return;
                        }

                        modalDelete.addEventListener('click', () => {
                            let sourceId = document.querySelector('#modalDelete strong').innerHTML;
                            socket.emit('delete source', { processingType: 'deleteSource', sourceId: sourceId });

                            $('#modalDelete').modal('hide');

                            modalDelete.dataset.exist = 'emit exist';
                        });

                        $('#modalDelete').modal('show');
                    });
                }
            });
        })();

        //обработчик на кнопку 'Импорт' для выгрузки информации о источниках в виде xml файла
        Object(__WEBPACK_IMPORTED_MODULE_3__setting_sources_page_importXmlFile__["a" /* default */])();

        //обработчик на кнопку 'Экспорт' для выгрузки информации о источниках в виде xml файла
        Object(__WEBPACK_IMPORTED_MODULE_4__setting_sources_page_exportXmlFile__["a" /* default */])();
    });
})();

/***/ }),

/***/ 7:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return managementIcon; });
/**
 * Модуль изменения иконки при проверки полей ввода
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */



let managementIcon = {
    showIcon(elements, trigger) {
        let elem = elements.parentNode;
        let span = elem.parentNode.children[1];

        if (!trigger) {
            elem.parentNode.classList.add('has-error');
            elem.parentNode.classList.remove('has-success');
            span.classList.add('glyphicon-remove');
            span.classList.remove('glyphicon-ok');
        } else {
            elem.parentNode.classList.add('has-success');
            elem.parentNode.classList.remove('has-error');
            span.classList.add('glyphicon-ok');
            span.classList.remove('glyphicon-remove');
        }
    },

    removeIcon(elements) {
        let elem = elements.parentNode;
        let span = elem.parentNode.children[1];

        elem.parentNode.classList.remove('has-success');
        span.classList.remove('glyphicon-ok');
        elem.parentNode.classList.remove('has-error');
        span.classList.remove('glyphicon-remove');
    }
};



/***/ }),

/***/ 70:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = importXmlFile;
/**
 * Модуль импорта информации из файла в формате XML в БД приложения
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */



//импорт файла с информацией об источниках

function importXmlFile() {
    $(document).on('change', '.btn-file :file', function () {
        let input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
        input.trigger('fileselect', [numFiles, label]);
    });

    $(document).ready(function () {
        $('.btn-file :file').on('fileselect', function (event, numFiles, label) {
            $('#modalProgressBar').modal('show');

            let file = event.target.files[0];
            let stream = ss.createStream();

            ss(socket).emit('upload file sources setting', stream, { name: label, size: file.size });
            let blobStream = ss.createBlobReadStream(file);
            let size = 0;
            blobStream.pipe(stream);
            blobStream.on('data', function (chunk) {
                size += chunk.length;
                let percent = Math.floor(size / file.size * 100) + '%';
                let divProgressBar = document.querySelector('#modalProgressBar .progress-bar');
                divProgressBar.setAttribute('aria-valuenow', percent);
                divProgressBar.style.width = percent;
                divProgressBar.innerHTML = percent;

                if (file.size === size) $('#modalProgressBar').modal('hide');
            });
        });
    });
}

/***/ }),

/***/ 71:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = exportXmlFile;
/**
 * Модуль экспорта информации из БД приложения в файл формата XML
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */



function exportXmlFile() {
    let exportFile = document.getElementById('exportFile');
    exportFile.addEventListener('click', function () {

        let link = document.createElement('a');

        link.download = 'fileName.ext';
        link.href = '/export_file_setup_hosts';

        let clickEvent = document.createEvent('MouseEvent');
        clickEvent.initEvent('click', true, true);

        link.dispatchEvent(clickEvent);
    });
}

/***/ }),

/***/ 72:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = transmissionInformationSource;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__commons_managementIcon__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__getFormElements__ = __webpack_require__(22);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__createObjectInformationSetting__ = __webpack_require__(73);
/**
 * Передача информации необходимой для добавления источника
 * 
 * Версия 0.1, дата релиза 07.12.2017
 */








function transmissionInformationSource() {
    let obj = Object(__WEBPACK_IMPORTED_MODULE_2__getFormElements__["a" /* default */])();
    let arrayElement = [obj.hostId, obj.shortNameHost, obj.fullNameHost, obj.ipaddress, obj.port, obj.countProcess];

    let processingType = document.getElementById('myModalLabel').getAttribute('typeWindow');
    let processingTrigger = arrayElement.every(elem => {
        if (elem.value.length === 0) {
            __WEBPACK_IMPORTED_MODULE_1__commons_managementIcon__["a" /* managementIcon */].showIcon(elem, false);
            return false;
        } else {
            if (__WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].checkInputValidation(elem) === true) {
                __WEBPACK_IMPORTED_MODULE_1__commons_managementIcon__["a" /* managementIcon */].showIcon(elem, true);
                return true;
            } else {
                __WEBPACK_IMPORTED_MODULE_1__commons_managementIcon__["a" /* managementIcon */].showIcon(elem, false);
                return false;
            }
        }
    });
    if (processingTrigger) {
        socket.emit('add or edit setting', { processingType: processingType, information: Object(__WEBPACK_IMPORTED_MODULE_3__createObjectInformationSetting__["a" /* default */])() });

        $('#modalAddEditHosts').modal('hide');
    }
}

/***/ }),

/***/ 73:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createObjectInformationSetting;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__ = __webpack_require__(1);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getFormElements__ = __webpack_require__(22);
/**
 * Модуль формирования объекта с введенной пользователем информации
 * 
 * Версия 0.1, дата релиза 07.12.2017
 */






function createObjectInformationSetting() {
    let obj = {};
    let elements = Object(__WEBPACK_IMPORTED_MODULE_1__getFormElements__["a" /* default */])();
    for (let key in elements) {
        if (key === 'token') {
            let elemToken = document.getElementById('token').children[0].innerHTML;
            let token = __WEBPACK_IMPORTED_MODULE_0__common_helpers_helpers__["a" /* helpers */].tokenRand();
            obj[key] = elemToken === '&nbsp;' ? token : elemToken;
        } else {
            obj[key] = elements[key].value;
        }
    }
    return obj;
}

/***/ }),

/***/ 74:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = addEditSource;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__commons_managementIcon__ = __webpack_require__(7);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__getFormElements__ = __webpack_require__(22);
/**
 * Модуль формирования и открытия модального окна преднозначенного для создания
 * или редактирования источника
 * 
 * @param {*} typeWindow - тип модального окна
 * @param {*} sourceId - id источника
 * @param {*} object - объект с информацией по источнику
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */







function addEditSource(typeWindow, sourceId, object) {
    let objElements = Object(__WEBPACK_IMPORTED_MODULE_1__getFormElements__["a" /* default */])();
    let modalLabel = document.getElementById('myModalLabel');

    if (typeWindow === 'addSource') addSource();
    if (typeWindow === 'editSource') editSource(sourceId, object);

    //добавление источника
    function addSource() {
        for (let key in objElements) {
            objElements[key].value = '';
            if (key !== 'token') __WEBPACK_IMPORTED_MODULE_0__commons_managementIcon__["a" /* managementIcon */].removeIcon(objElements[key]);
        }

        modalLabel.innerHTML = 'Добавить источник';
        modalLabel.removeAttribute('typeWindow');
        modalLabel.setAttribute('typeWindow', typeWindow);

        objElements.hostId.removeAttribute('readonly');
        objElements.countProcess.value = '5';
        objElements.token.innerHTML = '<strong style="line-height: 200%;">&nbsp;</strong>';

        $('#modalAddEditHosts').modal('show');
    }

    //редактирование источника
    function editSource(sourceId, object) {
        let objInformation = object.information || {};

        modalLabel.innerHTML = 'Редактировать источник';
        modalLabel.removeAttribute('typeWindow');
        modalLabel.setAttribute('typeWindow', typeWindow);

        objElements.hostId.value = objInformation.id;
        objElements.hostId.setAttribute('readonly', '');
        objElements.shortNameHost.value = objInformation.short_name;
        objElements.fullNameHost.value = objInformation.detailed_description;
        objElements.ipaddress.value = objInformation.ip_address;
        objElements.port.value = objInformation.port;
        objElements.countProcess.value = objInformation.max_count_process_filtering;
        objElements.token.innerHTML = `<strong style="line-height: 200%;">${objInformation.token}</strong>`;

        $('#modalAddEditHosts').modal('show');
    }
}

/***/ }),

/***/ 75:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = showAllInformation;
/**
 * Модуль формирующий и показывающий модальное окно с полной информацией 
 * по источнику
 * 
 * @param {*} sourceId - id источника
 * @param {*} object - объект с основной информацией
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */



function showAllInformation(sourceId, object) {
    //заголовок модального окна
    document.querySelector('#modalShowRemoteHosts .modal-title').innerHTML = 'Подробная информация об источнике №' + sourceId;
    //очищаем модальное окно
    document.querySelector('#modalShowRemoteHosts .modal-body').innerHTML = '';
    let objSettings = {
        'short_name': ['Название', false],
        'detailed_description': ['Описание', false],
        'ip_address': ['IP-адрес', false],
        'port': ['Порт', false],
        'date_create': ['Дата добавления', true],
        'date_changes': ['Дата изменения', true],
        'date_last_connected': ['Дата последнего соединения', true],
        'number_connection_attempts': ['Количество попыток соединения', false],
        'token': ['Идентификационный токен', false],
        'max_count_process_filtering': ['Количество заданий на фильтрацию', false]
    };

    let x = new Date().getTimezoneOffset() * 60000;

    let container = document.createElement('div');
    container.classList.add('container-fluid');

    let divRow = document.createElement('div');
    divRow.classList.add('row');

    let divCol = document.createElement('div');
    divCol.classList.add('col-sm-6');
    divCol.classList.add('col-md-6');
    divCol.classList.add('col-lg-6');
    divCol.setAttribute('style', 'margin-top: 5px;');

    let divClearfix = document.createElement('div');
    divClearfix.classList.add('clearfix');

    for (let key in objSettings) {
        let newDivClearfix = divClearfix.cloneNode(false);
        let divName = divCol.cloneNode(false);
        divName.classList.add('text-right', 'strong');
        divName.innerHTML = `<strong>${objSettings[key][0]}</strong>`;
        divRow.appendChild(divName);

        let divValue = divCol.cloneNode(false);
        divValue.classList.add('text-left');
        let value = object.information[key];
        if (objSettings[key][1] === true) {
            value = +object.information[key] === 0 ? 'дата не определена' : new Date(+object.information[key] - x).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
        }
        divValue.appendChild(document.createTextNode(value));
        divRow.appendChild(divValue);

        divRow.appendChild(newDivClearfix);
    }
    container.appendChild(divRow);

    document.querySelector('#modalShowRemoteHosts .modal-body').appendChild(container);
    $('#modalShowRemoteHosts').modal('show');
}

/***/ })

},[69]);
//# sourceMappingURL=settingSourcesPage.js.map