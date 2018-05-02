/**
 ЗАДАЧА - научиться работать с потоками (streams)
 Написать HTTP-сервер для загрузки и получения файлов
 - Все файлы находятся в директории files
 - Структура файлов НЕ вложенная.

 - Виды запросов к серверу
 GET /file.ext
 - выдаёт файл file.ext из директории files,

 POST /file.ext
 - пишет всё тело запроса в файл files/file.ext и выдаёт ОК
 - если файл уже есть, то выдаёт ошибку 409
 - при превышении файлом размера 1MB выдаёт ошибку 413

 DELETE /file
 - удаляет файл
 - выводит 200 OK
 - если файла нет, то ошибка 404

 Вместо file может быть любое имя файла.
 Так как поддиректорий нет, то при наличии / или .. в пути сервер должен выдавать ошибку 400.

 - Сервер должен корректно обрабатывать ошибки "файл не найден" и другие (ошибка чтения файла)
 - index.html или curl для тестирования

 */

// Пример простого сервера в качестве основы

'use strict';

let url = require('url');
let fs = require('fs');

require('http').createServer(function (req, res) {

        let pathname = decodeURI(url.parse(req.url).pathname);

        switch (req.method) {
            case 'DELETE':

                fs.unlink(__dirname + '/files/' + pathname, (err) => {
                    if (err) {
                        if (err.code == 'ENOENT') {
                            res.statusCode = 404;
                            res.end("Файл не найден");
                        } else {
                            res.end("Server error");
                        }
                    } else {
                        res.statusCode = 200;
                        res.end('File deleted');
                    }
                 });

                return;

            case 'GET':
                if (pathname == '/')                 {

                    // отдачу файлов следует переделать "правильно", через потоки, с нормальной обработкой ошибок
                    fs.readFile(__dirname + '/public/index.html', (err, content) => {
                        if(err) {
                            console.error(err);
                        }
                        res.setHeader('Content-Type', 'text/html;charset=utf-8');
                        res.end(content);
                    });
                    return;
                } else {

                    sendFile(__dirname + '/files/' + pathname, res);
                    return;
                }

            case 'POST':

                let stream = new fs.createWriteStream(__dirname + '/files/file.txt', {flags: 'wx'});
                const maxSize = 1024*1024;
                let size = 0;

                stream
                    .on('error', (err) => {
                        if (err.code === 'EEXIST') {
                            res.statusCode = 409;
                            res.end("file.txt is already exist");
                        } else {
                            res.statusCode = 500;
                            res.end("Server error");
                        }
                    })
                    .on('close', () => {
                        res.statusCode = 200;
                        res.end("File copied to file.txt");
                    } )

                req
                    .on('data', (data) => {
                        size += data.length;
                        if (size > maxSize) {
                            res.statusCode = 423;
                            res.end('Too big file');

                            file.destroy();
                            fs.unlink(__dirname + 'files/file.txt', (err) => {
                                    if (err) {
                                       consoloe.log(err);
                                    }
                            });
                        }
                     })
                    .pipe(stream)

                return;
        }

        function sendFile(filePath, res, mimeType) {
            let stream = new fs.ReadStream(__dirname + '/files/' + pathname);

            stream
                .on('error', function (err) {
                    if (err.code == 'ENOENT') {
                        res.statusCode = 404;
                        res.end("Файл не найден");
                    } else {
                        res.end("Server error");
                    }
                })
                .pipe(res)

            res.on('close', () => {
                file.destroy();
            });
        }

}).listen(3000);

