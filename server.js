/**
 * Server.js
 *
 * Entry point for our server
 */

require('dotenv').config();
const express = require('express');
const schedule = require('node-schedule');
const cors = require('cors');
const logger = require('morgan');
const bodyParsers = require('body-parser');
var MessagingResponse = require('twilio').twiml.MessagingResponse;

const phrase = require('./strings');
const texter = require('./texter');
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
    console.log(db.getAllUsers());
});

app.listen(PORT, () => console.log(`Now listening on port ${PORT} :)`));
var reqData;
var wantSubscribe;



const txtMode = {
    default: 'default',
    new_user: 'new_user',
    day_rating: 'day_rating',
    unsubscribed: 'unsubscribed',
    rant: 'rant',
    rant_history: 'rant-history'
}

const EXIT_STR = [
    "finish", "finished", "done"
]

const YES_STR = [
    "yes", "y", "ye", "yea", "yeah"
]

function is_in_list (word, list) {
    return list.some(wrd => wrd === word.trim().toLowerCase());
}

/**
 * Returns whether the message contains a word in the list.
 * Ex:
 * message: "The brown fox jumped"
 * list: ["brown", "black", "green"]
 * 
 * returns true
 */
function has_word_in_list (message, list) {
    return list.some(
        word => message.trim().toLowerCase().includes(
            word.trim().toLowerCase()
    ));
}





app.post('/message', (req, res) => {
    const tempBody = req.body;
    const reqData = tempBody.Body;
    const number = tempBody.From;
    console.log(`New text from ${number}`);
    
    var mode = db.getData(number, 'state').mode;

    switch (mode) {
        case txtMode.default:
            switch_to_mode(reqData, res, number);
            break;

        case txtMode.unsubscribed:
            mode_unsubbed(reqData, res, number);
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
        
        case txtMode.rant_history:
            mode_rant_history(reqData, res, number);
            break;
    }
});


function switch_to_mode(reqData, res, number) {
    /*
    if new user -> ask for confirmation
    */
    var resp = new MessagingResponse();
    var state_data = db.getData(number, 'state');

    var user_is_new = state_data.new_user;
    var mode = state_data.mode;

    if (user_is_new) {
        mode_newuser(reqData, res, number);
    } else if (reqData.toLowerCase() == "rant") {
        mode_rant(reqData, res, number)
    }
}


function mode_newuser(reqData, res, number) {
    var state_data = db.getData(number, "state");
    var phase = state_data.phase; /* database lookup */
    console.log(`[${String(number).substring(0,4)}] In mode newuser with phase ${phase}`);

    switch (phase) {
        case 0:
            texter.sendMsg(number, phrase.new_subscribe());

            state_data.phase = 1;
            state_data.mode = txtMode.new_user;
            break;

        case 1:
            // Record text & respond based on if they want to join
            reqData = reqData.trim().toLowerCase();

            if (reqData.charAt(0) == 'y') {
                texter.sendMsg(number, phrase.new_thanks());
                texter.sendMsg(number, phrase.new_explanation());
                
                state_data.new_user = false;
                state_data.phase = 0;
                state_data.mode = txtMode.default;
            } else {
                texter.sendMsg(number, phrase.new_notsubbed());

                state_data.subscribed = false;
                state_data.phase = 0;
                state_data.mode = txtMode.unsubscribed;
            }

            break;
    }

    db.setData(number, "state", state_data);
}


function mode_unsubbed(reqData, res, number) {
    state_data = db.getData(number, "state");

    const phase = state_data.phase;

    switch (phase) {
        // This means they responded after being 'unsubbed'
        // we prompt them to ask if they do want to opt in
        case 0:
            texter.sendMsg(number, phrase.unsub_return());
            state_data.phase = 1;
            state_data.mode = txtMode.new_user;
            break;
    }

    db.setData(number, "state", state_data);
}


// TODO
function mode_dayrate(reqData, res, number){
}


function mode_rant(reqData, res, number) {
    state_data = db.getData(number,"state");
    rant_data = db.getData(number, "rant");

    const phase = state_data.phase;

    switch (phase) {
        case 0:
            texter.sendMsg(number, phrase.rant_choose());
            state_data.phase += 1;
            state_data.mode = txtMode.rant;
            break;

        case 1:
            START_WORDS = ['start', 'new', 'create', 'make'];
            VIEW_WORDS = ['history', 'view', 'older', 'look'];

            if (has_word_in_list(reqData, VIEW_WORDS)) {
                // Transition to rant history
                const rant_names = [];
                rant_data.forEach(elm => rant_names.push(elm.name));

                texter.sendMsg(number, phrase.rant_going_to_history(rant_names));

                state_data.mode = txtMode.rant_history;
                state_data.phase = 0;

            } else if (has_word_in_list(reqData, START_WORDS)) {
                texter.sendMsg(number, phrase.rant_startup());
                state_data.phase += 1;

            } else {
                texter.sendMsg(number, phrase.unable_to_understand());
            }
            break;

        case 2:
            const rantName = reqData.trim();
            const emptyRant = {
                "name": rantName,
                "messages": []
            };
            rant_data = [emptyRant].concat(rant_data);

            texter.sendMsg(number, phrase.rant_ready(rantName));
            
            state_data.phase += 1;
            break;

        case 3:
            if (is_in_list(reqData, EXIT_STR)){
                const rant_name = rant_data[0].name;
                texter.sendMsg(number, phrase.rant_finished(rant_name));

                state_data.phase = 0;
                state_data.mode = txtMode.default;
            } else {
                const msg_list = rant_data[0].messages;
                rant_data[0].messages = msg_list.concat([reqData.trim()]);
            }
            break;
    }

    db.setData(number, "rant", rant_data);
    db.setData(number, "state", state_data);
}


function mode_rant_history (reqData, res, number) {
    state_data = db.getData(number, "state");
    rant_data = db.getData(number, "rant");

    var number_choice = -1;

    try {
        number_choice = parseInt(reqData.trim());
    } catch (err) {
        texter.sendMsg(number, phrase.unable_to_understand)
        return;
    }

    const index_choice = number_choice - 1;

    if (index_choice < 0 || index_choice >= rant_data.length) {
        texter.sendMsg(number, phrase.invalid_choice())
        return;
    }

    console.log("Checking if rant is printable");

    if (!rant_data[index_choice] ||
        !rant_data[index_choice].messages || 
        rant_data[index_choice].messages.length == 0) {
            console.log("Found empty rant");
            texter.sendMsg(number, phrase.rant_history_empty());

    } else {
        console.log("Rant has content");
        const rant_name = rant_data[index_choice].name;
        const rant_msgs = rant_data[index_choice].messages;

        texter.sendMsg(number, phrase.rant_history_sending(rant_name));
        rant_msgs.forEach(msg => texter.sendMsg(number, msg));
    }

    state_data.mode = txtMode.default;
    state_data.phase = 0;
    db.setData(number, "state", state_data);
}


