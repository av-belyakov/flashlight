/*
 * Модуль для создания модального окна вывода информации по выбранному заданию фильтрациии
 *
 * Версия 1.0, релиз 10.11.2017
 * */

'use strict';

export default {
    //генерируем запрос всей информации по задаче (ДЛЯ ГЛАВНОЙ СТРАНИЦЫ)
    getAllInformationForTaskFilterIndexPage(event) {
        if (event.target.tagName !== 'DIV') return;

        let divLeftContent = document.getElementById('leftContent');
        let target = event.target;

        while (target !== divLeftContent) {
            if (target.dataset.hasOwnProperty('taskIndex')) {
                let taskIndex = target.dataset.taskIndex;

                //генерируем событие (запрос всей информации)
                socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
                return;
            }
            target = target.parentNode;
        }
    },

    //генерируем запрос всей информации по задаче (ДЛЯ СТРАНИЦЫ УЧЕТА ЗАДАНИЙ НА ФИЛЬТРАЦИЮ)
    getAllInformationForTaskFilterJobLogPage(taskIndex) {
        socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
    },

    //запрос на останов задачи фильтрации
    stopFilterTask(taskIndex) {
        socket.emit('request to stop the task filter', { processingType: 'stopTaskFilter', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на возобновление выполнения задачи по фильтрации
    resumeFilterTask(taskIndex, objectTimers) {
        socket.emit('request to resume the task filter', { processingType: 'resumeTaskFilter', taskIndex: taskIndex });

        if (objectTimers && (taskIndex in objectTimers)) {
            clearTimeout(objectTimers[taskIndex]);
            delete(objectTimers[taskIndex]);
        }

        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на останов загрузки файлов
    stopDownloadFiles(taskIndex) {
        socket.emit('stop download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на отмену задачи по загрузки файлов
    cancelDownloadFiles(taskIndex) {
        socket.emit('cancel download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    }
};