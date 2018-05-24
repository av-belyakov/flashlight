/*
 * Импортирование и экспортирование данных об удаленных хостах (moth)
 *
 * при экспортировании создает специально сформированный xml файл
 *
 * Версия 0.1, дата релиза 20.02.2016
 * */

'use strict';

const fs = require('fs');
const path = require('path');
const async = require('async');
const xml2js = require('xml2js');

const controllers = require('../controllers');
const writeLogFile = require('./writeLogFile');

const redis = controllers.connectRedis();

module.exports.exportFileSetupHost = function(res) {
    async.waterfall([
        function(callback) {
            redis.lrange('remote_hosts_exist:id', [0, -1], function(err, array) {
                if (err) callback(err);
                else callback(null, array);
            });
        },
        function(arrayId, callback) {
            let obj = { 'setup_hosts': { 'host': [] } };
            let num = 0;

            if (arrayId.length === 0) callback(null, obj);

            arrayId.forEach(function(item) {
                redis.hmget('remote_host:settings:' + item,
                    'shortName',
                    'detailedDescription',
                    'ipaddress',
                    'port',
                    'dateCreate',
                    'dateChanges',
                    'dateLastConnected',
                    'numberConnectionAttempts',
                    'token',
                    'maxCountProcessFiltering',
                    'intervalTransmissionInformation',
                    function(err, arrData) {
                        if (err) return callback(err);

                        let objRemoteHost = {
                            'id': [item],
                            'short_name': [arrData[0]],
                            'detailed_description': [arrData[1]],
                            'ip_address': [arrData[2]],
                            'port': [arrData[3]],
                            'date_create': [arrData[4]],
                            'date_changes': [arrData[5]],
                            'date_last_connected': [arrData[6]],
                            'number_connection_attempts': [arrData[7]],
                            'token': [arrData[8]],
                            'max_count_process_filtering': [arrData[9]]
                        };
                        obj.setup_hosts.host.push(objRemoteHost);

                        if ((arrayId.length - 1) === num) callback(null, obj);
                        num++;
                    });
            });
        },
        function(objRemoteHosts, callback) {
            let dirRoot = __dirname.substr(0, (__dirname.length - 5));
            let file = dirRoot + '/uploads/exportSetupHostsTmp_' + +new Date() + '.xml';

            let builder = new xml2js.Builder();
            let xml = builder.buildObject(objRemoteHosts);

            fs.appendFile(file, xml, { 'encoding': 'utf8' }, function(err) {
                if (err) callback(err);
                else callback(null, file);
            });
        }
    ], function(err, file) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        if (typeof file === 'undefined') return writeLogFile.writeLog('\tError: error when creating the file specified is not a valid path');

        fs.access(file, fs.constants.R_OK, function(err) {
            if (err) return writeLogFile.writeLog('\tError: ' + err.toString());

            let fileName = path.basename(file);

            res.setHeader('Content-disposition', 'attachment; filename=' + fileName);
            res.setHeader('Content-Type', 'text/xml');

            let fileStream = fs.createReadStream(file);
            fileStream.pipe(res);

            fileStream.on('end', function() {
                fs.unlink(file, function(err) {
                    if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                });
            });
        });
    });
};