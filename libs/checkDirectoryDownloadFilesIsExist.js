/*
 * Проверка наличия директори для загрузки файлов и прав доступа на нее
 *
 * Версия 0.1, дата релиза 07.09.2016
 * */

'use strict';

const fs = require('fs');
const async = require('async');

const config = require('../configure');

module.exports = function(callback) {
    async.series([
        //проверяем, в конфигурационном файле, наличие директории для загрузки файлов
        function(callback) {
            if (typeof config.get('downloadDirectory:directoryName') === 'undefined') callback(new Error('incorrect configuration file does not specify a directory for uploading files'));
            else callback(null);
        },
        //проверяем, в конфигурационном файле, наличие директории для временных файлов
        /*        function (callback) {
                    if(typeof config.get('downloadDirectoryTmp:directoryName') === 'undefined') callback(new Error('incorrect configuration file does not specify a directory for uploading files'));
                    else callback(null);
                },*/
        //проверяем наличие директории для загрузки файлов
        function(callback) {
            fs.lstat('/' + config.get('downloadDirectory:directoryName'), function(err, stat) {
                if (err) callback(err);
                else callback(null);
            });
        },
        //проверяем наличие директории для временных файлов
        /*        function (callback) {
                    fs.lstat('/' + config.get('downloadDirectoryTmp:directoryName'), function (err, stat) {
                        if(err) callback(err);
                        else callback(null);
                    });
                },*/
        //проверяем права доступа на запись
        function(callback) {
            fs.appendFile('/' + config.get('downloadDirectory:directoryName') + '/test_write', '', { 'encoding': 'utf8' }, function(err, byte) {
                if (err) callback(err);
                else callback(null);
            });
        },
        /*        function (callback) {
                    fs.appendFile('/' + config.get('downloadDirectoryTmp:directoryName') + '/test_write', '', { 'encoding': 'utf8' }, function (err, byte) {
                        if(err) callback(err);
                        else callback(null);
                    });
                },*/
        //удаляем тестовый файл
        function(callback) {
            fs.unlink('/' + config.get('downloadDirectory:directoryName') + '/test_write', function(err) {
                if (err) callback(err);
                else callback(null);
            });
        },
        /*        function (callback) {
                    fs.unlink('/' + config.get('downloadDirectoryTmp:directoryName') + '/test_write', function (err) {
                        if(err) callback(err);
                        else callback(null);
                    });
                }*/
    ], function(err) {
        if (err) callback(err.toString().split('\n')[0]);
        else callback(null);
    });
};