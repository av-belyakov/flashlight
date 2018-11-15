'use strict';

import common from './common';
import changeCountTaskProcessing from './setting_task/changeCountTaskProcessing';
import changeInformationListSources from './setting_task/changeInformationListSources';

(function() {
    //изменение списка подключенных хостов
    socket.on('status list sources', function(data) {
        changeInformationListSources(data);
    });

    //вывод информации и количества выполняемых задач
    socket.on('change object status', function(data) {
        changeCountTaskProcessing(data);
    });

    document.addEventListener('DOMContentLoaded', function() {
        common.toolTip();

        //настраиваем минимальную высоту правого контента (со списком источников)
        (function() {
            let scrollHeight = Math.max(
                document.body.scrollHeight, document.documentElement.scrollHeight,
                document.body.offsetHeight, document.documentElement.offsetHeight,
                document.body.clientHeight, document.documentElement.clientHeight
            );
            let minHeight = scrollHeight - 287;
            document.getElementById('leftContent').setAttribute('style', `min-height:${minHeight}px; margin-left:10px;`);
        })();
    });
})();