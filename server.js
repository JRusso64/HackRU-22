/**
 * Server.js
 *
 * Entry point for our server
 */
//test comment
require('dotenv').config();
const express = require('express');
const client = require('twilio')(process.env.ACCOUNTSID, process.env.AUTHTOKEN);
const cors = require('cors');
const logger = require('morgan');
const mongoose = require('mongoose');
const bodyParsers = require('body-parser');
var MessagingResponse = require('twilio').twiml.MessagingResponse;

// ok


// mongoose
const dbConfig = require('./db/dbconfig');
mongoose.connect(dbConfig.dbUrl, dbConfig.dbOptions, (err) => {
    if (err) { console.error(err); }
    else { console.log('Connected to mongodb succesfully :)'); }
});

const router = express.Router();

const PORT = process.env.PORT || 5000;
const app = express();
var number;

app.use(logger('dev'));
app.use(cors());
app.use(bodyParsers.urlencoded({ extended: true }));
app.use(bodyParsers.json());

app.get('/', (req, res) => res.send("Hello!"));

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
    console.log(number);
    
    
    //client.messages.create({body: 'Hi there', from: '+15732502162', to: '+17329564275'}).then(message => console.log(message.sid));

    // Coming from the database somehow idrk yet
    const mode = txtMode.default;


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
    var mode = "new_user"; /* database lookup */

    var user_is_new = true; /* database lookup */

    if (user_is_new) {
        mode = "new_user"; // TODO: Updated in the database
        mode_newuser(reqData, res, number);

    } else {
        mode = "rant";
        mode_rant(reqData, res, number)
    }
}


function mode_newuser(reqData, res, number) {
    var phase = 0; /* database lookup */
    
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
            phase = 1; /* database update */
            break;

        case 1:
            // Record text & respond based on if they want to join
            reqData.uppercase();
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
                
            }
            break;
    }
    
}


function mode_dayrate(reqData, res, number) { 
    var resp = new MessagingResponse();
}


function mode_rant(reqData, res, number) { 
    var resp = new MessagingResponse();
}



//
// client.messages.create({
//     body: 'How has your day been?',
//     from: '+15732502162',
//     to: reqData.From
//   })
//  .then(message => console.log(message.sid));
// 
