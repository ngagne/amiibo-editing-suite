
var config = require('./config'),
    cluster = require('cluster'),
    numCPUs = require('os').cpus().length,
    fs = require('fs'),
    xml;

var startCluster = function() {
    if (cluster.isMaster) {
        // fork workers
        for (var i = 0; i < numCPUs; i++) {
            cluster.fork();
        }

        cluster.on('exit', function(worker, code, signal) {
            console.log('worker ' + worker.process.pid + ' died');
        });
    } else {
        startServer();
    }
};

var startServer = function() {
    var url = require('url'),
        http = require('http'),
        jade = require('jade'),
        stream = require('stream'),
        async = require('async'),
        compression = require('compression'),
        express = require('express'),
        app = express(),
        bodyParser = require('body-parser'),
        multer = require('multer'),
        request = require('request'),
        binstring = require('binstring'),
        exec = require('exec');

    // use http/https as necessary
    http.globalAgent.maxSockets = 50;

    var upload = multer({
        dest: 'uploads/'
    });

    app.use(compression()); // compress with qzip

    app.use(bodyParser.urlencoded({extended: false}));

    app.get('/', function (req, res) {
        res.render('index.jade', {xml: xml});
    });

    app.post('/', upload.single('bin'), function (req, res, next) {
        if (!req.file) {
            res.end('Error: no binary file was selected');
            return;
        }
        if (req.file.size != 540) {
            res.end('Error: binary file must be exactly 540 bytes in size');
            return;
        }


        var game = req.body.game || 0,
            bonus_effect_1 = req.body.bonus_effect_1 || '',
            bonus_effect_2 = req.body.bonus_effect_2 || '',
            bonus_effect_3 = req.body.bonus_effect_3 || '',
            stat_attack_on = !!req.body.stat_attack_on,
            stat_attack = req.body.stat_attack || '',
            stat_defense_on = !!req.body.stat_defense_on,
            stat_defense = req.body.stat_defense || '',
            stat_speed_on = !!req.body.stat_speed_on,
            stat_speed = req.body.stat_speed || '',
            random_items = !!req.body.random_items,
            level = req.body.level || '',
            appearance = req.body.appearance || '',
            standard = req.body.standard || '',
            side = req.body.side || '',
            up = req.body.up || '',
            down = req.body.down || '',
            base = req.body.base || '',
            token = req.body.token || '',
            shovel_level = req.body.shovel_level || '',
            shovel_level_up = !!req.body.shovel_level_up,
            tennis_games_played_on = !!req.body.tennis_games_played_on,
            tennis_games_played = req.body.tennis_games_played || '',
            chibi_level = req.body.chibi_level || '';

        // send file to decrypt service
        var formData = {
            operation: 'decrypt',
            dump: fs.createReadStream(req.file.path)
        };
        request.post({url: config.api, formData: formData, encoding: null}, function (err, remoteRes, body) {
            if (err) {
                res.end('Error: there was a problem connecting to the API');
                return;
            }

            var amiiboData = body, parts, i, l;

            // modify amiibo data
            if (game == 0) {
                // Super Smash Bros

                if (bonus_effect_1 != '') {
                    amiiboData[233] = filterNumber(parseInt(bonus_effect_1, 16));
                }
                if (bonus_effect_2 != '') {
                    amiiboData[234] = filterNumber(parseInt(bonus_effect_2, 16));
                }
                if (bonus_effect_3 != '') {
                    amiiboData[235] = filterNumber(parseInt(bonus_effect_3, 16));
                }
                if (stat_attack_on) {
                    stat_attack = filterNumber(stat_attack, 200, -200);

                    amiiboData[236] = 0;
                    if (stat_attack < 0) {
                        amiiboData[236] = 255;
                        stat_attack = 256 + stat_attack;
                    }
                    amiiboData[237] = stat_attack;
                }
                if (stat_defense_on) {
                    stat_defense = filterNumber(stat_defense, 200, -200);

                    amiiboData[238] = 0;
                    if (stat_defense < 0) {
                        amiiboData[238] = 255;
                        stat_defense = 256 + stat_defense;
                    }
                    amiiboData[239] = stat_defense;
                }
                if (stat_speed_on) {
                    stat_speed = filterNumber(stat_speed, 200, -200);

                    amiiboData[240] = 0;
                    if (stat_speed < 0) {
                        amiiboData[240] = 255;
                        stat_speed = 256 + stat_speed;
                    }
                    amiiboData[241] = stat_speed;
                }
                if (random_items) {
                    amiiboData[372] = Math.round(Math.random() * 256);
                    amiiboData[373] = Math.round(Math.random() * 256);
                    amiiboData[374] = Math.round(Math.random() * 256);
                    amiiboData[375] = Math.round(Math.random() * 256);
                }
                if (level !== '' && level.length == 4) {
                    amiiboData[344] = filterNumber(parseInt(level.slice(0, 2), 16));
                    amiiboData[345] = filterNumber(parseInt(level.slice(2), 16));
                }
                if (appearance !== '') {
                    amiiboData[228] = filterNumber(appearance, 8);
                }
                if (standard !== '') {
                    amiiboData[229] = filterNumber(standard, 3);
                }
                if (side !== '') {
                    amiiboData[230] = filterNumber(side, 3);
                }
                if (up !== '') {
                    amiiboData[231] = filterNumber(up, 3);
                }
                if (down !== '') {
                    amiiboData[232] = filterNumber(down, 3);
                }

                // amiibo skills training? 380-394
                // 411-419 are populated after fighting for the first time

            } else if (game == 1) {
                // Mario Party 10

                if (base !== '') {
                    parts = base.split(' ');
                    for (i = 0, l = parts.length; i < l; i++) {
                        // check for out of range values
                        if (parts[i] != 1 && parts[i] != 5) {
                            continue;
                        }
                        amiiboData[9 + i] = parseInt(parts[i], 16);
                    }
                }
                if (token !== '') {
                    parts = base.split(' ');
                    for (i = 0, l = parts.length; i < l; i++) {
                        // check for out of range values
                        if (parts[i] != 1 && parts[i] != 5) {
                            continue;
                        }
                        amiiboData[222 + i] = parseInt(parts[i], 16);
                    }
                }
            } else if (game == 2) {
                // Animal Crossing HHD
                var hhdSlot = req.body.hhd_slot;
                var hhdItem = parseInt(req.body.hhd_item);
                if (req.body.hhd_item != '') {
                    amiiboData[236 + (hhdSlot * 2)] = hhdItem % 256;
                    amiiboData[237 + (hhdSlot * 2)] = Math.floor(hhdItem / 256);
                }
            } else if (game == 3) {
                // Mario Tennis Ultra Smash
                if (tennis_games_played_on) {
                    amiiboData[220] = Math.floor(tennis_games_played);
                    amiiboData[221] = tennis_games_played % 256;
                }

                for (i = 0; i < 10; i++) {
                    if (req.body['tennis_slot_' + i] != '') {
                        amiiboData[222 + i] = req.body['tennis_slot_' + i];
                    }
                }

            } else if (game == 4) {
                // Chibi-Robo! Zip Lash
                var chibiPoints = [0, 0, 5, 7, 18, 20, 30];
                amiiboData[225] = chibiPoints[filterNumber(chibi_level, 6)];
                amiiboData[226] = 0;
                amiiboData[227] = 0;

            } else if (game == 5) {
                // Animal Crossing: Amiibo Festival

            } else if (game == 7) {
                // Shovel Knight
                if (shovel_level_up) {
                    amiiboData[305] = 256; // @TODO: verify
                }
                if (shovel_level) {
                    amiiboData[300] = filterNumber(shovel_level, 50); // @TODO: verify
                }
            }

            fs.writeFile("modified/" + req.file.filename, amiiboData, function(err) {
                if(err) {
                    res.end('Error: there was a problem saving the binary file. Please try again later.');
                    return;
                }

                // send file to encrypt service
                var formData = {
                    operation: 'encrypt',
                    dump: fs.createReadStream("modified/" + req.file.filename)
                };
                request.post({url: config.api, formData: formData, encoding: null}, function (err, remoteRes, body) {
                    if (err) {
                        res.end('Error: there was a problem connecting to the API');
                        return;
                    }

                    // send data to client
                    res.setHeader('Content-Length', body.byteLength);
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.setHeader('Content-Disposition', 'attachment; filename=' + req.file.originalname);
                    res.write(body, 'binary');
                    res.end();

                    console.log('Encryption successful!');
                }).pipe(fs.createWriteStream("encrypted/" + req.file.filename));

                console.log("The file was saved!");
            });

            console.log('Decryption successful!');
        }).pipe(fs.createWriteStream("decrypted/" + req.file.filename));
    });

    app.get('/hex', function (req, res) {
        res.render('hex.jade');
    });

    app.post('/hex', upload.single('bin'), function (req, res, next) {
        if (!req.file) {
            res.end('Error: no binary file was selected');
            return;
        }
        if (req.file.size != 540) {
            res.end('Error: binary file must be exactly 540 bytes in size');
            return;
        }

        // send file to decrypt service
        var formData = {
            operation: 'decrypt',
            dump: fs.createReadStream(req.file.path)
        };
        request.post({url: config.api, formData: formData, encoding: null}, function (err, remoteRes, body) {
            if (err) {
                res.end('Error: there was a problem connecting to the API');
                return;
            }

            var amiiboData = body;
            var data = String(binstring(amiiboData, {out: 'hex'})).toUpperCase().match(/.{1,2}/g);

            // @TODO: identyify Amiibo character at offset 476 (decrypt): Isabelle AF: 01810100023f0502

            // identify amiibo character
            var characterID = '0x' + dec2Hex(amiiboData[476]) + dec2Hex(amiiboData[477]) + dec2Hex(amiiboData[478]) + dec2Hex(amiiboData[479]) + dec2Hex(amiiboData[480]) + dec2Hex(amiiboData[481]) + dec2Hex(amiiboData[482]) + dec2Hex(amiiboData[483]);
            var characterName = '?';
            if (xml.characters.hasOwnProperty(characterID)) {
                characterName = xml.characters[characterID];
            }
            console.log('characterName: '+characterName)
            res.render('hex-edit.jade', {offsets: data, characterName: characterName});

            console.log('Decryption successful!');
        }).pipe(fs.createWriteStream("decrypted/" + req.file.filename));
    });

    app.post('/hex-edit', upload.single('bin'), function (req, res, next) {
        var type = req.body.type,
            data = req.body.data,
            filename = new Date().getTime() + '.bin';


        if (type == 'encrypt') {
            var wstream = fs.createWriteStream("modified/" + filename);
            data.map(function(item){
                wstream.write(String(binstring(item, {in:'hex', out: 'binary'})), 'binary');
            });
            wstream.on('finish', function(err) {
                if(err) {
                    res.end('Error: there was a problem saving the binary file. Please try again later.');
                    return;
                }

                // send file to encrypt service
                var formData = {
                    operation: 'encrypt',
                    dump: fs.createReadStream("modified/" + filename)
                };
                request.post({url: config.api, formData: formData, encoding: null}, function (err, remoteRes, body) {
                    if (err) {
                        res.end('Error: there was a problem connecting to the API');
                        return;
                    }

                    // send data to client
                    res.setHeader('Content-Length', body.byteLength);
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.setHeader('Content-Disposition', 'attachment; filename=encrypted_' + filename);
                    res.write(body, 'binary');
                    res.end();

                    console.log('Encryption successful!');
                }).pipe(fs.createWriteStream("encrypted/" + filename));

                console.log("The file was saved!");
            });
            wstream.end();

        } else {
            var amiiboData = [];
            data.map(function(item){
                amiiboData.push(String(binstring(item, {in:'hex', out: 'binary'})));
            });

            // send data to client
            res.setHeader('Content-Length', 540);
            res.setHeader('Content-Type', 'application/octet-stream');
            res.setHeader('Content-Disposition', 'attachment; filename=decrypted_' + filename);
            res.write(amiiboData.join(''), 'binary');
            res.end();

        }
    });

    app.get('/test', function(req,res) {
        res.end('end');
    });

    app.get('/uid', function (req, res) {
        res.render('uid.jade', {xml: xml});
    });

    app.post('/uid', upload.single('bin'), function (req, res, next) {
        if (!req.file) {
            res.end('Error: no binary file was selected');
            return;
        }
        if (req.file.size != 540) {
            res.end('Error: binary file must be exactly 540 bytes in size');
            return;
        }

        if (req.body.uid.length != 14) {
            res.end('Error: UI must be exactly 14 hex characters in length (7 bytes)');
            return;
        }

        // send file to decrypt service
        var formData = {
            operation: 'decrypt',
            dump: fs.createReadStream(req.file.path)
        };
        request.post({url: config.api, formData: formData, encoding: null}, function (err, remoteRes, body) {
            if (err) {
                res.end('Error: there was a problem connecting to the API');
                return;
            }

            var amiiboData = body, parts, i, l;

            // calculate new uid
            var uid = req.body.uid.match(/.{1,2}/g).map(function(n){
                    return parseInt(n, 16);
                }),
                bcc0 = 0x88 ^ parseInt(uid[0], 16) ^ uid[1] ^ uid[2],
                bcc1 = uid[3] ^ uid[4] ^ uid[5] ^ uid[6];

            // modify amiibo data
            amiiboData[468] = uid[0];
            amiiboData[469] = uid[1];
            amiiboData[470] = uid[2];
            amiiboData[471] = bcc0;
            amiiboData[472] = uid[3];
            amiiboData[473] = uid[4];
            amiiboData[474] = uid[5];
            amiiboData[475] = uid[6];
            amiiboData[476] = bcc1;

            fs.writeFile("modified/" + req.file.filename, amiiboData, function(err) {
                if(err) {
                    res.end('Error: there was a problem saving the binary file. Please try again later.');
                    return;
                }

                // send file to encrypt service
                var formData = {
                    operation: 'encrypt',
                    dump: fs.createReadStream("modified/" + req.file.filename)
                };
                request.post({url: config.api, formData: formData, encoding: null}, function (err, remoteRes, body) {
                    if (err) {
                        res.end('Error: there was a problem connecting to the API');
                        return;
                    }

                    // send data to client
                    res.setHeader('Content-Length', body.byteLength);
                    res.setHeader('Content-Type', 'application/octet-stream');
                    res.setHeader('Content-Disposition', 'attachment; filename=' + req.file.originalname);
                    res.write(body, 'binary');
                    res.end();

                    console.log('UID: Encryption successful!');
                }).pipe(fs.createWriteStream("encrypted/" + req.file.filename));

                console.log("UID: The file was saved!");
            });

            console.log('UID: Decryption successful!');
        }).pipe(fs.createWriteStream("decrypted/" + req.file.filename));
    });

    app.listen(config.web.port, function(){
        console.log('Amiibo Server listening on port:' + config.web.port);
    });
};

var init = function() {
    // parse codes xml
    var parseString = require('xml2js').parseString;
    fs.readFile(__dirname + '/xml/codelist.xml', function(err, data) {
        parseString(data, function (err, result) {
            xml = parseXML(result);

            startCluster();
        });
    });
};

var dec2Hex = function(int) {
    var hex = parseInt(int).toString(16);
    if (hex.length < 2) {
        hex = '0' + hex;
    }

    return hex;
};

var filterNumber = function(number, max, min) {
    max = max || 255;
    min = min || 0;
    return Math.min(max, Math.max(min, parseInt(number)));
};

var parseXML = function(xml) {
    var output = {
        games:[],
        lists:{},
        folders:[],
        characters:{}
    };

    var i,j;

    for (i in xml.CheatList.Games[0].Game) {
        if (!xml.CheatList.Games[0].Game.hasOwnProperty(i)) {
            continue;
        }

        var item = xml.CheatList.Games[0].Game[i];
        output.games.push({
            name: item.Name,
            id: item.idx
        })
    }

    for (i in xml.CheatList.Cheats[0].Folder) {
        if (!xml.CheatList.Cheats[0].Folder.hasOwnProperty(i)) {
            continue;
        }

        var folderNode = xml.CheatList.Cheats[0].Folder[i];
        var folder = {
            name: folderNode.Name[0],
            games: folderNode.Games[0].split(','),
            type: folderNode.Type[0],
            id: folderNode.idx[0],
            cheats: []
        };

        for (j in folderNode.Cheat) {
            if (!folderNode.Cheat.hasOwnProperty(j)) {
                continue;
            }

            var cheatNode = folderNode.Cheat[j];

            folder.cheats.push({
                name: cheatNode.Name[0],
                addr: cheatNode.Codes[0].Code[0].Addr[0],
                data: cheatNode.Codes[0].Code[0].Data[0]
            });
        }

        output.folders.push(folder);
    }

    for (i in xml.CheatList.Lists[0].List) {
        if (!xml.CheatList.Lists[0].List.hasOwnProperty(i)) {
            continue;
        }

        var listNode = xml.CheatList.Lists[0].List[i];

        var cheats = [];

        for (j in listNode.Entries[0].Cheat) {
            if (!listNode.Entries[0].Cheat.hasOwnProperty(j)) {
                continue;
            }

            var listCheatNode = listNode.Entries[0].Cheat[j];

            cheats.push({
                name: listCheatNode.Name[0],
                data: listCheatNode.Data[0]
            });
        }

        output.lists[listNode.idx] = cheats;
    }

    for (i in xml.CheatList.Characters[0].Toy) {
        if (!xml.CheatList.Characters[0].Toy.hasOwnProperty(i)) {
            continue;
        }

        var toy = xml.CheatList.Characters[0].Toy[i];
        output.characters[toy.idx] = toy.Name[0];
    }

    return output;
};

init();
