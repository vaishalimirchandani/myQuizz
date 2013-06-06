var HTTP = require('http');  // Librería HTTP
var URL  = require('url');   // Librería con parser de URLs
var QS   = require('querystring');
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
        },
        create: function (question, action) {
            FS.appendFile('bbdd.txt', question+'\n', 'utf-8', function(err){
                action(err);
            });
        },
        delete: function (question, action) {
            FS.readFile('bbdd.txt','utf-8', function(err, bbdd) {
                if (!err) {
                    bbdd = bbdd.replace(new RegExp(question + ':.*\n', 'g'), '');
                    FS.writeFile('bbdd.txt', bbdd, 'utf-8', function (err) {
                        action(err);
                    });
                } else { action(err); };
            });
        },
        changeAnswer:function (question, action) {
            FS.readFile('bbdd.txt','utf-8', function(err, bbdd) {
                if (!err) {
                    bbdd = bbdd.replace(new RegExp(question[0] + '\n', 'g'), question[1]+'\n');
                    FS.writeFile('bbdd.txt', bbdd, 'utf-8', function (err) {
                        action(err);
                    });
                } else { action(err); };
            });
        }
    }


    var VIEW = {
        render: function (file, r1) {
            FS.readFile(file, 'utf-8', function(err, data) {
                if (!err) {
                    var data = data.replace(/<%r1%>/g, r1);
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
                if (!err) VIEW.render('showall.html', list);
                else      VIEW.error(500, "Server bbdd Error");
            });
        },

        file: function() {
            VIEW.file(url.pathname.slice(1));
        },

        new: function () {
            VIEW.render ('new.html', "");
        },

        create: function () {
            MODEL.create(question, function(err) {
                if (!err) CONTROLLER.index();  // redirección a 'GET quiz/index'
                else      VIEW.error(500, "Server bbdd Error_c");
            });
        },
        remove: function() {
            MODEL.all_questions (function(err, all_questions) {
                if (!err) VIEW.render('remove.html', all_questions);
                else      VIEW.error(500, "Server bbdd Error_d");
            });
        },

        delete: function () {
            MODEL.delete (question, function(err) {
                if (!err) CONTROLLER.index();  // redirección a 'GET quiz/index'
                else      VIEW.error(500, "Server bbdd Error_e");
            });
        },

        edit: function (){
            MODEL.find(question, function(err, answer) {
                if (!err) VIEW.render('edit.html',(answer||["Sin respuesta"])[0]);
                else      VIEW.error(500, "Server bbdd Error");
            });
        },

        update: function (){
            MODEL.changeAnswer(question, function(err) {
                if (!err) CONTROLLER.index();
                else      VIEW.error(500, "Server bbdd Error_e");
            });
        }
    }



    var url       = URL.parse(request.url, true);
    var post_data = "";
    request.on('data', function (chunk) { post_data += chunk; });
    request.on('end', function() {

        post_data = QS.parse(post_data);

        // "question" variable global -> visible en controlador
        question  = (post_data.preg || url.query.preg);
        var route = (post_data._method || request.method) + ' ' + url.pathname;

        switch (route) {
            case 'GET /quiz/index'     : CONTROLLER.index()   ; break;
            case 'GET /quiz/show'      : CONTROLLER.show()    ; break;
            case 'GET /quiz/showall'   : CONTROLLER.showall() ; break;
            case 'GET /quiz/new'       : CONTROLLER.new()     ; break;
            case 'POST /quiz/create'   : CONTROLLER.create()  ; break;
            case 'GET /quiz/remove'    : CONTROLLER.remove()  ; break;
            case 'DELETE /quiz/delete' : CONTROLLER.delete()  ; break;
            case 'GET /quiz/edit'      : CONTROLLER.edit()    ; break;
            case 'PUT /quiz/update'    : CONTROLLER.update()  ; break;
            default: {
                if (request.method == 'GET') CONTROLLER.file() ;
                else VIEW.error(400, "Unsupported request");
            }
        }
    });
}).listen(3000);
