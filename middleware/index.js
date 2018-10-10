/*
 * Настройка сервера express
 *
 * Версия 0.1, дата релиза 15.12.2015
 * */

'use strict';

module.exports = function(app, express, io) {
    const ss = require('socket.io-stream');
    const ejs = require('ejs-locals');
    const path = require('path');
    const favicon = require('serve-favicon');
    const session = require('express-session');
    const passport = require('passport');
    const bodyParser = require('body-parser');
    const errorHandler = require('errorhandler');
    const cookieParser = require('cookie-parser');
    const LocalStrategy = require('passport-local').Strategy;

    const routers = require('../routes');
    const controllers = require('../controllers');
    const cleanRedisDB = require('../libs/cleanRedisDB');
    const routeSocketIo = require('../routes/routeSocketIo');
    const websocketClient = require('./websocketClient');
    const AuthenticateStrategy = require('./authenticateStrategy');

    const redis = controllers.connectRedis();

    /* 
     * вспомогательный модуль для внесения изменений в БД выполняемых с целью 
     * обеспечения совместимости со старыми версиями приложения
     * */
    require('../libs/requiredUpdateDatabaseItems')(redis);

    //проверяем наличие учетных данных администратора
    require('../libs/isCredentialsAdministrator').addAdminCredentials(redis);

    /*
     * Page rendering
     * */
    app.engine('html', ejs);
    app.engine('ejs', ejs);
    app.set('views', path.join(__dirname, '../views'));
    app.set('view engine', 'ejs');
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    /*!!!!! ДЛЯ РАЗРАБОТКИ ВЫКЛЮЧЕН !!!!!*/
    /*!!!! В ПРОДАКШЕНЕ ДОЛЖЕН БЫТЬ ВКЛЮЧЕН ИЛИ ЗАКОМЕНТЕН !!!!!*/
    if (require('process').env.NODE_ENV === 'development') app.disable('view cache');

    /*
     * Favicon
     * */
    app.use(favicon(path.join(__dirname, '../public/images/favicon.ico')));

    /*
     * Session
     * */
    app.use(session({
        secret: 'flashlight_application',
        resave: false,
        saveUninitialized: false,
        maxAge: 259200000
    }));

    /*
     * Passportjs initialization
     * */
    app.use(passport.initialize());
    app.use(passport.session());

    /*
     * Socket.io
     * */
    let socketIo = io.sockets.on('connection', function(socket) {
        routeSocketIo.eventHandling(socket);

        /* upload file */
        routeSocketIo.uploadFile(socket, ss);
    });

    /*
     * Websocket connection
     * */
    websocketClient(socketIo);

    /*
     * Public directory
     * */
    app.use(express.static(path.join(__dirname, '../public')));
    app.use('/public', express.static(path.join(__dirname, '../public')));

    /*
     * Routing
     * */
    routers(app, socketIo);

    /*
     * Setup passport
     * */
    passport.use(new LocalStrategy({
        usernameField: 'login',
        passwordField: 'password'
    }, AuthenticateStrategy.authenticate));
    passport.serializeUser(AuthenticateStrategy.serializeUser);
    passport.deserializeUser(AuthenticateStrategy.deserializeUser);

    /*
     * Response error
     * */
    app.use(errorHandler());

    /* удаляем таблицу содержащую идентификаторы выполняемых задач */
    //cleanRedisDB.cleanTableTaskFilteringIndexProcessingExecuted(redis);

    /* удаляем таблицы содержащие списки задач на загрузку файлов */
    cleanRedisDB.cleanTableTaskUploadFiles(redis);
};