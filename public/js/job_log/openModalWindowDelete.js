/**
 * Открытие модального окна подтверждения удаления задачи фильтрации
 * 
 * Версия 0.1, дата релиза 20.11.2017
 */

'use strict';

export default function(taskIndex) {
    document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
    let modalBody = document.querySelector('#modalDelete .modal-body');

    modalBody.innerHTML = `<p data-task-index="${taskIndex}">Удалить всю информацию о задаче?</p>`;

    $('#modalDelete').modal('show');
}