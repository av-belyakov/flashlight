/**
 * Изменение списка источников и их количества
 * 
 * Версия 0.1, дата релиза 14.02.2018
 */

'use strict';

export default function(data) {
    let countConnectSource = 0;
    let countDisconnectSource = 0;

    let elementList = '<ul style="padding-bottom:20px;">';
    for (let source in data.statusListSources) {
        let statusConnectionIsTrue = data.statusListSources[source].statusConnection;
        let status = (statusConnectionIsTrue) ? 'my_circle_green' : 'my_circle_red';

        if (statusConnectionIsTrue) countConnectSource++;
        else countDisconnectSource++;

        elementList += '<li style="padding-bottom: 3px;">';
        elementList += `<canvas class="${status}"></canvas>&nbsp;&nbsp;<a href="#">${source}&nbsp;${data.statusListSources[source].shortName}</a>`;
        elementList += '</li>';
    }
    elementList += '</ul>';
    let elementLeftContent = document.getElementById('leftContent');
    elementLeftContent.innerHTML = elementList;

    let boxCountConnection = '<div class="box1">';
    boxCountConnection += '<span class="li_heart"></span>';
    boxCountConnection += `<h3>${countConnectSource}&nbsp;/&nbsp;${countDisconnectSource}</h3>`;
    boxCountConnection += '</div>';
    boxCountConnection += `<p>${countConnectSource}&nbsp;/&nbsp;${countDisconnectSource}&nbsp;количество источников в статусе подключен и недоступен</p>`;

    document.getElementById('boxCountConnection').innerHTML = boxCountConnection;
}