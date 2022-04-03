const mongoose = require('mongoose');
let Schema = mongoose.Schema;

let dayRatingSchema = new Schema (
	{
		type: {
			type: String
		},
		check_ins: [{ 
			time: String,
			rating: Number
		}]
	},
	{ timestamps=true }
);

let dayRating = mongoose.model("day_rating", dayRatingSchema);

module.exports = dayRating;
