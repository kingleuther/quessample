const app = require('express')();
const bodyParser = require('body-parser');
const fs = require('fs');
var util = require('util');
var http = require('http');
var querystring = require('querystring');
var request = require('request');
var server = require('http').createServer(app);
var port = process.env.NODE_PORT || 80;

server.listen(port);
console.log('listening to port', port);

// bodyParser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());


// 
app.get(`/`, (req, res) => {
    var uid =  req.query.uid;
    console.log('uid:' + uid);
    res.sendFile(__dirname + '/index.html');
});


// from LINE - webhook
app.post('/callback', (req, res) => {
    console.log('got post request.');
    console.log(req.body);
    console.log(req.body.events[0].replyToken);
    uid = req.body.events[0].source.userId;

//    console.log('userid from LINE:' + req.body.events[0].source.userId);
    console.log('event type from LINE:' + req.body.events[0].type);

    var event_type = req.body.events[0].type
    if ( event_type == 'follow') { // user add bot to friends
	//
    }  else if (event_type == 'unfollow'){     // user removed bot from friends
	//
    }  else if (event_type == 'message'){     // message from LINE
	f_text = req.body.events[0].message.text;
    }

   // var io = require('socket.io')();
    var io   = require('socket.io-client');
    var socket = io('http://localhost:80');
     socket.on('connected', function() {
	 socket.emit('init', { 'room': uid, 'name': 'tagoto' });
	 socket.emit('chat message', '[LINE]'+ f_text);
     });

    // Bluemix
    var c_url = 'https://gateway.watsonplatform.net/conversation/api/v1/workspaces/db31651d-1472-4685-b0e6-c6b60c97762b/message?version=2016-09-20'
    var c_user = '51b1d94f-026a-4d82-93de-98dd339aacdc';
    var c_pass = 'aUwwBVMaIkmF';
    var c_id = 'cbe98f28-87d6-45f5-8ff7-792295ae7b69';
    var c_workspace = 'db31651d-1472-4685-b0e6-c6b60c97762b';

    //var prompt = require('prompt-sync')();
    var ConversationV1 = require('watson-developer-cloud/conversation/v1');

    // Set up Conversation service wrapper.
    var conversation = new ConversationV1({
	username: c_user, 
	password: c_pass, 
	path: { workspace_id: c_workspace }, 
	version_date: '2016-07-11'
    });

    // Start conversation with empty message.
   conversation.message({
	input: { text: f_text },
	context: {
	    conversation_id: c_id,
	    system: {
		dialog_stack: [
		    {
			dialog_node: 'root'
		    }
		],
		dialog_turn_counter: 2,
		dialog_request_counter: 2
	    },
	    defaultCounter: 0
	}
    },function(err, response) {
	if (err) {
	    console.error(err); // something went wrong
	    return;
	}
  
	// Display the output from dialog, if any.
	if (response.output.text.length != 0) {

	    var msg1 = response.output.text[0];
	    var msg2 = response.output.text[1];

	    if (msg1) msg = msg1;
	    if (msg2) msg = msg2;
	    console.log('response from Bluemix:' + msg);
	    var io   = require('socket.io-client');
	    var socket = io('http://localhost:80');
	    socket.on('connected', function() {
		socket.emit('init', { 'room': uid, 'name': 'tagoto' });
		socket.emit('chat message', '[BOT]'+ msg);
	    });

	    url = 'http://localhost/push?msg=' + msg + '&uid=' + uid;
	    request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
		} else {
		    //		console.log('error: '+ response.statusCode);
		}
	    })
	    
	}
    });
    // ret to LINE
    res.send('OK');
});


// PC to LINE
app.get('/push', (req, res) => {

    var accessToken = 'BHf8wqLBzJ9C6iBetAv7xgWH4lzFvSk7HObFl8SRmFuZiMJ4i19IgZ9NIz8Pgffz3uvUae6KWbw7b0wMjCs5dd7praRSiiqmiNDIf1uGlXnaLOwaR6rgNfjAIM/IGs46NA12zpY91+5xUVbDPniBxQdB04t89/1O/w1cDnyilFU=';
//    console.log(accessToken);
    var s_text =  req.query.msg;
    var uid =  req.query.uid;
//    console.log("in push msg:" + req.query.msg);
//    console.log('uid in push:' + req.query.uid);
    var options ={
	url: 'https://api.line.me/v2/bot/message/push',
        port : 443,
        method : 'POST',
	headers: {
	    'Content-Type': 'application/json; charser=UTF-8',
	    'Authorization': 'Bearer '  + accessToken
	},
	json: true,
//	body: JSON.stringify(
	body: 
	    {
		'to':  uid,
		'messages': [{
		    'type': 'text',
		    'text': s_text
		}]
	    }
    }; 


    request.post(options, function(error, response, body){
//	console.log('++++++++' + util.inspect(error) + '++++++++++++');
//	console.log('++++++++' + util.inspect(response) + '++++++++++++');
//	console.log('++++++++' + util.inspect(body) + '++++++++++++');
//	var code = response.statusCode;
//	if (!error && ((body && body.errors) || code > 399)) {
	if (!error && response.statusCode == 200) {
//	    console.log(body.name);
//	    console.log('200 !!!!!!!!!!!!!!!');
	} else {
//	    console.log('error: '+ response.statusCode);
//	    console.log('error: '+ response.body);
//	    console.log('error: '+ body.errors);
	}
    });
});

// chat 
var io = require('socket.io')(server);
io.sockets.on('connection', (socket) => {
    console.log('in io.on');
    socket.emit('connected');
    socket.on('init', function(req) {
	console.log('in init');
	socket.room = req.room;
	socket.name = req.name;
	console.log('in init room:'+socket.room);
	console.log('in init name:'+socket.name);
        socket.to(req.room).emit('chat message', req.name + " さんが入室");
//	console.log('room のなまえ:' + req.room);
        socket.join(req.room);
  //      console.log('入室しました:' + req.name + ':' + req.room);
    });

    console.log('a user connected');
    socket.on('chat message', (msg) => {
	console.log('socket room: ' + socket.room);
	console.log('socket name: ' + socket.room);
	console.log('socket message: ' + msg);
        io.to(socket.room).emit('chat message', '####'+ msg);
	//io.emit('chat message', msg);
  });
});


/// EOF
