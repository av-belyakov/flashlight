/**
 * Модуль возвращающий объект с данными формы источника
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */

'use strict';

export default function getFormElements() {
    return {
        'hostId': document.getElementsByName('hostId')[0],
        'shortNameHost': document.getElementsByName('shortNameHost')[0],
        'fullNameHost': document.getElementsByName('fullNameHost')[0],
        'ipaddress': document.getElementsByName('ipaddress')[0],
        'port': document.getElementsByName('port')[0],
        'countProcess': document.getElementsByName('countProcess')[0],
        'token': document.getElementById('token')
    };
}