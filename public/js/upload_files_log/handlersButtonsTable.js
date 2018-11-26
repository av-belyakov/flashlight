/**
 * Модуль содержит обработчики для кнопок "полная информация", "в рассмотренное"
 * и "удаление" таблицы содержащей перечень задач по которым файлы были успешно выгружены 
 * 
 * Версия 0.1, дата релиза 26.11.2018
 */

"use strict";

import common from '../common';
import openModalWindowDelete from './openModalWindowDelete';

const handlersButton = {
    handlerShowInfo() {
        let buttonsImport = document.querySelectorAll('#field_table [name="buttonAllInformation"]');
        buttonsImport.forEach((element) => {
            let taskIndex = element.parentElement.dataset.taskIndex;
            element.onclick = (function(taskIndex) {
                socket.emit('get all information for task index', { processingType: 'showInformationSource', taskIndex: taskIndex });
            }).bind(null, taskIndex);
        });
    },

    handlerChangeStatus() {
        let buttonsImport = document.querySelectorAll('#field_table [name="buttonChangeStatus"]');
        buttonsImport.forEach((element) => {
            let taskIndex = element.dataset.sourceIdTaskIndex;
            element.onclick = (function(taskIndex) {
                socket.emit('a mark of consideration', { processingType: 'changeStatusFile', taskIndex: taskIndex });
            }).bind(null, taskIndex);
        });
    },

    handlerDelete() {
        let buttonsImport = document.querySelectorAll('#field_table [name="buttonDelete"]');
        buttonsImport.forEach((element) => {
            let taskIndex = element.parentElement.dataset.taskIndex;
            element.onclick = openModalWindowDelete.bind(null, taskIndex);
        });
    }
};

export default handlersButton;