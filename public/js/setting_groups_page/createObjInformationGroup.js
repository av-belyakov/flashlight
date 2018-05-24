/**
 * Создание объекта с измененной информацией по группе
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */

'use strict';

export default function createObjInformationGroup(getGroupCheckbox, groupName) {
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