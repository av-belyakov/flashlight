/**
 * Модуль реализующий получение информации об индексах через API
 * 
 * Версия 0.1, дата релиза 20.03.2018
 */

'use strict';

/**
 * @param objParametr содержит такие данные как 
 * - ID сенсора
 * - IP адреса или диапазоны сетей по которым осуществляется поиск
 * - дата и время
 * 
 * @param func является callback, возвращает следующие значения
 * err - ошибка или null если ее нет
 * isExist - значение типа bool (true - индексы найдены, false - нет используем индексы)
 * taskIndex - идентификатор задачи
 */

module.exports = function(objParametr, taskIndex, func) {
    /** 
     * ПОКА ЭТО ЗАГЛУШКА для доступа к API 
     * Здесь надо будет реализовать:
     * 1. доступ к сторониему API
     * 2. формирование запроса, получение данных
     * 3. если по заданному запросу был возвращен список файлов сохранить его в таблицу БД 
     * */

    console.log('+++ module indexAPI, read parametrs objParametr +++');
    console.log(objParametr);

    let err = null;
    let isExist = false;

    func(err, isExist, taskIndex);
};