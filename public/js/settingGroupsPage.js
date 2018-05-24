'use strict';

import { showNotify } from './common_helpers/showNotify';
import markRead from './setting_groups_page/markRead';
import createGroup from './setting_groups_page/createGroup';
import ManagementIcon from './setting_groups_page/managementIcon';
import createObjInformationGroup from './setting_groups_page/createObjInformationGroup';

(function() {
    socket.on('notify information', function(data) {
        let obj = JSON.parse(data.notify);
        showNotify(obj.type, obj.message);

        if (obj.type === 'info') {
            setTimeout(function() {
                window.location.reload();
            }, 5000);
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        //обработчик на кнопку добавить группу
        (function() {
            let buttonAddGroup = document.getElementById('buttonAddGroup');
            if (buttonAddGroup !== null) {
                buttonAddGroup.addEventListener('click', () => {
                    let managementIcon = new ManagementIcon();
                    managementIcon.clearIcon();
                    $('#modalAddGroup').modal('show');
                });
            }
        })();

        //обработчик на кнопки удалить группу
        (function() {
            let buttonDelGroup = document.querySelectorAll('#main-content [name="buttonDelGroup"]');
            buttonDelGroup.forEach(element => {
                if (element !== null) {
                    element.addEventListener('click', () => {
                        let groupName = element.parentElement.dataset.groupName;

                        document.querySelector('#modalLabelDelete .modal-title').innerHTML = 'Удаление';
                        document.querySelector('#modalDelete .modal-body').innerHTML = `<p>Действительно удалить группу <strong>${groupName}</strong>?</p>`;

                        $('#modalDelete').modal('show');
                    });
                }
            });
        })();

        //обработчик на кнопки редактировать группу
        (function() {
            let buttonEditGroup = document.querySelectorAll('#main-content [name="buttonEditGroup"]');
            buttonEditGroup.forEach(element => {
                if (element !== null) {
                    element.addEventListener('click', () => {
                        let groupName = element.parentElement.dataset.groupName;
                        let getGroupCheckbox = document.getElementsByName('checkbox_' + groupName);
                        let newObj = createObjInformationGroup(getGroupCheckbox, groupName);

                        socket.emit('edit group', newObj);
                    });
                }
            });
        })();

        //обработчик на кнопку 'сохранить' модального окна
        (function() {
            if (document.getElementById('modalAddGroup') !== null) {
                let saveButtonModalWindow = document.querySelector('#modalAddGroup .modal-footer [type="submit"]');
                saveButtonModalWindow.addEventListener('click', createGroup);
            }
        })();

        //обработчик на кнопку 'удалить'
        (function() {
            document.querySelector('#modalDelete .btn-primary').addEventListener('click', () => {
                let groupName = document.querySelector('#modalDelete strong').innerHTML;

                socket.emit('del group', { name: groupName });
                $('#modalDelete').modal('hide');
            });
        })();

        //проверяем название группы
        (function() {
            let elementNewGroupName = document.getElementById('newGroupName');

            if (elementNewGroupName !== null) {
                elementNewGroupName.addEventListener('change', ((elem) => {
                    let managementIcon = new ManagementIcon();
                    managementIcon.clearIcon();
                    if (!/^[a-zA-Z0-9]{4,}$/.test(elem.target.value)) managementIcon.showIcon(false);
                    else managementIcon.showIcon(true);
                }));
            }
        })();

        //обработчики на чекбоксы в модальном окне
        (function() {
            let checkboxModalWindow = document.querySelectorAll('#modalAddGroup [name=checkbox_newGroupUniqueId]');
            if (checkboxModalWindow !== null && checkboxModalWindow.length > 0) {
                checkboxModalWindow.forEach((checkboxElement) => {
                    let [key, elementName] = checkboxElement.dataset.keyElementName.split(':');
                    if ((key === 'menu') || (elementName === 'read')) {
                        checkboxElement.onclick = markRead;
                    }
                });
            }
        })();

        //обработчик на чекбоксы в основном окне
        (function() {
            let checkboxMainPage = document.querySelectorAll('#main-content [name^="checkbox"]');
            checkboxMainPage.forEach((elemCheckbox) => {
                if (!elemCheckbox.disabled) elemCheckbox.onclick = markRead;
            });
        })();
    });
})();