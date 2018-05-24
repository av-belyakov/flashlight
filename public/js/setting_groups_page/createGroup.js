/**
 * Содание новой группы пользователей
 * 
 * Версия 0.1, дата релиза 29.11.2017
 */

'use strict';

import ManagementIcon from './managementIcon';
import createObjInformationGroup from './createObjInformationGroup';

export default function createGroup() {
    let groupName = document.querySelector('#newGroupName').value;
    let managementIcon = new ManagementIcon();

    if ((groupName.length === 0) || (!/\b^[a-zA-Z0-9]+$\b/.test(groupName))) {
        managementIcon.showIcon(false);
        return false;
    }

    managementIcon.showIcon(true);
    let getGroupCheckbox = document.getElementsByName('checkbox_newGroupUniqueId');
    let newObj = createObjInformationGroup(getGroupCheckbox, groupName);

    socket.emit('add group', newObj);
    $("#modalAddGroup").modal('hide');
}