/**
 * Server.js
 *
 * Entry point for our server
 */

// TODO: Create some kind of graph based system ?

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
    rant_history: 'rant-history',
    tic_tac_toe: 'tic-tac-toe',
}

const EXIT_STR = [
    "finish", "finished", "done"
]

const YES_STR = [
    "yes", "y", "ye", "yea", "yeah"
]

const NO_STR = [
    "no", "n", "na", "nah"
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


/**
 * Parses the string passed into an integer. If it is
 * out of the bounds or invalid, will return -1. -1
 * should as thus not be a valid option.
 * Min and max are inclusive acceptable values.
 */
function parse_number_input (str, min, max) {
    var number_choice = -1;

    try {
        number_choice = parseInt(str.trim());
    } catch (err) {
        return -1;
    }

    if (number_choice < min || number_choice > max) {
        return -1;
    } else {
        return number_choice;
    }
}






app.post('/message', (req, res) => {
    const tempBody = req.body;
    const reqData = tempBody.Body;
    const number = tempBody.From;
    
    var mode = db.getData(number, 'state').mode;
    var phase = db.getData(number, 'state').phase;

    console.log(`New text from ${number}. Mode ${mode}, phase ${phase}`);

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

        case txtMode.tic_tac_toe:
            mode_tictactoe(reqData, res, number);
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

    const TICTACTOE_WORDS = ["tic", "tac", "toe", "game", "play", "tictac", "tictoe", "tactoe"];

    if (user_is_new) {
        mode_newuser(reqData, res, number);
    } else if (reqData.toLowerCase() == "rant") {
        mode_rant(reqData, res, number);
    } else if (has_word_in_list(reqData, TICTACTOE_WORDS)) {
        mode_tictactoe(reqData, res, number);
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

    // This only ever gets executed once before changing mode,
    // hence the lack of a switch statement

    const index_choice = parse_number_input(1, rant_data.length);

    if (index_choice === -1) {
        texter.sendMsg(number, phrase.invalid_choice());
        return;
    }

    index_choice--;

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


function mode_tictactoe (reqData, res, number) {
    state_data = db.getData(number, "state");
    tictactoe_data = db.getData(number, "tictactoe");

    const phase = state_data.phase;

    switch(phase) {
        // Starting the game of tictactoe.
        // Ask the user whether they want to go first
        case 0:
            texter.sendMsg(number, phrase.tictactoe_moveorder());

            state_data.mode = txtMode.tic_tac_toe;
            state_data.phase += 1;
            break;
        
        // The user responded to whether they go first.
        // Now we setup the board, and then start playing.
        case 1:
            const userGoesFirst = is_in_list(reqData, YES_STR);
            const compGoesFirst = is_in_list(reqData, NO_STR);

            if (!userGoesFirst && !compGoesFirst) {
                texter.sendMsg(number, phrase.unable_to_understand());
                return;
            }

            tictactoe_data = {
                "user_move": userGoesFirst,
                "board": [
                    " ", " ", " ", 
                    " ", " ", " ",
                    " ", " ", " "
                ]
            };
            texter.sendMsg(number, phrase.tictactoe_beginning());
            state_data.phase += 1;

            if (userGoesFirst) {
                texter.sendMsg(number, phrase.tictactoe_userstart());
            } else {
                const computerMove = tictactoe_selectmove(tictactoe_data.board);
                tictactoe_data.board[computerMove] = "O";
                texter.sendMsg(numer, phrase.tictactoe_board(tictactoe_data.board));
                texter.sendMsg(number, phrase.tictactoe_usermove());
            }

            db.setData(number, "tictactoe", tictactoe_data);
            db.setData(number, "state", state_data);

            break;

        // Actual game logic
        // The user is always X, while the computer is O
        // Algorithm used is just randomness
        case 2:
            // Read user move
            const number_choice = parse_number_input(reqData, 1, 9) - 1;
            if (number_choice === -2 || tictactoe_data.board[number_choice] !== " ") {
                texter.sendMsg(number, phrase.invalid_choice());
                return;
            }
            tictactoe_data.board[number_choice] = "X";

            let gamestate = tictactoe_winstatus(tictactoe_data.board);

            if (gamestate === "") {
                const computerMove = tictactoe_selectmove(tictactoe_data.board);
                tictactoe_data.board[computerMove] = "O";
                gamestate = tictactoe_winstatus(tictactoe_data.board);
            }

            texter.sendMsg(number, phrase.tictactoe_board(tictactoe_data.board));

            switch (gamestate) {
                case "":
                    break;

                case "tie":
                    texter.sendMsg(number, phrase.tictactoe_tie());
                    break
                
                case "user":
                    texter.sendMsg(number, phrase.tictactoe_userwin());
                    break;

                case "computer":
                    texter.sendMsg(number, phrase.tictactoe_compwin());
                    break;
            }

            if (gamestate !== "") {
                state_data.mode = txtMode.default;
                state_data.phase = 0;
            }
            break;
    }

    db.setData(number, "state", state_data);
    db.setData(number, "tictactoe", tictactoe_data);
}


// Returns "", "tie", "user", "computer" depending
// on who won or if the game is still going
function tictactoe_winstatus (board) {
    let sums;
    let chars = ['X', 'O'];

    // Check for winners (ugly but it works lmao)
    const userWin = (
        // Horizontal
        (board[0] === 'X' && board[1] === 'X' && board[2] === 'X') ||
        (board[3] === 'X' && board[4] === 'X' && board[5] === 'X') ||
        (board[6] === 'X' && board[7] === 'X' && board[8] === 'X') ||

        // Vertical
        (board[0] === 'X' && board[3] === 'X' && board[6] === 'X') ||
        (board[1] === 'X' && board[4] === 'X' && board[7] === 'X') ||
        (board[2] === 'X' && board[5] === 'X' && board[8] === 'X') ||

        // Diagonal
        (board[0] === 'X' && board[4] === 'X' && board[8] === 'X') ||
        (board[6] === 'X' && board[4] === 'X' && board[2] === 'X')
    );

    const compWin = (
        // Horizontal
        (board[0] === 'O' && board[1] === 'O' && board[2] === 'O') ||
        (board[3] === 'O' && board[4] === 'O' && board[5] === 'O') ||
        (board[6] === 'O' && board[7] === 'O' && board[8] === 'O') ||

        // Vertical
        (board[0] === 'O' && board[3] === 'O' && board[6] === 'O') ||
        (board[1] === 'O' && board[4] === 'O' && board[7] === 'O') ||
        (board[2] === 'O' && board[5] === 'O' && board[8] === 'O') ||

        // Diagonal
        (board[0] === 'O' && board[4] === 'O' && board[8] === 'O') ||
        (board[6] === 'O' && board[4] === 'O' && board[2] === 'O')
    );

    if (userWin) {
        return "user";
    }
    if (compWin) {
        return "copmuter";
    }
    
    // Check for remaining legal moves
    for (let j=0; j<9; j++) {
        if (board[j] === " ")
            return "";
    }

    // No more moves = tie
    return "tie";
}


function tictactoe_getlegalmoves (board) {
    moves = [];

    board.forEach((elm, index) => {
        if (elm === " ")
            moves.push(index);
    });

    console.log(`Found legal moves for ${board}: ${moves}`);

    return moves;
}


function tictactoe_selectmove (board) {
    const possible_moves = tictactoe_getlegalmoves(board);
    const random_ind = Math.floor(Math.random() * possible_moves.length);
    return possible_moves[random_ind];
}



