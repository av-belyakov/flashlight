/*
 * Модуль маршрутизации для HTTP сервера
 *
 * Версия 0.2, дата релиза 05.02.2018
 * */

'use strict';

const process = require('process');
const passport = require('passport');

const pages = require('./pages');
const listSettingsGroup = require('../libs/users_management/listSettingsGroup');
const objResultFindErrors = require('../configure/objResultFindErrors');
const exportSetupHostFileXml = require('../libs/exportSetupHostFileXml');
const objResultFindTaskFilter = require('../configure/objResultFindTaskFilter');
const changeDefaultAdminPassword = require('../libs/users_management/changeDefaultAdminPassword');

module.exports = function(app, socketIo) {
    function isAuthenticated(req, res, next) {
        if (req.isAuthenticated()) next();
        else res.redirect('/auth');
    }

    app.post('/auth', passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/auth?username=error'
    }));

    app.get('/auth', function(req, res) {
        if (req.isAuthenticated()) pages.mainPage.call(null, req, res, socketIo);
        else pages.authenticate.call(null, req, res);
    });

    app.get('/', isAuthenticated, function(req, res) {
        pages.mainPage.call(null, req, res, socketIo);
    });

    app.post('/newPass', isAuthenticated, function(req, res) {
        changeDefaultAdminPassword.writeNewPasswordAdmin(req, res);
        pages.mainPage.call(null, req, res, socketIo);
    });

    app.get('/export_file_setup_hosts', isAuthenticated, function(req, res) {
        return exportSetupHostFileXml.exportFileSetupHost(res);
    });

    /* СТРАНИЦЫ НАСТРОЕК start */
    app.get('/settings_task', isAuthenticated, function(req, res) {
        return pages.managementTask.call(null, req, res, socketIo);
    });

    app.get('/settings_groups', isAuthenticated, function(req, res) {
        listSettingsGroup.checkReadSettings(req, 'management_groups', function(trigger) {
            if (trigger) pages.managementGroups.call(null, req, res, socketIo)
            else pages.mainPage.call(null, req, res, socketIo);
        });
    });

    app.get('/settings_users', isAuthenticated, function(req, res) {
        listSettingsGroup.checkReadSettings(req, 'management_users', function(trigger) {
            if (trigger) pages.managementUsers.call(null, req, res, socketIo)
            else pages.mainPage.call(null, req, res, socketIo);
        });
    });

    app.get('/settings_sources', isAuthenticated, function(req, res) {
        listSettingsGroup.checkReadSettings(req, 'management_sources', function(trigger) {
            if (trigger) pages.managementSources.call(null, req, res, socketIo)
            else pages.mainPage.call(null, req, res, socketIo);
        });
    });

    app.get('/settings_dashboard', isAuthenticated, function(req, res) {
        listSettingsGroup.checkReadSettings(req, 'management_dashboard', function(trigger) {
            if (trigger) pages.managementDashboard.call(null, req, res, socketIo)
            else pages.mainPage.call(null, req, res, socketIo);
        });
    });
    /* СТРАНИЦЫ НАСТРОЕК end */

    app.get('/job_log', isAuthenticated, function(req, res) {
        return pages.jobLog.call(null, req, res, socketIo);
    });

    app.get('/errors_log', isAuthenticated, function(req, res) {
        return pages.errorsLog.call(null, req, res, socketIo);
    });

    app.get('/uploaded_files_log', isAuthenticated, function(req, res) {
        return pages.uploadedFilesLog.call(null, req, res, socketIo);
    });

    app.get('/logout', function(req, res) {
        req.logOut();
        res.redirect('/auth');
        if (objResultFindTaskFilter[req.sessionID] !== undefined) {
            delete objResultFindTaskFilter[req.sessionID];
        }
        if (objResultFindErrors[req.sessionID] !== undefined) {
            delete objResultFindErrors[req.sessionID];
        }
    });

    app.get('*', function(req, res) {
        pages.authenticate.call(null, req, res);
    });

    if (process.env.NODE_ENV !== 'development') {
        app.use(function(err, req, res, next) {
            res.render('500', {});
        });
    }
};