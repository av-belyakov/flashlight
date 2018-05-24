/**
 * Синхронизация чекбоксов отвечающих за возможность просматривать страницы 
 * и соответствующие пункты меню
 * 
 * Версия 0.1, дата релиза 29.11.2017 
 */

'use strict';

export default function markRead(elem) {
    let string = elem.target.dataset.keyElementName.split(':');
    let elemNameUserGroup = document.getElementsByName(elem.target.name);

    if (string[0] === 'menu') {
        if (~string[1].indexOf('settings')) {
            let searchSetting = string[1].replace('settings', 'management');

            for (let i = 0; i < elemNameUserGroup.length; i++) {
                let inputValue = elemNameUserGroup[i].dataset.keyElementName.split(':');

                if ((inputValue[0] === searchSetting) && (inputValue[1] === 'read')) {
                    if ((elemNameUserGroup[i].checked === true) && (elem.target.checked === false)) {
                        if (elemNameUserGroup[i].checked === true) elemNameUserGroup[i].checked = false;
                    } else {
                        if (elemNameUserGroup[i].checked === false) elemNameUserGroup[i].checked = true;
                    }
                }
            }
        }
    } else {
        if (string[1] === 'read') {
            if (~string[0].indexOf('management')) {
                let searchSetting = string[0].replace('management', 'settings');

                for (let i = 0; i < elemNameUserGroup.length; i++) {
                    let inputValue = elemNameUserGroup[i].dataset.keyElementName.split(':');

                    if (inputValue[1] === searchSetting) {
                        if ((elemNameUserGroup[i].checked === true) && (elem.target.checked === false)) {
                            if (elemNameUserGroup[i].checked === true) elemNameUserGroup[i].checked = false;
                        } else {
                            if (elemNameUserGroup[i].checked === false) elemNameUserGroup[i].checked = true;
                        }
                    }
                }
            }
        }
    }
}