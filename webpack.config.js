'use strict';

const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

const NODE_ENV = process.env.NODE_ENV || 'development';

let bootstrapPath = path.join(__dirname, 'node_modules/bootstrap/dist/css');
let datetimepickerPath = path.join(__dirname, 'node_modules/eonasdan-bootstrap-datetimepicker/dist/css');

module.exports = {
    context: __dirname + '/public/js',
    /*место откуда берутся js файлы*/

    entry: { /*точки входа*/
        vendors: [
            'bootstrap',
            'bootstrapNotify',
            'bootstrapToggle',
            //'bootstrapDropDown',
            'bootstrapTokenfield',
            'bootstrapDatetimepicker',
            'chosen-js',
            //'chosen-js-proto',
            'md5js',
            'moment',
            'jquery',
            'socket.io-client',
            'socket.io-stream'
        ],
        authPage: './authPage.js',
        indexPage: './indexPage.js',
        jobLog: './jobLog.js',
        errorsLog: './errorsLog.js',
        uploadedFilesLog: './uploadedFilesLog',
        settingUsersPage: './settingUsersPage.js',
        settingGroupsPage: './settingGroupsPage.js',
        settingSourcesPage: './settingSourcesPage.js',
        settingDashboard: './settingDashboard.js',
        settingTask: './settingTask.js',
        common: './common.js',
        styles: './styles.js'
    },

    output: {
        path: path.resolve(__dirname, 'public/dist'),
        /*вывод обработанных webpack js файлов в указанную директорию*/
        publicPath: '/dist/',
        /*интернет путь до указанной директории*/
        filename: '[name].js',
        /*шаблоны файлов, применяется при сборке основных файлов*/
        chunkFilename: '[id].js',
        /*применяется при сборке файлов через require.ensure*/
        library: '[name]' /*экспорт каждой точки входа должен попадать в переменную с соответствующем именем*/
    },

    watch: NODE_ENV === 'development',

    devtool: NODE_ENV === 'development' ? 'source-map' : null,

    resolve: {
        modules: ['node_modules', bootstrapPath, datetimepickerPath],
        extensions: ['.js', '.css'],
        alias: {
            bootstrap: 'bootstrap/dist/js/bootstrap.min.js',
            bootstrapNotify: 'bootstrap-notify/bootstrap-notify.min.js',
            bootstrapToggle: 'bootstrap-toggle/js/bootstrap-toggle.min.js',
            //bootstrapDropDown: 'bootstrap/js/dropdown.js',
            bootstrapTokenfield: 'bootstrap-tokenfield/dist/bootstrap-tokenfield.min.js',
            bootstrapDatetimepicker: 'eonasdan-bootstrap-datetimepicker/build/js/bootstrap-datetimepicker.min.js',
            'chosen-js': 'chosen-js/chosen.jquery.min.js',
            //'chosen-js-proto': 'chosen-js/chosen.proto.min.js',
            md5js: 'crypto-js/md5.js',
            moment: 'moment/moment.js',
            'jquery': path.join(__dirname, 'node_modules/jquery/src/jquery'),
            //jquery: 'jquery/dist/jquery.min.js',
            'socket.io-client': 'socket.io-client/dist/socket.io.js',
            'socket.io-stream': 'socket.io-stream/socket.io-stream.js',
        }
    },

    resolveLoader: {
        modules: ['node_modules'],
        extensions: ['.js'],
        moduleExtensions: ['*-loader']
    },

    /*externals: {
        jquery: '$'
    },*/

    plugins: [
        new webpack.NoEmitOnErrorsPlugin(), /*не собирать если есть ошибки*/

        new webpack.DefinePlugin({ /*переменные окружения*/
            NODE_ENV: JSON.stringify(NODE_ENV)
        }),

        new webpack.optimize.CommonsChunkPlugin({ /*объединение повторяющихся скриптов в common.js*/
            name: 'common'
        }),

        new ExtractTextPlugin('css/[id]_[name].css', { allChunks: true }), /*выносит все стили в отдельные файлы*/

        new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /ru|en-gb/)

        /*new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.$': 'jquery',
            'window.jQuery': 'jquery'
        })*/
    ],

    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /\/node_modules\//,
            loader: 'babel-loader'
        }, {
            test: /\.css$/,
            //                loader: 'style-loader!css-loader'
            loader: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: 'css-loader'
            })
        }, {
            test: /bootstrap-tokenfield\/dist\/bootstrap-tokenfield\.min\.js/,
            loader: 'imports-loader?this=>window&exports=>false&define=>false'
        }, {
            test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)(\?.*)?$/,
            include: /\/node_modules\//,
            loader: 'file-loader?name=[1]&regExp=node_modules/(.*)&publicPath=dist/'
        }, {
            test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)(\?.*)?$/,
            exclude: /\/node_modules\//,
            loader: 'file-loader?name=[path][name].[ext]&publicPath=dist/'
        }, {
            test: /\.ejs$/,
            loader: 'ejs-loader'
        }]
    }
};