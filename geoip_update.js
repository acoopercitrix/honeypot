#!/usr/bin/env node
const mongoClient = require('mongodb').MongoClient;
const mongoUrl = "mongodb://localhost:27017/mnemosyne";
const geoip = require('geoip-lite');
mongoClient.connect(mongoUrl, function(err, db) {
	if (err) throw err;
	db.collection("session").find( { geoip : {$exists : false } }).toArray((err, results) => {
		if (err) throw err;
		for (var i = 0; i < results.length; i++) {
			result = results[i];
			source_ip = result.source_ip;
			// run geoip_update.js to embed this data in the db itself
			if (source_ip) {
				geoip_details = geoip.lookup(source_ip)
				db.collection("session").update({"_id": result._id}, {"$set": { "geoip": geoip_details}});
			}
		}
		console.log(result._id);
	});
});
