/*
 * Модуль для формирования модального окна для выбранного источника, 
 * позволяет
 * - получить подробную информацию об источнике
 * - добавить задание на фильтрацию
 *
 * Версия 1.0, релиз 10.11.2017
 * */

'use strict';

import { helpers } from '../common_helpers/helpers';
import { IPv4_Address } from '../common_helpers/networkCalc';

export default {
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
};

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
    divBody.innerHTML = '<ul id="myTab" class="nav nav-tabs"><li class="active"><a class="tabnav" data-toggle="tab" href="#panel1">Информация</a></li>' +
        '<li><a class="tabnav" data-toggle="tab" href="#panel2">Фильтрация</a></li></ul>' +
        '<div class="tab-content"><div id="panel1" class="tab-pane fade in active"></div>' +
        '<div id="panel2" class="tab-pane fade"></div><div id="panel3" class="tab-pane fade"></div></div>';

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
    $(document).ready(function() {
        $("#myTab a").click(function(e) {
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
    informationCpuAndRam += `<strong>${helpers.intConvert(ram.total)}</strong>, используется: <strong>${helpers.intConvert(ram.used)}</strong>, свободно: <strong>${helpers.intConvert(ram.free)}</strong></div></div>`;

    //сетевые интерфейсы
    let networkInterface = '<div class="col-sm-5 col-md-5 col-lg-5"><div class="text-center"><div>Загрузка сетевых интерфейсов (Кбит/с)</div>' +
        '<div class="col-sm-2"><small> </small></div><div class="col-sm-5"><small>передано</small></div><div class="col-sm-5"><small>принято</small></div>';
    for (let netInterface in objInformation.load_network) {
        let TX = (objInformation.load_network[netInterface].TX !== 0) ? `<strong>${helpers.intConvert(objInformation.load_network[netInterface].TX)}</strong>` : objInformation.load_network[netInterface].TX;
        let RX = (objInformation.load_network[netInterface].RX !== 0) ? `<strong>${helpers.intConvert(objInformation.load_network[netInterface].RX)}</strong>` : objInformation.load_network[netInterface].RX;

        networkInterface += `<div class="col-sm-2">${netInterface}</div>`;
        networkInterface += `<div class="col-sm-5">${TX}</div>`;
        networkInterface += `<div class="col-sm-5">${RX}</div>`;
    }
    networkInterface += '</div></div>';

    //дисковое пространство
    let diskSpace = '<div class="col-sm-7 col-md-7 col-lg-7"><div class="text-center"><div>Дисковое пространство</div>' +
        '<div class="col-sm-3"><small>имя</small></div><div class="col-sm-3"><small>монтирование</small></div><div class="col-sm-3"><small>объем</small></div><div class="col-sm-3"><small>использование</small></div>';

    for (let i = 0; i < objInformation.disk_space.length; i++) {
        let disk = objInformation.disk_space[i];
        if (!disk.hasOwnProperty('diskName') || !disk.hasOwnProperty('mounted')) continue;
        if (!disk.hasOwnProperty('maxSpace') || !disk.hasOwnProperty('used')) continue;

        diskSpace += `<div class="col-sm-3">${disk.diskName}</div><div class="col-sm-3">${disk.mounted}</div><div class="col-sm-3">${disk.maxSpace}</div><div class="col-sm-3"><strong>${disk.used}</strong></div>`;
    }

    diskSpace += '</div></div>';

    //временной интервал файлов сетевого трафика
    let x = (new Date()).getTimezoneOffset() * 60000;

    let timeInterval = '<div class="col-sm-12 col-md-12 col-lg-12"><div class="text-center">Временной интервал файлов сетевого трафика</div>';
    timeInterval += '<table class="table table-striped table-hover table-sm"><thead>';
    timeInterval += '<tr><th class="text-center">директория</th><th class="text-center">с</th><th class="text-center">по</th>';
    timeInterval += '<th class="text-center">количество суток</th></tr></thead><tbody>';

    for (let folder in objInformation.time_interval) {
        let dateMin = objInformation.time_interval[folder].dateMin;
        let dateMax = objInformation.time_interval[folder].dateMax;

        if ((typeof dateMin === 'undefined') || (typeof dateMax === 'undefined')) continue;

        let dateMinString = (new Date((+dateMin - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));
        let dateMaxString = (new Date((+dateMax - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));
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

    if ((tokenInvalid.length === 0) && (token.length > 0)) {
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
        let ip4Address = new IPv4_Address(valueNetwork, valueNetworkMask);
        let countIpAddress = (parseFloat(ip4Address.netbcastInteger) - parseFloat(ip4Address.netaddressInteger) + 1);

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
    let dateTimeStartExists = (dateTimeStart.value.length === 0);
    let dateTimeEndExists = (dateTimeEnd.value.length === 0);

    //поля даты не должны быть пустыми
    if (dateTimeStartExists || dateTimeEndExists) {
        changeColorDateTimeInput(true);
        return false;
    }

    //начальное время не должно быть больше или равно конечному
    if ((+new Date(dateTimeStart.value)) >= (+new Date(dateTimeEnd.value))) {
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