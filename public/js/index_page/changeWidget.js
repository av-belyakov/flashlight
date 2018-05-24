/*
 * Модуль изменяющий виджет сенсора
 * 
 * Версия 0.1, дата релиза 16.11.2017
 * */

'use strict';

import { helpers } from '../common_helpers/helpers.js';

export default {
    //изменить виджет при отключении сенсора
    changeWidgetForDisconnection(sourceId) {
        let divSourceId = document.getElementsByName(sourceId);

        if (typeof divSourceId[0] === 'undefined') return;

        divSourceId[0].innerHTML = '<div class="text-center"><div class=" text-center"><h4>источник не подключен</h4></div></div>';
    }
};