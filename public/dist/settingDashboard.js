var settingDashboard =
webpackJsonp_name_([11],{

/***/ 184:
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
Object.defineProperty(__webpack_exports__, "__esModule", { value: true });
/* harmony import */ var __WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__ = __webpack_require__(2);




(function () {
    //управление источниками
    function saveCheckedSources() {
        let array = [];
        let sources = document.getElementsByName('sourceId');

        for (let name in sources) {
            if (sources[name].nodeType === 1 && sources[name].checked) {
                array.push(sources[name].value);
            }
        }
        socket.emit('change source for user', { processingType: 'edit', information: array });
    }

    socket.on('notify information', function (data) {
        let obj = JSON.parse(data.notify);
        Object(__WEBPACK_IMPORTED_MODULE_0__common_helpers_showNotify__["a" /* showNotify */])(obj.type, obj.message);
    });

    document.addEventListener('DOMContentLoaded', function () {
        let buttonSave = document.getElementById('buttonSave');
        if (buttonSave !== null) {
            buttonSave.addEventListener('click', saveCheckedSources);
        }
    });
})();

/***/ }),

/***/ 2:
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



/***/ })

},[184]);
//# sourceMappingURL=settingDashboard.js.map