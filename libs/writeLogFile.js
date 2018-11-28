/*
 * Записывает информацию в лог файл
 *
 * Версия 1.1, дата релиза 14.07.2016
 * */

'use strict';

const fs = require('fs');

module.exports.writeLog = function(writeString) {
    //получаем локальное время с учетом временной зоны
    let x = (new Date()).getTimezoneOffset() * 60000;
    let currentDate = (new Date(Date.now() - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, '');
    let fileNameCurrentDate = currentDate.split(' ');

    let dirRoot = __dirname.substr(0, (__dirname.length - 5));
    let logFile = dirRoot + '/log/flashlight.log';

    fs.lstat(`${dirRoot}/log`, (err) => {
        if (err) {
            fs.mkdir(`${dirRoot}/log`, (err) => {
                if (err) console.log(err.toString());
            });
        }

        try {
            //удаляем старые файлы
            deleteOldLogFilesSync(`${dirRoot}/log/`, 10);
            //пишем информацию в лог-файл
            fs.appendFileSync(logFile, currentDate + '\t' + writeString + '\n', { 'encoding': 'utf8' });

            let stats = fs.lstatSync(logFile);
            if (stats.size > 10000000) {
                fs.renameSync(logFile, `${dirRoot}/log/${fileNameCurrentDate[0]}_${fileNameCurrentDate[1]}_flashlight.log`);
                fs.appendFileSync(logFile, '', { 'encoding': 'utf8' });
            }
        } catch (err) {
            console.log('Error: ' + err.toString());
        }
    });
};

function deleteOldLogFilesSync(dir, countSafeFiles) {
    let files = fs.readdirSync(dir);
    if (files.length > countSafeFiles) {
        files.sort();

        let arrayFilesRemove = files.splice(0, files.length - countSafeFiles);
        arrayFilesRemove.forEach(function(item) {
            fs.unlinkSync(dir + item);
        });
    }
}