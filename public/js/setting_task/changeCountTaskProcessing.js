/**
 * Изменение количества выполняемых задач
 * 
 * Версия 0.1, дата релиза 21.02.2018 
 */

'use strict';

export default function(data) {
    let objLists = data.informationPageAdmin;

    let taskFilteringIsExist = (typeof objLists.taskFiltering === 'undefined');
    let taskTurnFilesIsExist = (typeof objLists.taskTurnDownloadingFiles === 'undefined');
    let taskImplementFilesIsExist = (typeof objLists.taskImplementationDownloadingFiles === 'undefined');

    if (taskFilteringIsExist || taskTurnFilesIsExist || taskImplementFilesIsExist) return;

    let content = '<div class="box1"><span class="li_cloud"></span>';
    content += '<h3>';
    content += `${objLists.taskFiltering.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += `${objLists.taskTurnDownloadingFiles.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += objLists.taskImplementationDownloadingFiles.length;
    content += '</h3></div><p>';
    content += `${objLists.taskFiltering.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += `${objLists.taskTurnDownloadingFiles.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += `${objLists.taskImplementationDownloadingFiles.length} выполняемые задачи по фильтрации, выгрузки и очереди на выгрузку сетевого трафика`;
    content += '</p></div>';

    let boxCountAllTasks = document.getElementById('boxCountAllTasks');
    boxCountAllTasks.innerHTML = content;
}