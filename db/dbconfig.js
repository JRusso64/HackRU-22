require('dotenv').config();

let config = {
	dbUrl: `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9yt0m.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,

	dbOptions: {
		keepAlive: 1,
		connectTimeoutMS: 30000,
		useNewUrlParser: true
	}
};

module.exports = config;
