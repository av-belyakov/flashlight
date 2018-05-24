'use strict';

const io = require('socket.io-client');

global.jQuery = require('jquery');
global.$ = require('jquery');

require('bootstrap');
require('bootstrapNotify');
require('bootstrapToggle');
require('bootstrapTokenfield');
require('bootstrapDatetimepicker');

global.socket = io.connect();
global.ss = require('socket.io-stream');

/* 
 * всплывающие подсказки
 * инициализировать элемент, имеющий идентификатор tooltip, как компонент tooltip
 **/
module.exports.toolTip = function() {
    $('[data-toggle="tooltip"]').tooltip();
};