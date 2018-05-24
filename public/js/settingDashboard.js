'use strict';

import { showNotify } from './common_helpers/showNotify';

(function() {
    //управление источниками
    function saveCheckedSources() {
        let array = [];
        let sources = document.getElementsByName('sourceId');

        for (let name in sources) {
            if ((sources[name].nodeType === 1) && (sources[name].checked)) {
                array.push(sources[name].value);
            }
        }
        socket.emit('change source for user', { processingType: 'edit', information: array });
    }

    socket.on('notify information', function(data) {
        let obj = JSON.parse(data.notify);
        showNotify(obj.type, obj.message);
    });

    document.addEventListener('DOMContentLoaded', function() {
        let buttonSave = document.getElementById('buttonSave');
        if (buttonSave !== null) {
            buttonSave.addEventListener('click', saveCheckedSources);
        }
    });
})();