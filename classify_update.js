#!/usr/bin/env node
const mongoClient = require('mongodb').MongoClient;
const mongoUrl = "mongodb://localhost:27017/mnemosyne";
function classify(port, protocol) {
	// ICMP
	if (protocol == 'ICMP') {
		return 'DISCOVERY_PROBE';
	}
	// SSDP
	if (protocol == 'UDP' && port == '1900') {
                return 'DISCOVERY_PROBE';
	}
	// MSSQL/LDAP/mysql
	else if (protocol == 'mssqld' || port == '636' || port == '1433' || port == '1434' || port == '3306') {
		return 'DATABASE_THEFT';
	}
	// RDP/VNC
	else if (port == '3389' || port == '3388' || port == '5900') {
		return 'PASSWORD_GUESSING';
	}
	// SIP
	else if (protocol == 'SipCall' || protocol == 'SipSession' || port == '5060') {
		return 'TELEPHONE_HACKING';
	}
	// SMB/MS NET TCP port sharing
	else if (protocol == 'smbd' || port == '138' || port == '808') {
		return 'MALWARE';
	}
	// HTTP/HTTPS/Microsoft remote web workplace
	else if (port == '80' || port == '443' || port == '987' || port == '8080') {
		return 'MALWARE';
	}
	// SMTP
	else if (port == '25' | port == '110') {
		return 'SPAM_EMAIL';
	}
	// SSH/FTP/Telnet/FTPS
	else if (port == '20' || port == '21' || port == '22' || port == '23' || port == '990') {
		return 'PASSWORD_GUESSING';
	} else {
		return null;
	}
}
mongoClient.connect(mongoUrl, function(err, db) {
	if (err) throw err;
	db.collection("session").find( { classification : {$exists : false } }).toArray((err, results) => {
		if (err) throw err;
		for (var i = 0; i < results.length; i++) {
			result = results[i];
			port = result['destination_port'];
			protocol = result['protocol'];
			classification = classify(port, protocol);
			if (!classification) {
				console.log("Failed to classify "+port+" "+protocol);
				// default to MALWARE classification
				classification = 'MALWARE';
			}			
			db.collection("session").update({"_id": result._id}, {"$set": { "classification": classification}});
		}
		//console.log(result._id);
	});
});
