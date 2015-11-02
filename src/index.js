/* global -Promise */
var Promise = require('promise');
var _ = require('underscore');
var moment = require('moment');
var colors = require('colors');
var config = require('config');
var swig = require('swig');
var parseArgs = require('minimist');
var Table = require('cli-table');

var TowZoneChecker = require('./TowZoneChecker');
var EmailSender = require('./EmailSender');

var templateDir = process.cwd() + "/templates/";
var args = parseArgs(process.argv.slice(2), {
	alias: {
		out: ['o']
	},
	default: {
		out: 'print'
	}
});

var license = config.car.license;
var addr = config.car.location;
var formattedLocation = addr.street_number + " " + addr.street_name;

var promised = function (fn) {
	return new Promise(function (resolve, reject) {
		fn(resolve, reject);
	});
};

var p1 = promised(_.partial(TowZoneChecker.check, addr));


Promise.all([p1]).then(function (results) {
	var towZoneInfo = results[0];
	switch (args.out) {
	case 'email':
		var nodemailerConfig = config.email.config;
		var emailer = new EmailSender(nodemailerConfig);
		var from = 'Parking Report <' + nodemailerConfig.auth.user + '>';
		var template = swig.compileFile(templateDir + 'email.html');
		var html = template({
			license: license,
			address: formattedLocation,
			towZones: towZoneInfo
		});
		emailer.send({
			from: from,
			to: config.email.to,
			subject: 'Parking Report',
			html: html
		});
		break;
	case 'print':
		var table = new Table({
			head: ['Location', 'Times Enforced']
		});
		_.each(towZoneInfo, function (row) {
			table.push([row.location, row.timeRange]);
		});

		console.log("===================================================================");
		console.log("Parking Report");
		console.log("===================================================================");
		console.log(
			'License: ' + colors.green(license) + ", " +
			'Location: ' + colors.green(formattedLocation)
		);
		console.log("\nUpcoming tow zones:");
		console.log(table.toString());
		break;
	}
});
