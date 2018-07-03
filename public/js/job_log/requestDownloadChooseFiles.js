/**
 * Модуль формирующий запрос на загрузку всех выбранных пользователем файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */

'use strict';

import ParametersRequestDownloadFiles from './parametersRequestDownloadFiles';

export default function(socket) {
    let parametersRequestDownloadFiles = new ParametersRequestDownloadFiles('modalLabelListDownloadFiles');
    let objData = parametersRequestDownloadFiles.getObjectData(['taskIndex', 'sourceId']);

    let checkBox = document.getElementsByName('checkbox_setFileDownload');

    let fileIsChecked = [];
    for (let i = 0; i < checkBox.length; i++) {
        if (!checkBox[i].checked) continue;
        if (checkBox[i].dataset === null || checkBox[i].dataset.fileName === null) continue;

        fileIsChecked.push(checkBox[i].dataset.fileName);
    }

    if (fileIsChecked.length === 0) return;

    objData.listFiles = fileIsChecked;

    socket.emit('download choose files obtained result filtering', objData);

    $('#modalListDownloadFiles').modal('hide');
}