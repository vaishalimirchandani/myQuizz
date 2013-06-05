var HTTP = require('http');  // Librería HTTP
var URL  = require('url');   // Librería con parser de URLs
var FS   = require('fs');    // Librería de acceso a ficheros
var MIME = require('mime');


HTTP.createServer(function(request, response) {

    var MODEL = {
        find: function (question, action) { // Buscar pregunta en bbdd.txt
            FS.readFile('bbdd.txt', 'utf-8', function(err, bbdd) {
                action(err, bbdd.match(new RegExp('^'+question+': .*$','m')));
            });
        },
        findAll: function (action) { // Buscar pregunta en bbdd.txt
            FS.readFile('bbdd.txt', 'utf-8', function(err, bbdd) {
                action(err, bbdd.replace(/^(.*: .*$)/mg, '<li>$1</li>'));

            });
        },
        all_questions: function (action) {
            FS.readFile('bbdd.txt', 'utf-8', function(err, bbdd) {
                action(err, bbdd.replace(/^(.*): .*$/mg, '<option>$1</option>'));
            });
        }
    }


    var VIEW = {
        render: function (file, r1) {
            FS.readFile(file, 'utf-8', function(err, data) {
                if (!err) {
                    var data = data.replace(/<%r1%>/, r1);
                    response.writeHead(200, {
                        'Content-Type': 'text/html',
                        'Content-Length': data.length
                    });
                    response.end(data);
                } else {
                    console.log(err);
                    VIEW.error(500, "Server operation Error");
                }
            });
        },
        // envia error a cliente
        error: function(code,msg) { response.writeHead(code); response.end(msg);},

        file: function(file) {
            FS.readFile(file, function(err, data) {
                if (!err) {
                    response.writeHead(200, {
                        'Content-Type': MIME.lookup(file),
                        'Content-Length': data.length
                    });
                    response.end(data);
                } else {
                    console.log(err);
                    VIEW.error(500, "Server operation Error");
                }
            });
        }
    }


    var CONTROLLER = {
        index: function () {
            MODEL.all_questions (function(err, all_questions) {
                console.log(all_questions);
                if (!err) VIEW.render('index.html', all_questions);
                else      VIEW.error(500, "Server bbdd Error");
            });
        },

        show: function () { // Show se ejecuta en callback cuando find acaba
            MODEL.find(question, function(err, answer) {
                if (!err) VIEW.render('show.html',(answer||["Sin respuesta"])[0]);
                else      VIEW.error(500, "Server bbdd Error");
            });
        },

        showall: function () {
            MODEL.findAll(function(err, list) {
                console.log(list);
                if (!err) VIEW.render('showall.html', list);
                else      VIEW.error(500, "Server bbdd Error");
            });
        },

        file: function() { VIEW.file(url.pathname.slice(1)); }
    }


    var url      = URL.parse(request.url, true); // parsea el url enviado
    var route    = request.method + ' ' + url.pathname;  // crea ruta
    var question = url.query.preg; // Extrae pregunta de query, si existe

    switch (route) {            // Analiza ruta e invoica controlador
        case 'GET /quiz/index'   : CONTROLLER.index() ; break;
        case 'GET /quiz/show'    : CONTROLLER.show()  ; break;
        case 'GET /quiz/showall'    : CONTROLLER.showall()  ; break;
        default: {
            if (request.method == 'GET') CONTROLLER.file() ;
            else VIEW.error(400, "Unsupported request");
        }
    }
}).listen(3000);