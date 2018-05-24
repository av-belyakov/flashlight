/**
 * Создание постраничных ссылок
 * 
 * Версия 0.1, дата релиза 24.11.2017
 */

'use strict';

import processPagination from '../commons/processPagination';

export default function(informationPaginate) {
    let createPaginate = function() {
        let pagination = '<ul class="pagination"><li class="page-item disabled"><a class="page-link" data-chunk="previous" href="#" aria-label="Previous">&laquo;</a></li>';
        for (let num = 1; num <= informationPaginate.countChunks; num++) {
            if (informationPaginate.chunksNumber === num) {
                pagination += `<li class="page-item active"><a class="page-link" data-chunk="${num}" number-label="" href="#">${num}</a></li>`;
            } else {
                pagination += `<li class="page-item"><a class="page-link" data-chunk="${num}" number-label="" href="#">${num}</a></li>`;
            }
        }
        pagination += '<li class="page-item"><a class="page-link" data-chunk="next" href="#" aria-label="Next">&raquo;</a></li></ul></nav>';
        document.getElementById('field_pagination').innerHTML = `<div class="text-center">${pagination}</div>`;

        document.getElementById('field_information').innerHTML = `сообщений об ошибках найдено: <strong>${informationPaginate.countElements}</strong>`;

        let divPagination = document.getElementsByClassName('pagination')[0];
        if (typeof divPagination !== 'undefined') divPagination.addEventListener('click', processPagination.bind('show the page number error'));
    };

    if (informationPaginate.countChunks > 1) {
        //создаем новый пагинатор
        createPaginate();
    } else {
        document.getElementById('field_pagination').innerHTML = '';
    }
}