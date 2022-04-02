/**
 * Server.js
 *
 * Entry point for our server
 */

const express = require('express');
const cors = require('cors');
const logger = require('morgan');
const mongoose = require('mongoose');
const bodyParsers = require('body-parser');
require('dotenv').config();

const router = express.Router();

const PORT = process.env.PORT || 5000;
const app = express();

app.use(logger('dev'));
app.use(cors());
app.use(bodyParsers.urlencoded({ extended: true }));
app.use(bodyParsers.json());

app.get('/', (req, res) => res.send("Hello!"));

app.listen(PORT, () => console.log(`Now listening on port ${PORT} :)`));
