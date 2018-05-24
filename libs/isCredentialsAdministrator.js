/*
 * проверяем наличие учетных данных администратора и если его нет устанавливаем пароль по умолчанию
 *
 * Версия 0.1, дата релиза 08.01.2016
 * */

'use strict';

const crypto = require('crypto');

const writeLogFile = require('./writeLogFile');
const hashPassword = require('./hashPassword');

module.exports.addAdminCredentials = function(redis) {
    let md5string = crypto.createHash('md5')
        .update('administrator')
        .digest('hex');

    let passwd = hashPassword.getHashPassword(md5string, 'this is flashlight');

    redis.hget('user_authntication:userid_administrator', 'password', function(err, password) {
        if (err) return writeLogFile.writeLog('\tError: ' + err.toString());

        if (password === null) {
            //добавляем учетные данные для администратора
            redis.hmset('user_authntication:userid_administrator', {
                'date_register': +new Date(),
                'date_change': +new Date(),
                'login': 'administrator',
                'password': passwd,
                'group': 'administrator',
                'user_name': 'Администратор',
                'settings': '{ "remoteHosts" : [] }'
            }, function(err) {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
            });

            //добавляе настройки для группы администратора
            redis.hmset('user_group:administrator', {
                'menu': '{ "name" : "Пункты меню настроек", "data" : { "settings_admin": [ true, "администрирование приложения" ], "settings_groups": [ true, "группы пользователей" ], "settings_users": [ true, "пользователи" ], "settings_sources": [ true, "источники" ], "settings_dashboard": [ true, "информационная панель" ] }}',
                'management_tasks_filter': '{ "name" : "Задачи фильтрации", "data" : { "read": [ true, "просмотр" ], "import": [ true, "импорт файлов" ], "delete": [ true, "удаление" ] }}',
                'management_tasks_import': '{ "name" : "Задачи по импорту файлов", "data" : { "cancel": [ true, "отмена" ], "stop": [ true, "остановка" ], "resume": [ true, "возобновление" ] }}',
                'management_uploaded_files': '{ "name" : "Информация о загруженных файлах", "data" : { "status_change": [ true, "изменение статуса" ], "delete": [ true, "удаление" ] }}',
                'management_groups': '{ "name" : "Группы", "data" : { "create": [ true, "создание" ], "read": [ true, "просмотр" ], "edit": [ true, "редактирование" ], "delete": [ true, "удаление" ] }}',
                'management_users': '{ "name" : "Пользователи", "data" : { "create": [ true, "создание" ], "read": [ true, "просмотр" ], "edit": [ true, "редактирование" ], "delete": [ true, "удаление" ] }}',
                'management_sources': '{ "name" : "Источники", "data" : { "create": [ true, "создание" ], "read": [ true, "просмотр" ], "edit": [ true, "редактирование" ], "delete": [ true, "удаление" ] }}',
                'management_dashboard': '{ "name" : "Информационные панели", "data" : { "create": [ true, "создание" ], "read": [ true, "просмотр" ], "edit": [ true, "редактирование" ], "delete": [ true, "удаление" ] }}',
                'management_admin': '{ "name" : "Администрирование", "data" : { "read": [ true, "просмотр" ], "status_change": [ true, "изменение статуса" ], "delete": [ true, "удаление" ], "resumption": [ true, "возобновление" ] }}'
            }, function(err) {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
            });
        }
    });
};