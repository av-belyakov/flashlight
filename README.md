Flashlight, version 2.221

Модифицирован раздел загрузки файлов.
Теперь одновременно через канал могут скачиваться несколько файлов, а для того чтобы разделить их бинарные фрагменты используются специальные маркеры.
Кроме того загружаемые файлы сразу пишутся на диск в директорию для долговременного хранения. Создавать и использовать временный TMP диск в ОЗУ более не требуется.


/*** установка и настройка ***/
Настройка /etc/rc.local

/*
запуск СУБД Redis с настройками указанными в redis.conf
*/
/opt/redis-<версия СУБД>/src/redis-server /opt/redis-<версия СУБД>/redis.conf &

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