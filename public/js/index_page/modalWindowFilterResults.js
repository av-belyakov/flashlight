/*
 * Модуль создания модального окна вывода информации по выбранному заданию фильтрациии
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
            if (target.dataset.hasOwnProperty('sourceId')) {
                let taskIndex = target.dataset.sourceId;

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

    //запрос на отмену задачи фильтрации
    stopFilterTask(taskIndex) {
        socket.emit('request to stop the task filter', { processingType: 'stopTaskFilter', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на останов загрузки файлов
    stopDownloadFiles(taskIndex) {
        socket.emit('stop download files', { processingType: 'taskDownload', taskIndex: taskIndex });
        //закрыть модальное окно
        $('#modalWindowTaskFilter').modal('hide');
    },

    //запрос на возобновление загрузки файлов
    resumeDownloadFiles(taskIndex) {
        socket.emit('resume download files', { processingType: 'taskDownload', taskIndex: taskIndex });
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