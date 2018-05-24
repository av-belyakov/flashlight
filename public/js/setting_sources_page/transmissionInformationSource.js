/**
 * Передача информации необходимой для добавления источника
 * 
 * Версия 0.1, дата релиза 07.12.2017
 */

'use strict';

import { helpers } from '../common_helpers/helpers';
import { managementIcon } from '../commons/managementIcon';
import getFormElements from './getFormElements';
import createObjectInformationSetting from './createObjectInformationSetting';

export default function transmissionInformationSource() {
    let obj = getFormElements();
    let arrayElement = [
        obj.hostId,
        obj.shortNameHost,
        obj.fullNameHost,
        obj.ipaddress,
        obj.port,
        obj.countProcess
    ];

    let processingType = document.getElementById('myModalLabel').getAttribute('typeWindow');
    let processingTrigger = arrayElement.every(elem => {
        if (elem.value.length === 0) {
            managementIcon.showIcon(elem, false);
            return false;
        } else {
            if (helpers.checkInputValidation(elem) === true) {
                managementIcon.showIcon(elem, true);
                return true;
            } else {
                managementIcon.showIcon(elem, false);
                return false;
            }
        }
    });
    if (processingTrigger) {
        socket.emit('add or edit setting', { processingType: processingType, information: createObjectInformationSetting() });

        $('#modalAddEditHosts').modal('hide');
    }
}