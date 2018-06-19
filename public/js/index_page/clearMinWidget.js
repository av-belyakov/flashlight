/*
 * Модуль очистки виджета в котором содержитсякраткая информация о сенсоре.
 * срабатывает при отключении источника
 * 
 * Версия 0.1, дата релиза 18.06.2018
 * */

'use strict';

export default function(listSources) {
    console.log(listSources);

    let listWidgets = document.querySelectorAll('#leftContent [name=minWidget]');
    console.log(listWidgets);

    for (let source in listSources.statusListSources) {
        listWidgets.forEach((element) => {
            if (element.dataset.sourceid === null) return;

            if (source === element.dataset.sourceid) {
                if (!listSources.statusListSources[source].statusConnection) {
                    console.log('element whis ID ' + source);
                }
            }
        });
    }
}