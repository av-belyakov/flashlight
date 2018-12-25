Flashlight, version 2.22

Модифицирован раздел загрузки файлов файлов. Теперь одновременно через канал могут скачиватся несколько файлов, а для того чтобы разделить их бинарные фрагменты используются специальные маркеры.

Настройка /etc/rc.local

/*
часть ОЗУ используемая для временного хранения файлов при загрузке через flashlight
должен совпадать с путем
"downloadDirectoryTmp": {
   "directoryName": "__TMP"
}, из файла config.json flashlight
*/
mount -t tmpfs -o size=6000M tmpfs /__TMP

/*
запуск СУБД Redis с настройками указанными в redis.conf
*/
/opt/redis-3.2.9/src/redis-server /opt/redis-3.2.9/redis.conf &

/*
запуск автоматом, аналог ./flashlight_management
*/
pm2 start /opt/flashlight/app.js -e /var/log/flashlight_errors.log --name flashlight_application



Настройка СУБД Redis

1. При запуске использовать redis.conf
команда ./redis-server /opt/redis-3.0.5/redis.conf

2. Хранить snapshot БД в файле /home/dbredis_snapshot/dump.rdb
для этого настроить в redis.conf
 - dbfilename <db_name> оставляем стандартное dump.rdb
 - dir пишем /home/dbredis_snapshot

3. Настройка redis.conf и конфигурационные файлы ОС Linux для устранения типичных
WARNING при запуске сервера Redis
 - в redis.conf изменить пункт tcp-backlog с 511 до 128
 - запустить команду sysctl vm.overcommit_memory=1 и добавить в файл /etc/sysctl.conf строку vm.overcommit.memory = 1
 - выполнить команду echo never > /sys/kernel/mm/transparent_hugepage/enabled и прописать ее в /etc/rc.local
 - использовать unix socket

4. Добавить в раздел requirepass пароль пользователя

5. Создать ramdisk командой mount -t tmpfs -o size=2000M tmpfs /__TMP



/*
Приведение БД в "нормальное" состояние, где 0711679b41082313b2c4aed8ef8a9550 id события фильтрации
*/
HMSET task_filtering_all_information:b18cdbf8a25c261cc93b95e139ee9608 uploadFiles 'not loaded' countFilesLoaded 0 countFilesLoadedError 0 dateTimeStartUploadFiles null userNameStartUploadFiles null uploadDirectoryFiles null dateTimeEndUploadFiles null dateTimeStopUploadFiles null userNameStopUploadFiles null

NODE_ENV='development' DEBUG=indexMiddleware,routeSocketIo.js,routeWebsocket.js,processingFilesUpload.js,websocketClient.js,processingFiltering node app.js
webpack --display-error-details