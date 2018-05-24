/*
 * Создание псевдо индексов содержащих информацию о параметрах фильтрации
 *
 * Версия 0.1, дата релиза 05.10.2016
 * */

'use strict';

const async = require('async');

const createTableIndexFilterSettingsSrcIp = require('./createTableIndexFilterSettingsSrcIp');
const createTableFilteringSettingsNetworks = require('./createTableFilteringSettingsNetworks');
const createTableIndexFilterSettingsDateTime = require('./createTableIndexFilterSettingsDateTime');

module.exports = function(redis, taskIndex, feedback) {
    redis.hget('task_filtering_all_information:' + taskIndex, 'filterSettings', function(err, filterSettings) {
        if (err) return feedback(err);

        function CreateTableIndexSettings(objFilterSettings, taskIndex, redis) {
            this.objFilterSettings = objFilterSettings;
            this.taskIndex = taskIndex;
            this.redis = redis;
        }

        CreateTableIndexSettings.prototype.createTableIndexFilterSettingsDateTime = createTableIndexFilterSettingsDateTime;
        CreateTableIndexSettings.prototype.createTableIndexFilterSettingsSrcIp = createTableIndexFilterSettingsSrcIp;
        CreateTableIndexSettings.prototype.createTableFilteringSettingsNetworks = createTableFilteringSettingsNetworks;

        try {
            let objFilterSettings = JSON.parse(filterSettings);
            let createTableIndexSettings = new CreateTableIndexSettings(objFilterSettings, taskIndex, redis);

            async.parallel([
                function(callback) {
                    createTableIndexSettings.createTableIndexFilterSettingsDateTime(function(err) {
                        if (err) callback(err);
                        else callback();
                    });
                },
                function(callback) {
                    createTableIndexSettings.createTableIndexFilterSettingsSrcIp(function(err) {
                        if (err) callback(err);
                        else callback();
                    });
                },
                function(callback) {
                    createTableIndexSettings.createTableFilteringSettingsNetworks(function(err) {
                        if (err) callback(err);
                        else callback();
                    });
                }
            ], function(err) {
                if (err) feedback(err);
                else feedback();
            });
        } catch (e) {
            feedback(e);
        }
    });
};