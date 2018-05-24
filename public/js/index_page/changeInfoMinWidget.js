/*
 * Модуль изменения виджета с краткой информацией о сенсоре
 * 
 * Версия 0.1, дата релиза 11.04.2018
 * */

'use strict';

import { helpers } from '../common_helpers/helpers';

export default function(objData) {
    let information = objData.information;

    let localDateTime = information.current_date_time;
    let dateTimeReceived = information.date_time_received;

    let usedDiskSpace = '<div style="margin-top: 5px;">' +
        '<div class="text-center"><strong>Объём дискового пространства</strong></div>' +
        '<div class="text-center" style="margin-left: 2px; margin-right: 2px;">';

    information.disk_space.forEach(function(item) {
        let used = parseInt(item.used);

        usedDiskSpace += `<strong style="font-size: 18px; ${helpers.getColor(used)}" 
            data-toggle="tooltip" data-placement="bottom" 
            title="точка монтирования ${item.mounted}"> ${item.used} </strong>`;
    });

    let networkInterface = '<div name="loadNetwork" class="text-center" style="font-size 10px;">' +
        '<div class="text-center"><strong>Загрузка сетевых интерфейсов</strong></div>' +
        '<div class="col-sm-2"> </div><div class="col-sm-5">TX Кбит/с</div><div class="col-sm-5">RX Кбит/с</div>';

    for (let nInterface in information.load_network) {
        networkInterface += `<div class="col-sm-2">${nInterface}</div>
        <div class="col-sm-5">${helpers.intConvert(information.load_network[nInterface].TX)}</div>
        <div class="col-sm-5">${helpers.intConvert(information.load_network[nInterface].RX)}</div>`;
    }

    let loadRAM = ((+information.random_access_memory.used * 100) / +information.random_access_memory.total).toFixed(2);

    let cpuAndRam = `<div style="margin-top: 5px;">
        <div class="col-sm-6 text-center">CPU <strong style="${helpers.getColor(information.load_cpu)}">${information.load_cpu}%</strong></div>
        <div class="col-sm-6 text-center">RAM <strong style="${helpers.getColor(loadRAM)}">${loadRAM}%</strong></div></div>`;


    let divSourceId = document.getElementsByName(information.sourceId);

    if (divSourceId.length === 0) return;

    divSourceId[0].innerHTML = `<div class="text-center"><div style="margin-top: -10px;">
        <small>Данные получены в ${dateTimeReceived.slice(-8)}</small></div>
        <div>Локальное время источника:</div><div style="font-size: 16px;"><strong>${localDateTime}</strong></div></div>
        ${usedDiskSpace}</div>${cpuAndRam} ${networkInterface}</div></div>`;

    helpers.loadNetworkMarginTop();

    // инициализировать элемент, имеющий идентификатор tooltip, как компонент tooltip
    $('[data-toggle="tooltip"]').tooltip();
}