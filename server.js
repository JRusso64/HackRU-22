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
const bodyParsers = require('body-parser');
var MessagingResponse = require('twilio').twiml.MessagingResponse;

// db stuff
const dbWrapper = require('./dbwrapper');

const router = express.Router();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(bodyParsers.urlencoded({ extended: true }));
app.use(bodyParsers.json());

app.get('/', (req, res) => res.send("Hello!"));

app.get('/test', (req, res) => {
  console.log(dbWrapper.dayRatingAdd(7322586902, '2021', 'asd', 5));

  res.send("Hello!");
});

app.listen(PORT, () => console.log(`Now listening on port ${PORT} :)`));

//needs to store number in db
app.post('/message', function (req, res) {
    var resp = new MessagingResponse();
    resp.message('Thanks for subscribing!');
    res.writeHead(200, {
      'Content-Type':'text/xml'
    });
    var test = req.body;

    console.log(test.From);
    console.log(test.Body);

    client.messages.create({

     body: 'How has your day been?',
     from: '+15732502162',
     to: process.env.TEST_NUMBER
   })
  .then(message => console.log(message.sid));
   
  res.end(resp.toString());
});


