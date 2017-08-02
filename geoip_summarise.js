#!/usr/bin/env node
const mongoClient = require('mongodb').MongoClient;
const mongoUrl = "mongodb://localhost:27017/mnemosyne";
const country_codes = require('node-iso-3166')

mongoClient.connect(mongoUrl, function(err, db) {
	if (err) throw err;
	db.collection("session").aggregate([ { $match: { "timestamp": { "$gte": new Date("2017-07-25"), "$lt": new Date("2017-07-26") }}}, { $group: { _id: "$geoip.country", "count": { "$sum": 1 }} }]).toArray((err, results) => {
		if (err) throw err;
		for (var i = 0; i < results.length; i++) {
			result = results[i];
			if (country_codes.iso_3166_1[result._id] != undefined) {
				console.log(country_codes.iso_3166_1[result._id].alpha3+','+result.count);
			}
		}
	});
});
