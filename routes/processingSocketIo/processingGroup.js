/*
 * Управление пользователями
 *
 * - добавление
 * - редактирование
 * - удаление
 *
 * Версия 0.2, дата релиза 07.02.2018
 * */

'use strict';

const async = require('async');

const showNotify = require('../../libs/showNotify');
const controllers = require('../../controllers');
const writeLogFile = require('../../libs/writeLogFile');

const redis = controllers.connectRedis();

//создание новой группы
exports.addGroup = function(socketIo, obj) {
    if (!(/\b^[a-zA-Z0-9]+$\b/.test(obj.name))) {
        return showNotify(socketIo, 'danger', `Некорректное имя группы <strong>${obj.name}</strong>`);
    }

    redis.hmset('user_group:' + obj.name, getObjectInformationGroup(obj), function(err) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            showNotify(socketIo, 'danger', `Не возможно создать новую группу <strong>${obj.name}</strong>`);
        } else {
            showNotify(socketIo, 'info', `Группа <strong>${obj.name}</strong> добавленна`);
        }
    });
};

//редактирование группы
exports.editGroup = function(socketIo, obj) {
    new Promise((resolve, reject) => {
        redis.del('user_group:' + obj.name, function(err) {
            if (err) reject(err);
            else resolve();
        });
    }).then(() => {
        return new Promise((resolve, reject) => {
            redis.hmset('user_group:' + obj.name, getObjectInformationGroup(obj), function(err) {
                if (err) reject(err);
                else resolve();
            });
        }).catch((err) => {
            throw err;
        });
    }).then(() => {
        showNotify(socketIo, 'success', `Изменения прав для группы <strong>${obj.name}</strong> сохранены успешно`);
    }).catch((err) => {
        showNotify(socketIo, 'danger', `Не возможно изменить информацию о группе <strong>${obj.name}</strong>`);
        writeLogFile.writeLog('\tError: ' + err.toString());
    });
};

//удаление группы
exports.deleteGroup = function(socketIo, obj) {
    async.waterfall([
        function(callback) {
            redis.keys('user_authntication:*', function(err, arrayUserId) {
                if (err) callback(err);
                else callback(null, arrayUserId);
            });
        },
        function(arrayUserId, callback) {
            if (arrayUserId.length === 0) return callback('Error users not found');

            async.map(arrayUserId, function(item, callbackMap) {
                redis.hget(item, 'group', function(err, group) {
                    if (err) return callbackMap(err);

                    let triger = (group === obj.name) ? true : false;
                    callbackMap(null, triger);
                });
            }, function(err, arrResult) {
                if (err) callback(err);
                else callback(null, arrResult);
            });
        }
    ], function(err, arrayResult) {
        if (err) {
            showNotify(socketIo, 'danger', 'Ошибка: удаление не возможно');
            writeLogFile.writeLog('\tError: ' + err.toString());
            return;
        }

        if (arrayResult.some((item) => item)) return showNotify(socketIo, 'warning', `Удаление группы <strong>${obj.name}</strong> не возможно, так как в данной группе есть пользователи`);

        redis.del('user_group:' + obj.name, function(err) {
            if (err) {
                showNotify(socketIo, 'danger', `Ошибка: невозможно удалить группу <strong>${obj.name}</storng>`);
                writeLogFile.writeLog('\tError: ' + err.toString());
            } else {
                showNotify(socketIo, 'info', `Группа <strong>${obj.name}</strong> успешно удалена`);
            }
        });
    });
};

//возвращает объект с информацией по группе
function getObjectInformationGroup(groupInformation) {
    let patternTypeActionObj = {
        create: 'создание',
        read: 'просмотр',
        edit: 'редактирование',
        delete: 'удаление'
    };

    let patternSettingsObj = {
        management_dashboard: { name: 'Информационные панели', pattern: patternTypeActionObj },
        management_groups: { name: 'Группы', pattern: patternTypeActionObj },
        management_sources: { name: 'Источники', pattern: patternTypeActionObj },
        management_users: { name: 'Пользователи', pattern: patternTypeActionObj },
        management_tasks_filter: {
            name: 'Задачи фильтрации',
            pattern: {
                read: 'просмотр',
                import: 'загрузка трафика',
                delete: 'удаление'
            }
        },
        management_tasks_import: {
            name: 'Задачи по импорту файлов',
            pattern: {
                cancel: 'отмена',
                stop: 'остановка',
                resume: 'возобновление'
            }
        },
        management_uploaded_files: {
            name: 'Информация о загруженных файлах',
            pattern: {
                status_change: 'изменение статуса',
                delete: 'удаление'
            }
        },
        management_task: {
            name: 'Управление задачами',
            pattern: {
                read: 'просмотр',
                status_change: 'изменение статуса',
                delete: 'удаление',
                resumption: 'возобновление'
            }
        }
    };

    let patternMenuObj = {
        settings_task: 'управление задачами',
        settings_groups: 'группы пользователей',
        settings_users: 'пользователи',
        settings_sources: 'источники',
        settings_dashboard: 'центральная панель'
    };

    let objFinaly = {};
    // создание объекта с информацией по management_*
    for (let name in patternSettingsObj) {
        let newObj = { name: patternSettingsObj[name].name };

        newObj.data = {};
        for (let namePattern in patternSettingsObj[name].pattern) {
            let status = groupInformation[name][namePattern];
            let named = patternSettingsObj[name].pattern[namePattern];
            newObj.data[namePattern] = [status, named];
        }
        objFinaly[name] = JSON.stringify(newObj);
    }

    //добавление информации по меню
    let newObj = { name: 'Пункты меню настроек' };
    newObj.data = {};

    for (let name in patternMenuObj) {
        newObj.data[name] = [groupInformation.menu[name], patternMenuObj[name]];
    }
    objFinaly.menu = JSON.stringify(newObj);

    return objFinaly;
}