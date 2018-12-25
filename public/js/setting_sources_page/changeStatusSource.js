/**
 * Модуль изменяющий состояние источника
 * 
 * Версия 0.1, дата релиза 24.12.2018
 */

'use strict';

/**
 * 
 * @param {*} объект типа {
 *      <sourceID>: {
 *          statusConnection: true/flase,
 *          shortName: <краткое название>,
 *          detailedDescription: <полное название> 
 *      } 
 *  }
 */
export default function changeStatusSource(statusListsSources) {
    for (let sourceID in statusListsSources) {
        let status = statusListsSources[sourceID].statusConnection ? 'my_circle_green' : 'my_circle_red';

        let element = document.querySelector('.table [name="' + sourceID + '"] > canvas');
        element.className = status;
    }
}