var settingTask =
webpackJsonp_name_([9],{

/***/ 87:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common__ = __webpack_require__(10);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common___default = __webpack_require__.n(__WEBPACK_IMPORTED_MODULE_0__common__);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_1__setting_task_changeCountTaskProcessing__ = __webpack_require__(88);
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_2__setting_task_changeInformationListSources__ = __webpack_require__(89);






(function () {
    //изменение списка подключенных хостов
    socket.on('status list sources', function (data) {
        Object(__WEBPACK_IMPORTED_MODULE_2__setting_task_changeInformationListSources__["a" /* default */])(data);
    });

    //вывод информации и количества выполняемых задач
    socket.on('change object status', function (data) {
        if (Object.keys(data.informationPageAdmin).length > 0) {
            console.log(data);
        }

        Object(__WEBPACK_IMPORTED_MODULE_1__setting_task_changeCountTaskProcessing__["a" /* default */])(data);
    });

    document.addEventListener('DOMContentLoaded', function () {
        __WEBPACK_IMPORTED_MODULE_0__common___default.a.toolTip();

        //настраиваем минимальную высоту правого контента (со списком источников)
        (function () {
            let scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight, document.body.offsetHeight, document.documentElement.offsetHeight, document.body.clientHeight, document.documentElement.clientHeight);
            let minHeight = scrollHeight - 287;
            document.getElementById('leftContent').setAttribute('style', `min-height:${minHeight}px; margin-left:10px;`);
        })();
    });
})();

/***/ }),

/***/ 88:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Изменение количества выполняемых задач
 * 
 * Версия 0.1, дата релиза 21.02.2018 
 */



/* harmony default export */ __webpack_exports__["a"] = (function (data) {
    let objLists = data.informationPageAdmin;

    let taskFilteringIsExist = typeof objLists.taskFiltering === 'undefined';
    let taskTurnFilesIsExist = typeof objLists.taskTurnDownloadingFiles === 'undefined';
    let taskImplementFilesIsExist = typeof objLists.taskImplementationDownloadingFiles === 'undefined';

    if (taskFilteringIsExist || taskTurnFilesIsExist || taskImplementFilesIsExist) return;

    let content = '<div class="box1"><span class="li_cloud"></span>';
    content += '<h3>';
    content += `${objLists.taskFiltering.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += `${objLists.taskTurnDownloadingFiles.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += objLists.taskImplementationDownloadingFiles.length;
    content += '</h3></div><p>';
    content += `${objLists.taskFiltering.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += `${objLists.taskTurnDownloadingFiles.length}&nbsp;&nbsp;/&nbsp;&nbsp;`;
    content += `${objLists.taskImplementationDownloadingFiles.length} выполняемые задачи по фильтрации, выгрузки и очереди на выгрузку сетевого трафика`;
    content += '</p></div>';

    let boxCountAllTasks = document.getElementById('boxCountAllTasks');
    boxCountAllTasks.innerHTML = content;
});

/***/ }),

/***/ 89:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
/**
 * Изменение списка источников и их количества
 * 
 * Версия 0.1, дата релиза 14.02.2018
 */



/* harmony default export */ __webpack_exports__["a"] = (function (data) {
    let countConnectSource = 0;
    let countDisconnectSource = 0;

    let elementList = '<ul style="padding-bottom:20px;">';
    for (let source in data.statusListSources) {
        let statusConnectionIsTrue = data.statusListSources[source].statusConnection;
        let status = statusConnectionIsTrue ? 'my_circle_green' : 'my_circle_red';

        if (statusConnectionIsTrue) countConnectSource++;else countDisconnectSource++;

        elementList += '<li style="padding-bottom: 3px;">';
        elementList += `<canvas class="${status}"></canvas>&nbsp;&nbsp;<a href="#">${source}&nbsp;${data.statusListSources[source].shortName}</a>`;
        elementList += '</li>';
    }
    elementList += '</ul>';
    let elementLeftContent = document.getElementById('leftContent');
    elementLeftContent.innerHTML = elementList;

    let boxCountConnection = '<div class="box1">';
    boxCountConnection += '<span class="li_heart"></span>';
    boxCountConnection += `<h3>${countConnectSource}&nbsp;/&nbsp;${countDisconnectSource}</h3>`;
    boxCountConnection += '</div>';
    boxCountConnection += `<p>${countConnectSource}&nbsp;/&nbsp;${countDisconnectSource}&nbsp;количество источников в статусе подключен и недоступен</p>`;

    document.getElementById('boxCountConnection').innerHTML = boxCountConnection;
});

/***/ })

},[87]);
//# sourceMappingURL=settingTask.js.map