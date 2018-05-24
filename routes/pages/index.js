/*
 * Подключение страниц приложения
 *
 * Верися 0.1, дата релиза 15.01.2016
 * */

//главная страница
exports.mainPage = require('./mainPage');

//странита аутентификации
exports.authenticate = require('./authenticate');

/* управление настройками приложения
 * - группами
 * - администрирование приложения
 * - пользователями
 * - источниками
 * - информационными полями
 * */

exports.managementTask = require('./management/managementTask');
exports.managementGroups = require('./management/managementGroups');
exports.managementUsers = require('./management/managementUsers');
exports.managementSources = require('./management/managementSources');
exports.managementDashboard = require('./management/managementDashboard');

//информация по предыдущим и текущим заданиям на фильтрацию
exports.jobLog = require('./jobLog');

//информация по ошибкам получаемым от удаленных хостов
exports.errorsLog = require('./errorsLog');

//информация о загруженных файлах
exports.uploadedFilesLog = require('./uploadedFilesLog');