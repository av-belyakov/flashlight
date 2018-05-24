/**
 * Модуль экспорта информации из БД приложения в файл формата XML
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */

'use strict';

export default function exportXmlFile() {
    let exportFile = document.getElementById('exportFile');
    exportFile.addEventListener('click', function() {

        let link = document.createElement('a');

        link.download = 'fileName.ext';
        link.href = '/export_file_setup_hosts';

        let clickEvent = document.createEvent('MouseEvent');
        clickEvent.initEvent('click', true, true);

        link.dispatchEvent(clickEvent);
    });
}