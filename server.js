/**
 * Server.js
 *
 * Entry point for our server
 */

require('dotenv').config();
const express = require('express');
const schedule = require('node-schedule');
const client = require('twilio')(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
const cors = require('cors');
const logger = require('morgan');
const bodyParsers = require('body-parser');
var MessagingResponse = require('twilio').twiml.MessagingResponse;

// db stuff
const db = require('./dbwrapper');

const router = express.Router();

const PORT = process.env.PORT || 5000;
const app = express();
var number;

app.use(logger('dev'));
app.use(cors());
app.use(bodyParsers.urlencoded({ extended: true }));
app.use(bodyParsers.json());

app.get('/', (req, res) => res.send("Hello!"));

app.get('/test', (req, res) => {


  res.send("Hello!");
});

app.listen(PORT, () => console.log(`Now listening on port ${PORT} :)`));
var reqData;
var wantSubscribe;



const txtMode = {
    default: 'default',
    new_user: 'new_user',
    day_rating: 'day_rating',
    rant: 'rant'
}


app.post('/message', (req, res) => {
    const tempBody = req.body;
    const reqData = tempBody.Body;
    const number = tempBody.From;
    console.log(`New text from ${number}`);
    
    
    //client.messages.create({body: 'Hi there', from: '+15732502162', to: '+17329564275'}).then(message => console.log(message.sid));

    // Coming from the database somehow idrk yet
    var mode = db.getData(number, 'state').mode;
    console.log(`Going into mode ${mode}`);


    // TODO: Make dictionary lookup
    switch (mode) {
        case txtMode.default:
            mode_default(reqData, res, number);
            break;

        case txtMode.new_user:
            mode_newuser(reqData, res, number);
            break;

        case txtMode.day_rating:
            mode_dayrate(reqData, res, number);
            break;

        case txtMode.rant:
            mode_rant(reqData, res, number);
            break;
    }
});


function mode_default(reqData, res, number) {
    // We switch into rant mode if the message says rant
    /*
    if new user -> ask for confirmation
    */
    var resp = new MessagingResponse();
    var state_data = db.getData(number, 'state');

    var user_is_new = state_data.new_user;
    var mode = state_data.mode;

    if (user_is_new) {
        state_data.mode = txtMode.new_user;
        mode_newuser(reqData, res, number);

    }else if(reqData.toLowerCase() == ("rant")) {
        state_data.mode = txtMode.rant;
        var rant_data = db.getData(number, "rant");
        rant_data = [[]].concat(rant_data);
        db.setData(number, "rant", rant_data);
        mode_rant(reqData, res, number)
    }

    db.setData(number, "state", state_data);
}


function mode_newuser(reqData, res, number) {


    var phase = db.getData(number, "state").phase; /* database lookup */
    var state_data;
    console.log(`In mode newuser with phase ${phase}`);

    switch (phase) {
        case 0:
            // Send confirmation of subscription text
            //resp.message("Do you want to subscribe?");
            client.messages
            .create({
                body: "Do you want to subscribe?",
                from: "+15732502162",
                to: number,
            })
            .then((message) => console.log(message.sid));
            console.log("Subscribe?")
            state_data = db.getData(number, "state"); /* database update */
            state_data.phase = 1;
            db.setData(number, "state", state_data);
            break;

        case 1:
            // Record text & respond based on if they want to join
            reqData = reqData.toLowerCase();
            console.log(reqData);
            if(reqData.charAt(0) == 'y'){
                client.messages
                .create({
                    body: "Thank you for signing up!",
                    from: "+15732502162",
                    to: number,
                })
                .then((message) => console.log(message.sid));
                
                client.messages
                .create({
                    body: "There are two ways to use this text journal. You can rant by typing RANT which allows you to continuously type. The second option is responding when you receieve a text",
                    from: "+15732502162",
                    to: number,
                })
                .then((message) => console.log(message.sid));
                state_data = db.getData(number, "state");
                state_data.phase = 0;
                state_data.mode = txtMode.default;
                state_data.new_user = false;
                db.setData(number, "state", state_data);
            }
            break;
    }
    
}


function mode_dayrate(reqData, res, number){
}


function mode_rant(reqData, res, number) {
    state_data = db.getData(number,"state");
    rant_data = db.getData(number, "rant");

    if(reqData.toLowerCase() == ('stoprant')){
        state_data.phase = 0;
        state_data.mode = txtMode.default;
    }else{
        rant_data[0].push(reqData);
    }

    db.setData(number, "rant", rant_data);
    db.setData(number, "state", state_data);
}

function mode_history(reqData, res, number) {
  rant_data = db.getData(number, "rant");
  state_data = db.getData(number,"state");
  if(reqData == "stop") {
    state_data.mode = txtMode.default;
  }
  var hist = "";
  for(var i = 0; i < 3 && state_data.pageNum < rant_data.rant.length; i++) {
    for(var message = 0; message < 3; message++) {
      hist += rant_data[i][message] + " ;";
      client.messages
          .create({
              body: hist,
              from: "+15732502162",
              to: number,
          })
          .then((message) => console.log(message.sid));
    }
    state_data.pageNum++;
  }
  hist = "";
  client.messages
            .create({
                body: hist,
                from: "+15732502162",
                to: number,
            })
            .then((message) => console.log(message.sid));
  client.messages
              .create({
                  body: "Would you like to view more past messages?",
                  from: "+15732502162",
                  to: number,
              })
}



//
// client.messages.create({
//     body: 'How has your day been?',
//     from: '+15732502162',
//     to: reqData.From
//   })
//  .then(message => console.log(message.sid));
// 
