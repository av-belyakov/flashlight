/**
 * Модуль обрабатывающий запрос на выгрузку всех найденных в результате фильтрации файлов
 * 
 * Версия 0.1, дата релиза 02.06.2018
 */

'use strict';

import ParametersRequestDownloadFiles from './parametersRequestDownloadFiles';

export default function(socket) {
    let parametersRequestDownloadFiles = new ParametersRequestDownloadFiles('modalLabelListDownloadFiles');
    let objData = parametersRequestDownloadFiles.getObjectData(['taskIndex', 'sourceId']);

    socket.emit('download all files obtained result filtering', objData);

    $('#modalListDownloadFiles').modal('hide');
};