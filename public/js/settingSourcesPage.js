'use strict';

import { helpers } from './common_helpers/helpers';
import { showNotify } from './common_helpers/showNotify';
import { managementIcon } from './commons/managementIcon';
import importXmlFile from './setting_sources_page/importXmlFile';
import exportXmlFile from './setting_sources_page/exportXmlFile';
import transmissionInformationSource from './setting_sources_page/transmissionInformationSource';
import openModalWindowAddOrEditSource from './setting_sources_page/openModalWindowAddOrEditSource';
import openModalWindowSourceInformation from './setting_sources_page/openModalWindowSourceInformation';

(function() {
    function addHandlerForButton(buttons, buttonType) {
        let objType = {
            show: 'get full information source',
            edit: 'get short information source'
        };

        buttons.forEach(element => {
            let dataSetSourceId = element.parentElement.dataset;

            if ((typeof dataSetSourceId !== 'undefined') && (typeof dataSetSourceId.sourceId !== 'undefined')) {
                let sourceId = dataSetSourceId.sourceId;

                element.addEventListener('click', () => {
                    socket.emit(objType[buttonType], { processingType: 'showInformationSource', sourceId: sourceId });
                });
            }
        });
    }

    socket.on('notify information', function(data) {
        let obj = JSON.parse(data.notify);
        showNotify(obj.type, obj.message);
        if (obj.type === 'info') {
            setTimeout(function() {
                window.location.reload();
            }, 5000);
        }
    });

    socket.on('show source information', function(data) {
        let obj = JSON.parse(data.sourceInformation);
        openModalWindowSourceInformation(obj.information.id, obj);
    });

    socket.on('show source information edit', function(data) {
        let obj = JSON.parse(data.sourceInformation);
        openModalWindowAddOrEditSource('editSource', obj.information.id, obj);
    });

    document.addEventListener('DOMContentLoaded', function() {
        //обработчик на кнопку для открытия модального окна создания нового источника
        (function() {
            let buttonCreateSource = document.getElementById('buttonCreateSource');
            if (buttonCreateSource !== null) {
                buttonCreateSource.addEventListener('click', openModalWindowAddOrEditSource.bind(null, 'addSource'));
            }
        })();

        //обработчик на кнопку 'сохранить' модального окна
        (function() {
            let buttonSubmit = document.getElementById('buttonSubmit');
            if (buttonSubmit !== null) {
                buttonSubmit.addEventListener('click', transmissionInformationSource);
            }
        })();

        //обработчики на поля ввода модального окна
        (function() {
            let inputs = document.querySelectorAll('#modalAddEditHosts .modal-body input');

            if (inputs.length === 0) return;

            inputs.forEach(input => {
                input.addEventListener('blur', function(elem) {
                    let e = elem.target;
                    managementIcon.showIcon(e, helpers.checkInputValidation(e));
                    /*if (helpers.checkInputValidation(elem)) managementIcon.showIcon(elem, true);
                    else managementIcon.showIcon(elem, false);*/
                });
            });
        })();

        //обработчик на ссылку 'сгенерировать идентификационный токен'
        (function() {
            let linkProcessTokenId = document.getElementById('token').parentElement.firstElementChild;

            if (linkProcessTokenId !== null) {
                linkProcessTokenId.addEventListener('click', () => {
                    document.querySelector('#token strong').innerHTML = helpers.tokenRand();
                });
            }
        })();

        //обработчик на кнопку получения полной информации об источнике
        (function() {
            let buttons = document.querySelectorAll('#main-content, [name="buttonShowInformation"]');
            if (buttons.length === 0) return;

            addHandlerForButton(buttons, 'show');
        })();

        //обработчик на кнопку редактирования источника
        (function() {
            let buttons = document.querySelectorAll('#main-content, [name="buttonSaveInformation"]');
            if (buttons.length === 0) return;

            addHandlerForButton(buttons, 'edit');
        })();

        //обработчик на кнопку удаления источника
        (function() {
            let buttonShow = document.querySelectorAll('#main-content, [name="buttonSourceDelete"]');
            if (buttonShow.length === 0) return;

            buttonShow.forEach(element => {
                let dataSetSourceId = element.parentElement.dataset;

                if ((typeof dataSetSourceId !== 'undefined') && (typeof dataSetSourceId.sourceId !== 'undefined')) {
                    element.addEventListener('click', () => {
                        document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
                        let modalBody = document.querySelector('#modalDelete .modal-body');
                        modalBody.innerHTML = `<p>Действительно удалить всю информацию об источнике №<strong>${dataSetSourceId.sourceId}</strong>?</p>`;

                        let modalDelete = document.querySelector('#modalDelete [type="submit"]');

                        if (modalDelete.getAttribute('data-exist') !== null) {
                            $('#modalDelete').modal('show');
                            return;
                        }

                        modalDelete.addEventListener('click', () => {
                            let sourceId = document.querySelector('#modalDelete strong').innerHTML;
                            socket.emit('delete source', { processingType: 'deleteSource', sourceId: sourceId });

                            $('#modalDelete').modal('hide');

                            modalDelete.dataset.exist = 'emit exist';
                        });

                        $('#modalDelete').modal('show');
                    });
                }
            });
        })();

        //обработчик на кнопку 'Импорт' для выгрузки информации о источниках в виде xml файла
        importXmlFile();

        //обработчик на кнопку 'Экспорт' для выгрузки информации о источниках в виде xml файла
        exportXmlFile();
    });
})();