/**
 * DB Wrapper.js
 *
 * This file provides functions for interacting with the database
 */

const fs = require("fs");
const path = require("path");

const DBWrapper = {
  // Returns T / F if a user exists
  userExists: (user_number) => {
    return (
      fs.readdirSync(path.join(__dirname, "db")).filter((foldname) => {
        return foldname == user_number;
      }).length > 0
    );
  },

  // Creates a new user. If the user already exists,
  // the incident is logged but no folder is overwritten
  userAdd: (user_number) => {
    if (DBWrapper.userExists(user_number)) {
      console.warn(
        `Attempted to create user ${user_number}, who already exists`
      );
      return;
    }

    try {
      fs.mkdirSync(path.join(__dirname, "db", String(user_number)));
    } catch (err) {
      console.error(`Error creating new user, ${err}`);
    }
  },

  // Gets the array of ratings
  dayRatingGetAll: (user_number) => {
    if (!DBWrapper.userExists(user_number)) {
      console.error(
        `Attempted adding day rating to non-existent user ${user_number}`
      );
      return;
    }

    // Second test clause for the actual file
    const filesinfolder = fs.readdirSync(
      path.join(__dirname, "db", String(user_number))
    );

    const filepath = path.join(
      __dirname,
      "db",
      String(user_number),
      "dayratings.json"
    );
    return JSON.parse(fs.readFileSync(filepath, "utf-8"));
  },

  dayRatingAdd: (user_number, date, time, rating) => {
    if (!DBWrapper.userExists(user_number)) {
      console.error(
        `Attempted adding day rating to non-existent user ${user_number}`
      );
      return;
    }

    let allRatings = DBWrapper.dayRatingGetAll(user_number);
    allRatings.push({
      date: date,
      time: time,
      rating: rating,
    });

    const filepath = path.join(
      __dirname,
      "db",
      String(user_number),
      "dayratings.json"
    );
    fs.writeFileSync(filepath, JSON.stringify(allRatings));
  },
};

module.exports = DBWrapper;
