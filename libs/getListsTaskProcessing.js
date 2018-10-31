/**
 * Модуль формирующий объект содержащий перечень выполняемых задач
 * и их количество
 * 
 * Версия 0.21, дата релиза 31.10.2018
 */

'use strict';

const globalObject = require('../configure/globalObject');

module.exports = function() {
    let objResultTaskList = {
        taskFiltering: [],
        taskTurnDownloadingFiles: [],
        taskImplementationDownloadingFiles: []
    };

    let processingTasks = globalObject.getData('processingTasks');

    for (let taskIndex in processingTasks) {
        let taskType = processingTasks[taskIndex].taskType;

        if (taskType === 'filtering') objResultTaskList.taskFiltering.push(taskIndex);
        else if (taskType === 'upload') {
            if (processingTasks[taskIndex].status === 'in line') {
                objResultTaskList.taskTurnDownloadingFiles.push(taskIndex);
            } else if (processingTasks[taskIndex].status === 'loaded') {
                objResultTaskList.taskImplementationDownloadingFiles.push(taskIndex);
            }
        } else continue;
    }

    return objResultTaskList;
};