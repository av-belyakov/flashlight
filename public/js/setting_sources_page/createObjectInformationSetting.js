/**
 * Модуль формирования объекта с введенной пользователем информации
 * 
 * Версия 0.1, дата релиза 07.12.2017
 */

'use strict';

import { helpers } from '../common_helpers/helpers';
import getFormElements from './getFormElements';

export default function createObjectInformationSetting() {
    let obj = {};
    let elements = getFormElements();
    for (let key in elements) {
        if (key === 'token') {
            let elemToken = document.getElementById('token').children[0].innerHTML;
            let token = helpers.tokenRand();
            obj[key] = (elemToken === '&nbsp;') ? token : elemToken;
        } else {
            obj[key] = elements[key].value;
        }
    }
    return obj;
}