/**
 * Формирование таблицы с данными и пагинатор
 * 
 * Версия 0.1, дата релиза 23.11.2017
 */

'use strict';

import processPagination from './processPagination';
import createTableTaskResultFilter from '../job_log/createTableTaskResultFilter';
import createTableTaskUploadedFiles from '../upload_files_log/createTableTaskUploadedFiles';

export default function getBodyJournalOfFiltrations(pageName, informationTasks) {
    let objCreateTables = {
        'job_log': {
            'create table': createTableTaskResultFilter,
            'emit message': 'show the page number filtering'
        },
        'uploaded_files_log': {
            'create table': createTableTaskUploadedFiles,
            'emit message': 'show the page number upload files'
        }
    };

    function isEmptyObject(obj) {
        return (Object.keys(obj).length === 0) ? true : false;
    }

    //формирование нового пагинатора
    function createPaginate(data) {
        let pagination = `всего заданий: <strong>${data.informationPaginate.countElements}</strong><nav>`;
        pagination += '<ul class="pagination"><li class="page-item disabled"><a class="page-link" data-chunk="previous" href="#" aria-label="Previous">&laquo;</a></li>';

        for (let num = 1; num <= data.informationPaginate.countChunks; num++) {
            if (data.informationPaginate.chunksNumber === num) {
                pagination += `<li class="page-item active"><a class="page-link" data-chunk="${num}" number-label="" href="#">${num}</a></li>`;
            } else {
                pagination += `<li class="page-item"><a class="page-link" data-chunk="${num}" number-label="" href="#">${num}</a></li>`;
            }
        }
        pagination += '<li class="page-item"><a class="page-link" data-chunk="next" href="#" aria-label="Next">&raquo;</a></li></ul></nav>';
        document.getElementById('field_pagination').innerHTML = pagination;

        let divPagination = document.getElementsByClassName('pagination')[0];
        if (typeof divPagination !== 'undefined') divPagination.addEventListener('click', processPagination.bind(objCreateTables[pageName]['emit message']));
    }

    if (isEmptyObject(informationTasks)) {
        let divInformationNotFound = '<div class="text-center"><h4 class="text-uppercase" style="margin-top: 100px; color: #ef5734">нет данных</h4></div>';
        document.getElementById('field_table').innerHTML = divInformationNotFound;
        document.getElementById('field_pagination').innerHTML = '';
        return;
    }
    //создаем новую таблицу с данными
    objCreateTables[pageName]['create table'](informationTasks);

    if (informationTasks.hasOwnProperty('informationTaskIndex') && (informationTasks.informationPaginate.countChunks > 1)) {
        createPaginate(informationTasks);
    } else {
        document.getElementById('field_pagination').innerHTML = '';
    }
}