/**
 * Открытие модального окна подтверждающего удаление метаданных и файлов
 * 
 * Версия 0.1, дата релиза 27.11.2017
 */

'use strict';

export default function openModalWindowDelete(taskIndex) {
    document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
    let modalBody = document.querySelector('#modalDelete .modal-body');

    modalBody.innerHTML = `<label class="checkbox-inline" data-task-index="${taskIndex}"><input type="checkbox" id="inlineCheckboxFileDelete"> удалить все файлы, связанные с выбранными метаданными </label>`;

    $('#modalDelete').modal('show');
}