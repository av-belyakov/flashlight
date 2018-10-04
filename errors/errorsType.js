/*
 * Различные типы ошибок
 *
 * Версия 0.1, дата релиза 11.12.2015
 * */

'use strict';

function CustomError(message, cause) {
    Error.call(this, message);
    Error.captureStackTrace(this, CustomError);
    this.message = message;
    this.cause = cause;

    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
    else this.stack = (new Error()).stack;
}
CustomError.prototype = Object.create(Error.prototype);
CustomError.prototype.constructor = CustomError;

//ошибка аутентификации на источнике
exports.errorRemoteHost = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'ErrorRemoteHost';
};

//ошибка аутентификации пользователя
exports.errorAuthenticationUser = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'ErrorAuthenticationUser';
};

//ошибка записи в БД
exports.errorRedisDataBase = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'ErrorRedisDataBase';
};

//ошибка удаления задачи
exports.errorDeletingTask = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'SourceIsNotConnection';
};

//ошибка остановки задачи
exports.sourceIsNotConnection = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'SourceIsNotConnection';
};

//ошибка при загрузке файла
exports.errorLoadingFile = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'ErrorLoadingFile';
};

//полученны некорректные данные
exports.receivedIncorrectData = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'ReceivedIncorrectData';
};

//источник с заданным идентификатором существует
exports.sourceIsExist = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'SourceIsExist';
};

//источник с заданным идентификатором не существует
exports.sourceIsNotExist = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'SourceIsExist';
};

//неопределенная ошибка сервера
exports.undefinedServerError = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'UndefinedServerError';
};

//источник занят, отключние данного источника не возможно
exports.sourceIsBusy = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'SourceIsBusy';
};

//получен пустой массив
exports.receivedEmptyArray = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'ReceivedEmptyArray';
};

//получен пустой объект
exports.receivedEmptyObject = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'ReceivedEmptyObject';
};

//статус поля jobStatus таблицы task_filtering_all_information не 'complete'
exports.fieldJobStatusIsNotComplete = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'FieldJobStatusIsNotComplete';
};

//значение поля countFilesFound таблицы task_filtering_all_information равно 0
exports.fieldCountFilesFoundIsZero = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'FieldCountFilesFoundIsZero';
};

//статус поля countFilesFound таблицы task_filtering_all_information не равен 'not loaded' или 'suspended'
exports.fieldUploadFilesIsNotSuspendedOrNotLoaded = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'fieldUploadFilesIsNotSuspendedOrNotLoaded';
};

//задача на выгрузку сетевого трафика уже в очереди
exports.taskIndexAlreadyExistToTurn = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'TaskIndexAlreadyExistToTurn';
};

//задачи с указанным идентификатором не существует
exports.taskIndexDoesNotExist = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'TaskIndexDoesNotExist';
};

//источник не подключен
exports.sourceNotConnected = function(message, cause) {
    CustomError.apply(this, arguments);
    this.name = 'SourceNotConnected';
};