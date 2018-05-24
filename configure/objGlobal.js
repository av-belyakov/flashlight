/*
 * Глобальный объект для промежуточного хрнения данных
 * содержит:
 *
 * структура объектов
 *  список источников и их статус 
 *   'sources' : { 
 *    '<ID источника>' : {
 *     'connectionStatus': <connect/>disconnect>,
 *     'shortName': <краткое название>
 *     'detailedDescription': <полное название>
 *     'ipaddress': <адрес>
 *     'port': <порт>
 *     'dateLastConnected': <дата последнего соединения>
 *     'numberConnectionAttempts': <количество попыток соединения>
 *     'token': <идентификационный токен>
 *     'maxCountProcessFiltering': <максимальное количество одновременно запузщенных задач фильтрации> 
 *  }}
 *
 *  загружаемые файлы
 *   downloadFilesTmp : { 
 *   '<ip_адрес>' : {
 *    'taskIndex': <id задачи>
 *    'fileName': <имя загружаемого файла>
 *    'fileFullSize': <полный размер файла>
 *    'fileChunkSize': <размер 1%, для подсчета % загрузки>
 *    'fileUploadedSize': <загруженный размер файла>
 *    'fileSizeTmp': <временный размер файла>
 *    'fileUploadedPercent': <объем загруженного файла в %>
 *    'uploadDirectoryFiles': <директория для сохранения файлов>
 *   }}
 *
 *  выполняемые задачи
 *   processingTasks: {
 *    '<tasksIndex>': {
 *     'taskType': <filtering'/'upload>
 *     'sourceId': <идентификатор источника>
 *     'status': <expect' и 'execute' (для фильрации), 'expect', 'in line', 'loaded' (для загрузки файлов)>
 *     'timestampStart': <дата в формате unix>
 *     'timestampModify': <дата в формате unix>
 *    }}
 *
 * */

module.exports = {
    sources: {},
    downloadFilesTmp: {},
    processingTasks: {}
};