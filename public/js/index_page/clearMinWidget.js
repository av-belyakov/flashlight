/*
 * Модуль очистки виджета в котором содержитсякраткая информация о сенсоре.
 * срабатывает при отключении источника
 * 
 * Версия 0.1, дата релиза 18.06.2018
 * */

'use strict';

export default function(listSources) {
    let listWidgets = document.querySelectorAll('[name=minWidget]');

    for (let source in listSources.statusListSources) {
        listWidgets.forEach((element) => {
            if (element.dataset.sourceid === null) return;

            if (source === element.dataset.sourceid) {
                if (!listSources.statusListSources[source].statusConnection) {
                    element.innerHTML = `<div class="white-panel pn donut-chart" name="minWidget" data-sourceId="${source}">
                        <div class="white-header"><h5>${source} ${listSources.statusListSources[source].detailedDescription}</h5></div>
                            <div class="row">
                                <div class="col-sm-12 col-xs-12 goleft" name="${source}">
                                    <div class="text-center"><h4>источник не подключен</h4></div>
                                </div>
                            </div>
                        </div>`;
                }
            }
        });
    }
}