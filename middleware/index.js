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

    /* TEST CREATE LISTS FILES FOR FILTERING */
    /*const debug = require('debug')('indexMiddleware');
    const processingListFilesForFiltering = require('../libs/list_file_management/processingListFilesForFiltering');
    const async = require('async');

    //запись содержимого объекта а БД
    /*processingListFilesForFiltering.createList(testObject, redis, (err) => {
        if (err) debug(err);
    });*/


    /*async.series([
        (callback) => {
            processingListFilesForFiltering.createList(testObject, redis)
                .then(() => {
                    debug('created list files...');
                    callback();
                })
                .catch((err) => {
                    debug('------------');
                    debug(err);
                    callback(err);
                });
        },
        (callback) => {
            //чтение из БД
            processingListFilesForFiltering.getList(testObject.sourceId, testObject.taskIndex, redis, (err, list) => {
                if (err) return callback(err);
                debug('getList');
                for (let dir in list) {
                    debug(`directry name: ${dir} count files= ${list[dir].length}`);
                }

                callback();
            });
        },
        (callback) => {
            processingListFilesForFiltering.modifyList({
                sourceId: 1234,
                taskIndex: 'dwd828882b8b8bfff20j02f938f3',
                directoryName: '/__CURRENT_DISK_2',
                fileName: '19_04_2016___14_38_19_297451.tdp',
            }, redis).then((file) => {

                debug(`delete file: ${file}`);

                callback();
            }).catch(err => {
                callback(err);
            });
        },
        (callback) => {
            processingListFilesForFiltering.getList(testObject.sourceId, testObject.taskIndex, redis)
                .then((list) => {
                    for (let dir in list) {
                        debug(`directry name: ${dir} count files= ${list[dir].length}`);
                    }

                    callback();
                })
                .catch((err) => {
                    callback(err);
                });
        }
    ], (err) => {
        if (err) debug(err);
    });*/

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

/*let testObject = {
    'sourceId': 1234,
    'taskIndex': 'dwd828882b8b8bfff20j02f938f3',
    'objFilesList': {
        '/__CURRENT_DISK_1': [
            '1436805198_2015_07_13____19_33_18_4301.tdp',
            '1438534038_2015_08_02____19_47_18_8.tdp',
            '19_04_2016___19_08_31_246937.tdp',
            '1436805269_2015_07_13____19_34_29_65644.tdp',
            '1438534136_2015_08_02____19_48_56_888055.tdp',
            '19_04_2016___19_50_32_111438.tdp',
            '1436805442_2015_07_13____19_37_22_1495.tdp',
            '1438534282_2015_08_02____19_51_22_559.tdp',
            '19_04_2016___21_09_37_212054.tdp',
            '1436805451_2015_07_13____19_37_31_932657.tdp',
            '1438534312_2015_08_02____19_51_52_500252.tdp',
            '26_04_2016___00_01_32.tdp',
            '1436805625_2015_07_13____19_40_25_2241.tdp',
            '1438534465_2015_08_02____19_54_25_1078.tdp',
            '26_04_2016___00_05_07.tdp',
            '1436805636_2015_07_13____19_40_36_994722.tdp',
            '1438534496_2015_08_02____19_54_56_902849.tdp',
            '26_04_2016___00_08_58.tdp',
            '1436805817_2015_07_13____19_43_37_198977.tdp',
            '1438534678_2015_08_02____19_57_58_898116.tdp',
            '26_04_2016___00_13_50.tdp',
            '1436805869_2015_07_13____19_44_29_3677.tdp',
            '1438534709_2015_08_02____19_58_29_725.tdp',
            '26_04_2016___00_17_10.tdp',
            '1436805999_2015_07_13____19_46_39_796469.tdp',
            '1438534861_2015_08_02____20_01_01_397403.tdp',
            '1436806113_2015_07_13____19_48_33_298.tdp',
            '1438527602_2015_08_02____18_00_02_30735.tdp',
            '19_04_2016___12_51_52_610425.tdp',
            '1436802035_2015_07_13____18_40_35_657042.tdp',
            '1436806185_2015_07_13____19_49_45_855238.tdp',
            '1438535044_2015_08_02____20_04_04_395458.tdp',
            '1436806296_2015_07_13____19_51_36_75.tdp',
            '1438535136_2015_08_02____20_05_36_2797.tdp',
            '26_04_2016___00_33_53.tdp',
            'dddmdiimidwiimdi.cd',
            'odoemoocoocococc.dsdwd',
            'dowoddododoodd'
        ],
        '/__CURRENT_DISK_2': [
            '1436801669_2015_07_13____18_34_29_561099.tdp',
            '1438527053_2015_08_02____17_50_53_252866.tdp',
            '19_04_2016___12_19_02_961978.tdp',
            '1436801782_2015_07_13____18_36_22_97.tdp',
            '1438527236_2015_08_02____17_53_56_586199.tdp',
            '1438534465_2015_08_02____19_54_25_1078.tdp',
            '26_04_2016___00_05_07.tdp',
            '1436805636_2015_07_13____19_40_36_994722.tdp',
            '19_04_2016___12_28_53_278912.tdp',
            '1436801851_2015_07_13____18_37_31_588766.tdp',
            '1438527419_2015_08_02____17_56_59_157592.tdp',
            '19_04_2016___12_38_48_263519.tdp',
            '1436801965_2015_07_13____18_39_25_328.tdp',
            '1438527602_2015_08_02____18_00_02_30735.tdp',
            '19_04_2016___12_51_52_610425.tdp',
            '1436802035_2015_07_13____18_40_35_657042.tdp',
            '1438527786_2015_08_02____18_03_06_301085.tdp',
            '19_04_2016___13_07_07_272801.tdp',
            '1436802209_2015_07_13____18_43_29_65.tdp',
            '1438527974_2015_08_02____18_06_14_89631.tdp',
            '19_04_2016___13_18_52_570849.tdp',
            '1436802221_2015_07_13____18_43_41_27726.tdp',
            '1438528121_2015_08_02____18_08_41_35.tdp',
            '19_04_2016___13_31_44_307474.tdp',
            '1436802400_2015_07_13____18_46_40_25894.tdp',
            '1438528152_2015_08_02____18_09_12_955443.tdp',
            '19_04_2016___13_44_24_752929.tdp',
            '1436802453_2015_07_13____18_47_33_2284.tdp',
            '1438528304_2015_08_02____18_11_44_371.tdp',
            '19_04_2016___13_59_58_430969.tdp',
            '1436802587_2015_07_13____18_49_47_455895.tdp',
            '1438528336_2015_08_02____18_12_16_637316.tdp',
            '19_04_2016___14_09_28_139731.tdp',
            '1436802636_2015_07_13____18_50_36_1337.tdp',
            '1438528517_2015_08_02____18_15_17_95442.tdp',
            '19_04_2016___14_33_28_750682.tdp',
            '1436802768_2015_07_13____18_52_48_704832.tdp',
            '1438528670_2015_08_02____18_17_50_4040.tdp',
            '19_04_2016___14_38_19_297451.tdp',
            '1436802880_2015_07_13____18_54_40_1039.tdp',
            '1438528706_2015_08_02____18_18_26_652553.tdp',
            '19_04_2016___14_44_28_361096.tdp',
            '1436802950_2015_07_13____18_55_50_93838.tdp',
            '1438528886_2015_08_02____18_21_26_659944.tdp',
            '19_04_2016___14_51_29_136573.tdp'
        ],
        '/__CURRENT_DISK_3': [
            '1436802644_2015_07_13____18_50_44_999435.tdp',
            '1438528396_2015_08_02____18_13_16_639775.tdp',
            '19_04_2016___14_12_52_880396.tdp',
            '1436802697_2015_07_13____18_51_37_1851.tdp',
            '1438528548_2015_08_02____18_15_48_708.tdp',
            '19_04_2016___14_34_56_833836.tdp',
            '1436802827_2015_07_13____18_53_47_271619.tdp',
            '1438528580_2015_08_02____18_16_20_506915.tdp',
            '19_04_2016___14_39_58_838522.tdp',
            '1436802941_2015_07_13____18_55_41_75.tdp',
            '1438528766_2015_08_02____18_19_26_654998.tdp',
            '19_04_2016___14_46_06_468164.tdp',
            '1436803010_2015_07_13____18_56_50_38569.tdp',
            '1438528792_2015_08_02____18_19_52_185.tdp',
            '19_04_2016___14_57_55_963735.tdp',
            '1436803185_2015_07_13____18_59_45_8.tdp',
            '1438528946_2015_08_02____18_22_26_662411.tdp',
            '19_04_2016___15_14_49_670465.tdp',
            '1436803199_2015_07_13____18_59_59_410905.tdp',
            '1438528975_2015_08_02____18_22_55_1738.tdp',
            '19_04_2016___15_46_25_734752.tdp'
        ]
    }
};*/