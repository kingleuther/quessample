const app = require('express')();
const bodyParser = require('body-parser');
const fs = require('fs');
//const line = require('@line/bot-sdk');
var util = require('util');
var http = require('http');
var querystring = require('querystring');
var request = require('request');
var server = require('http').createServer(app);
var port = process.env.NODE_PORT || 8888;

// LINE access token
var accessToken = 'QaW5CRkaohzwlmB52rsa9ApJqi0od2TKwzk1VnpcyHtTa3Blausfw9nIxJmNKxyw5BGIG/Afpls/VDAo0PgQD1enH5Jpr1lOQudUjovxb1uYp0/wY4X1lEDoEOJJ0XhrArVQ4/I3Sb+i/9gGXVaDJwdB04t89/1O/w1cDnyilFU=';

// replace this object with monogoDB
var managers =  {"tagoto@tmj.jp":"U649944b1e99dde7d1e4d32cffa16cfcf","gototakuya@icloud.com":"xxxxxxxxxxxxxxxxxxxxxxxxx"};

server.listen(port);
console.log('listening to port', port);

// bodyParser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

// 
app.get(`/`, (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.get(`/ques`, (req, res) => {
    //    var _s =  req.query.uid;

    var _email =  req.query.email;
    var _title = req.query.title;
    var _on = req.query.on;
    var _manager_email = req.query.manager_email;
    var _user_name = req.query.user_name;
    var _manager_name = req.query.manager_name;
    var _process_id = req.query.process_id;
    var _overtime_date = req.query.overtime_date;
    var _overtime_time = req.query.overtime_time;
    var _overtime_reason = req.query.overtime_reason;
    var _submit_time = req.query.submit_time;


    for(key in managers){
	if (_email == key ) {
	    var _line_uid = managers[key];
	    console.log(key + "さんのIDは、" + _line_uid + "です。") ;
	}
    }


    console.log('================================================');
    console.log('email:' + _email);
    console.log('title:' + _title);
    console.log('organization name:' + _on);
    console.log('manager email:' + _manager_email);
    console.log('_user_name	 :' + _user_name	     );
    console.log('_manager_name   :' + _manager_name   );
    console.log('_process_id     :' + _process_id     );
    console.log('_overtime_date  :' + _overtime_date  );
    console.log('_overtime_time  :' + _overtime_time  );
    console.log('_overtime_reason:' + _overtime_reason);
    console.log('_submit_time    :' + _submit_time    );


    var _text =  '承認依頼が届いています\n' + _user_name + 'さん\n' + '時刻:' + _overtime_time + '\n' + '理由:' + _overtime_reason + '\n';

    var options = {
	url: 'https://api.line.me/v2/bot/message/push',
        port : 443,
        method : 'POST',
	headers: {
	    'Content-Type': 'application/json; charser=UTF-8',
	    'Authorization': 'Bearer '  + accessToken
	},
	json: true,
	body: 
	{
	    'to':  _line_uid,
	    'messages': [{
		'type': 'template',
		'altText': '承認してください',
		'template':{
		    'type':'confirm',
		    'text':_text,
		    'actions':[
			{
			    "type": "postback",
			    "label": "承認",
			    "text": '承認します\n' + _user_name + 'さん\n' 	+ '時刻:' + _overtime_time + '\n' + '理由:' + _overtime_reason + '\n',
			    "data": "pid=" + _process_id + '&perm=yes',
			},
			{
			    "type": "postback",
			    "label": "差戻",
			    "text": '差し戻しします\n' + _user_name + 'さん\n' 	+ '時刻:' + _overtime_time + '\n' + '理由:' + _overtime_reason + '\n',
			    "data": "pid=" + _process_id + '&perm=no',
			}
		    ]
		}
	    }]
	}

    }; 

    request.post(options, function(error, response, body){
	if (!error && response.statusCode == 200) {
	    console.log('200 !!!!!!!!!!!!!!!');
	} else {
	    console.log('error from LINE');

	}
    });



    //---------------------------------------------------------------
    res.send('okay2');
});


// from LINE - webhook
app.post('/callback', (req, res) => {
    console.log('req body:' + req.body);
    uid = req.body.events[0].source.userId;
    console.log('event type from LINE:' + req.body.events[0].type);
    var event_type = req.body.events[0].type

    if ( event_type == 'follow') { // user add bot to friends
	var options = {
	    url: 'https://api.line.me/v2/bot/message/push',
            port : 443,
            method : 'POST',
	    headers: {
		'Content-Type': 'application/json; charser=UTF-8',
		'Authorization': 'Bearer '  + accessToken
	    },
	    json: true,
	    body: 
	    {
		'to':  uid,
		'messages': [{
		    'type': 'text',
		    'text':'あなたのLINE IDは\n' + uid + 'です',
		}]
	    }

	}; 
	request.post(options, function(error, response, body){
	    if (!error && response.statusCode == 200) {
		console.log('200 !!!!!!!!!!!!!!!');
	    } else {
		console.log('error from LINE');

	    }
	});

	console.log('LINE uid:' + uid);
    }  else if (event_type == 'unfollow'){     // user removed bot from friends
	//
    }  else if (event_type == 'message'){     // message from LINE
	_text = req.body.events[0].message.text;
    }  else if (event_type == 'postback'){     // message from LINE
	_text = req.body.events[0].postback.data;
	console.log('postback ha:' + _text);
	var _p = querystring.parse(_text);
	_pid = _p.pid;
	_perm = _p.perm
	console.log('pid:', _pid);
	console.log('perm:', _perm);
	
	var options = {
	    url: 'https://karasuma-ichijo-790.questetra.net/System/Event/IntermediateMessage/8/24/receive?key=NKOmgMAo36gnNvVnQwyKNojRwKh4gte0&processInstanceId=' + _pid + '&data[9].input=' + _perm,
            port : 443,
            method : 'GET',
	    headers: {
		'Content-Type': 'application/xml; charser=UTF-8',
	    },
	}; 
	request.get(options, function(error, response, body){
	    if (!error && response.statusCode == 200) {
		console.log('200 !!!!!!!!!!!!!!!');
		// send text to LINE user
	    } else {
		console.log('error from Ques');
		console.log('error: '+ response.body);
	    }
	});

    }

    // ret to LINE
    res.send('OK');
});


/// EOF
