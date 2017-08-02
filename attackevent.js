const events = require("events");
const geoip = require('geoip-lite');
const pollInterval = 1500;
const mongoClient = require('mongodb').MongoClient;
const mongoUrl = "mongodb://localhost:27017/mnemosyne";
// All our data was recorded on this date, we repeat it each day
const referenceDate = new Date("2017-07-25");

function AttackEvent() {
	this.started = false;
	this.numAttacks = 0;
	this.timeSinceLastPing = 0;
	var that = this; // allow scope to inner callback function
	mongoClient.connect(mongoUrl, (err, db) => {
		if (err) throw err;
		this.db = db;
	});
}
// Extend class with EventEmitter prototype
AttackEvent.prototype.__proto__ = events.EventEmitter.prototype;
AttackEvent.prototype.add = function(attack) {
	this.numAttacks++;
	this.emit("add", attack);
};
AttackEvent.prototype.ping = function(timestamp) {
	this.emit("ping", timestamp);
};
AttackEvent.prototype.start = function() {
	if (!this.started) {
		this.lastPollTime = Date.now();
		// bind to ensure we can access 'this' within the timeout func
		this.timer = setInterval(this.poll.bind(this), pollInterval);
		this.started = true;
	}
}
AttackEvent.prototype.stop = function() {
	clearInterval(this.timer);
	this.started = false;
}
AttackEvent.prototype.poll = function() {
	thisPollTime = Date.now();
	// recalculate the reference date, we may have tripped over midnight
	today = new Date();
	dateOffset = referenceDate - new Date(today.getFullYear(), today.getMonth(), today.getDate());
	this.timeSinceLastPing += pollInterval;
	// Find all attack events which occurred since last poll
		this.db.collection("session").find({ "timestamp": { "$gte": new Date(this.lastPollTime+dateOffset), "$lt": new Date(thisPollTime+dateOffset) }}).toArray((err, results) => {
		if (err) throw err;
		for (var i = 0; i < results.length; i++) {
			//console.log("Got a result");
			source_ip = results[i].source_ip;
			// run geoip_update.js to embed this data in the db itself
			/*if (source_ip && !results[i].geoip) {
				results[i].geoip = geoip.lookup(source_ip)
			}*/
			this.add(results[i]);
			this.timeSinceLastPing = 0;
		}
	});
	this.lastPollTime = thisPollTime;
	// Keep the connection alive by pinging after 15secs of inactivity
	if (this.timeSinceLastPing > 15000) {
		this.ping(thisPollTime);
		this.timeSinceLastPing = 0;
	}
}
// Instantiating this module function will create object instance
module.exports = AttackEvent
