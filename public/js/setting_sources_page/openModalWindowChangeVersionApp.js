/**
 * Модуль добавления или изменения номера актуальной версии приложения
 * находящегося на источнике
 * 
 * Версия 0.1, дата релиза 24.12.2018 
 */

'use strict';

import { managementIcon } from '../commons/managementIcon';

export default function openModalWindowChangeVersionApp() {
    let currentVersionApp = document.getElementById('versionApp').dataset.versionApp;
    let modalWindow = `<div class="modal-dialog modal-lg">
    <div class="modal-content">
        <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
            <h4 class="modal-title">Изменить версию программного обеспечения</h4>
        </div>
        <div class="modal-body">
            <!-- основной контент -->
            <form role="form" class="form-horizontal">
                <!-- цифровой идентификатор хоста -->
                <div class="form-group has-feedback">
                    <label for="hostId" class="control-label col-sm-6 col-md-6 col-lg-6">версия программного обеспечения:</label>
                    <div class="col-sm-5 col-md-5 col-lg-5">
                        <div>
                            <input type="text" class="form-control input-xs" id="newVersionApp" value="${currentVersionApp}">
                        </div>
                        <span class="glyphicon form-control-feedback"></span>
                    </div>
                </div>
            </form>
        </div>
        <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Закрыть</button>
            <button type="submit" class="btn btn-primary" name="buttonSubmit">Сохранить</button>
        </div>
    </div>
</div>`;

    let mainDiv = document.createElement('div');
    mainDiv.className = 'modal fade';
    mainDiv.setAttribute('id', 'modalChangeVersionApp');
    mainDiv.setAttribute('tabindex', '-1');
    mainDiv.setAttribute('role', 'dialog');
    mainDiv.setAttribute('aria-labelledby', 'myModalLabel');
    mainDiv.setAttribute('data-show', 'data');
    mainDiv.innerHTML = modalWindow;

    document.getElementById('container').appendChild(mainDiv);

    document.querySelector('#modalChangeVersionApp [name="buttonSubmit"]').addEventListener('click', changeVersionApp);

    $('#modalChangeVersionApp').modal('show');
}

//изменение текущей версии
function changeVersionApp() {
    let changeColor = (nva) => {
        let listVersionNumber = document.querySelectorAll('.table-responsive [name="versionApp"]');
        let pattern = new RegExp('\\d+\\.\\d+');

        for (let i = 0; i < listVersionNumber.length; i++) {
            let va = listVersionNumber[i].innerHTML;
            let version = va.match(pattern);

            if (version !== null) {
                let styleColor = (+version[0] >= nva) ? 'rgb(159,215,131)' : 'rgb(199,136,136)';
                listVersionNumber[i].style.color = styleColor;
            }
        }
    };

    let elem = document.querySelector('#modalChangeVersionApp input');

    if (checkVersionNumber(elem)) {
        document.getElementById('versionApp').innerHTML = `<strong>${+elem.value}</strong>`;

        //изменяем цвет номера версии приложения
        changeColor(+elem.value);

        socket.emit('change current version app', { processingType: 'changeValueApp', information: { newValueApp: +elem.value } });

        $('#modalChangeVersionApp').modal('hide');
    }
}

//проверка номера версии
function checkVersionNumber(elem) {
    let pattern = new RegExp('^\\d+\\.\\d+$');

    if (elem.value.length === 0) {
        managementIcon.showIcon(elem, false);
        return false;
    } else {
        if (pattern.test(elem.value)) {
            managementIcon.showIcon(elem, true);
            return true;
        } else {
            managementIcon.showIcon(elem, false);
            return false;
        }
    }
}