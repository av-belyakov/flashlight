var settingGroupsPage =
webpackJsonp_name_([8],{

/***/ 0:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (binding) */ __webpack_require__.d(__webpack_exports__, "a", function() { return showNotify; });
/**
 * Общий вид сообщений
 * 
 * Версия 0.1, дата релиза 23.11.2017
 */



let showNotify = function (type, message) {
    $.notify({
        message: message
    }, {
        type: type,
        placement: { from: 'top', align: 'right' },
        offset: { x: 0, y: 60 }
    });
};



/***/ }),

/***/ 39:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Модуль изменения информационных иконок полей ввода
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */



function ManagementIcon() {
    let elemSpanIcon = document.getElementById('iconSuccess');
    this.elemSpanIcon = elemSpanIcon;
    this.parentNode = elemSpanIcon.parentNode;
}

ManagementIcon.prototype.showIcon = function (trigger) {
    if (!trigger) {
        this.elemSpanIcon.classList.remove('glyphicon-ok');
        this.parentNode.classList.remove('has-success');
        this.elemSpanIcon.classList.add('glyphicon-remove');
        this.parentNode.classList.add('has-error');
    } else {
        this.elemSpanIcon.classList.remove('glyphicon-remove');
        this.parentNode.classList.remove('has-error');
        this.elemSpanIcon.classList.add('glyphicon-ok');
        this.parentNode.classList.add('has-success');
    }
};

ManagementIcon.prototype.clearIcon = function () {
    this.elemSpanIcon.classList.remove('glyphicon-ok');
    this.parentNode.classList.remove('has-success');
    this.elemSpanIcon.classList.remove('glyphicon-remove');
    this.parentNode.classList.remove('has-error');
};

/* harmony default export */ __webpack_exports__["a"] = (ManagementIcon);

/***/ }),

/***/ 40:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createObjInformationGroup;
/**
 * Создание объекта с измененной информацией по группе
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */



function createObjInformationGroup(getGroupCheckbox, groupName) {
    let newObj = { name: groupName };
    let typeItem = '';

    for (let i = 0; i < getGroupCheckbox.length; i++) {
        let hiddenValue = getGroupCheckbox[i].dataset.keyElementName.split(':');

        if (typeItem !== hiddenValue[0]) {
            newObj[hiddenValue[0]] = {};
            typeItem = hiddenValue[0];
        }
        newObj[typeItem][hiddenValue[1]] = getGroupCheckbox[i].checked;
    }
    return newObj;
}

/***/ }),

/***/ 76:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__ = __webpack_require__(0);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__setting_groups_page_markRead__ = __webpack_require__(77);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setting_groups_page_createGroup__ = __webpack_require__(78);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_3__setting_groups_page_managementIcon__ = __webpack_require__(39);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_4__setting_groups_page_createObjInformationGroup__ = __webpack_require__(40);








(function () {
    socket.on('notify information', function (data) {
        let obj = JSON.parse(data.notify);
        Object(__WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__["a" /* showNotify */])(obj.type, obj.message);

        if (obj.type === 'info') {
            setTimeout(function () {
                window.location.reload();
            }, 5000);
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        //обработчик на кнопку добавить группу
        (function () {
            let buttonAddGroup = document.getElementById('buttonAddGroup');
            if (buttonAddGroup !== null) {
                buttonAddGroup.addEventListener('click', () => {
                    let managementIcon = new __WEBPACK_IMPORTED_MODULE_3__setting_groups_page_managementIcon__["a" /* default */]();
                    managementIcon.clearIcon();
                    $('#modalAddGroup').modal('show');
                });
            }
        })();

        //обработчик на кнопки удалить группу
        (function () {
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
        (function () {
            let buttonEditGroup = document.querySelectorAll('#main-content [name="buttonEditGroup"]');
            buttonEditGroup.forEach(element => {
                if (element !== null) {
                    element.addEventListener('click', () => {
                        let groupName = element.parentElement.dataset.groupName;
                        let getGroupCheckbox = document.getElementsByName('checkbox_' + groupName);
                        let newObj = Object(__WEBPACK_IMPORTED_MODULE_4__setting_groups_page_createObjInformationGroup__["a" /* default */])(getGroupCheckbox, groupName);

                        socket.emit('edit group', newObj);
                    });
                }
            });
        })();

        //обработчик на кнопку 'сохранить' модального окна
        (function () {
            if (document.getElementById('modalAddGroup') !== null) {
                let saveButtonModalWindow = document.querySelector('#modalAddGroup .modal-footer [type="submit"]');
                saveButtonModalWindow.addEventListener('click', __WEBPACK_IMPORTED_MODULE_2__setting_groups_page_createGroup__["a" /* default */]);
            }
        })();

        //обработчик на кнопку 'удалить'
        (function () {
            document.querySelector('#modalDelete .btn-primary').addEventListener('click', () => {
                let groupName = document.querySelector('#modalDelete strong').innerHTML;

                socket.emit('del group', { name: groupName });
                $('#modalDelete').modal('hide');
            });
        })();

        //проверяем название группы
        (function () {
            let elementNewGroupName = document.getElementById('newGroupName');

            if (elementNewGroupName !== null) {
                elementNewGroupName.addEventListener('change', elem => {
                    let managementIcon = new __WEBPACK_IMPORTED_MODULE_3__setting_groups_page_managementIcon__["a" /* default */]();
                    managementIcon.clearIcon();
                    if (!/^[a-zA-Z0-9]{4,}$/.test(elem.target.value)) managementIcon.showIcon(false);else managementIcon.showIcon(true);
                });
            }
        })();

        //обработчики на чекбоксы в модальном окне
        (function () {
            let checkboxModalWindow = document.querySelectorAll('#modalAddGroup [name=checkbox_newGroupUniqueId]');
            if (checkboxModalWindow !== null && checkboxModalWindow.length > 0) {
                checkboxModalWindow.forEach(checkboxElement => {
                    let [key, elementName] = checkboxElement.dataset.keyElementName.split(':');
                    if (key === 'menu' || elementName === 'read') {
                        checkboxElement.onclick = __WEBPACK_IMPORTED_MODULE_1__setting_groups_page_markRead__["a" /* default */];
                    }
                });
            }
        })();

        //обработчик на чекбоксы в основном окне
        (function () {
            let checkboxMainPage = document.querySelectorAll('#main-content [name^="checkbox"]');
            checkboxMainPage.forEach(elemCheckbox => {
                if (!elemCheckbox.disabled) elemCheckbox.onclick = __WEBPACK_IMPORTED_MODULE_1__setting_groups_page_markRead__["a" /* default */];
            });
        })();
    });
})();

/***/ }),

/***/ 77:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = markRead;
/**
 * Синхронизация чекбоксов отвечающих за возможность просматривать страницы 
 * и соответствующие пункты меню
 * 
 * Версия 0.1, дата релиза 29.11.2017 
 */



function markRead(elem) {
    let string = elem.target.dataset.keyElementName.split(':');
    let elemNameUserGroup = document.getElementsByName(elem.target.name);

    if (string[0] === 'menu') {
        if (~string[1].indexOf('settings')) {
            let searchSetting = string[1].replace('settings', 'management');

            for (let i = 0; i < elemNameUserGroup.length; i++) {
                let inputValue = elemNameUserGroup[i].dataset.keyElementName.split(':');

                if (inputValue[0] === searchSetting && inputValue[1] === 'read') {
                    if (elemNameUserGroup[i].checked === true && elem.target.checked === false) {
                        if (elemNameUserGroup[i].checked === true) elemNameUserGroup[i].checked = false;
                    } else {
                        if (elemNameUserGroup[i].checked === false) elemNameUserGroup[i].checked = true;
                    }
                }
            }
        }
    } else {
        if (string[1] === 'read') {
            if (~string[0].indexOf('management')) {
                let searchSetting = string[0].replace('management', 'settings');

                for (let i = 0; i < elemNameUserGroup.length; i++) {
                    let inputValue = elemNameUserGroup[i].dataset.keyElementName.split(':');

                    if (inputValue[1] === searchSetting) {
                        if (elemNameUserGroup[i].checked === true && elem.target.checked === false) {
                            if (elemNameUserGroup[i].checked === true) elemNameUserGroup[i].checked = false;
                        } else {
                            if (elemNameUserGroup[i].checked === false) elemNameUserGroup[i].checked = true;
                        }
                    }
                }
            }
        }
    }
}

/***/ }),

/***/ 78:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/* harmony export (immutable) */ __webpack_exports__["a"] = createGroup;
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__managementIcon__ = __webpack_require__(39);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__createObjInformationGroup__ = __webpack_require__(40);
/**
 * Содание новой группы пользователей
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */






function createGroup() {
    let groupName = document.querySelector('#newGroupName').value;
    let managementIcon = new __WEBPACK_IMPORTED_MODULE_0__managementIcon__["a" /* default */]();

    if (groupName.length === 0 || !/\b^[a-zA-Z0-9]+$\b/.test(groupName)) {
        managementIcon.showIcon(false);
        return false;
    }

    managementIcon.showIcon(true);
    let getGroupCheckbox = document.getElementsByName('checkbox_newGroupUniqueId');
    let newObj = Object(__WEBPACK_IMPORTED_MODULE_1__createObjInformationGroup__["a" /* default */])(getGroupCheckbox, groupName);

    socket.emit('add group', newObj);
    $("#modalAddGroup").modal('hide');
}

/***/ })

},[76]);
//# sourceMappingURL=settingGroupsPage.js.map