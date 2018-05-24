/**
 * Модуль формирующий объект содержащий перечень выполняемых задач
 * и их количество
 * 
 * Версия 0.11, дата релиза 23.05.2018
 */

'use strict';

const globalObject = require('../configure/globalObject');

module.exports = function(redis, func) {
    /**
     * @param processingTasks - выполняемые задачи, как по фильтрации, так и по загрузки файлов
     * @param downloadFilesTmp - информация по загружаемому файлу
     */

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

    func(null, objResultTaskList);
};