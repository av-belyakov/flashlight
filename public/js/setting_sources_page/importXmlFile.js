/**
 * Модуль импорта информации из файла в формате XML в БД приложения
 * 
 * Версия 0.1, дата релиза 06.12.2017
 */

'use strict';

//импорт файла с информацией об источниках
export default function importXmlFile() {
    $(document).on('change', '.btn-file :file', function() {
        let input = $(this),
            numFiles = input.get(0).files ? input.get(0).files.length : 1,
            label = input.val().replace(/\\/g, '/').replace(/.*\//, '');
        input.trigger('fileselect', [numFiles, label]);
    });

    $(document).ready(function() {
        $('.btn-file :file').on('fileselect', function(event, numFiles, label) {
            $('#modalProgressBar').modal('show');

            let file = event.target.files[0];
            let stream = ss.createStream();

            ss(socket).emit('upload file sources setting', stream, { name: label, size: file.size });
            let blobStream = ss.createBlobReadStream(file);
            let size = 0;
            blobStream.pipe(stream);
            blobStream.on('data', function(chunk) {
                size += chunk.length;
                let percent = (Math.floor(size / file.size * 100) + '%');
                let divProgressBar = document.querySelector('#modalProgressBar .progress-bar');
                divProgressBar.setAttribute('aria-valuenow', percent);
                divProgressBar.style.width = percent;
                divProgressBar.innerHTML = percent;

                if (file.size === size) $('#modalProgressBar').modal('hide');
            });
        });
    });
}