var soda = require('soda-js');
var _ = require('underscore');
var moment = require('moment');

var TowZoneChecker = {
	check: function (address, onSuccess, onError) {
		var consumer = new soda.Consumer('data.sfgov.org');
		var nowStr = moment().format('YYYY-MM-DDTHH:mm:ss');
		var streetNumber = parseInt(address.street_number, 10);
		var self = this;

		consumer.query()
			.withDataset('cqn5-muyy')
			.where(soda.expr.gte('ending_date', nowStr))
			.where({
				streetname: address.street_name
			})
			//.order('namelast')
			.getRows()
			.on('success', function (rows) {
				// street number ranges are strings from the api, so they can't be properly
				// queried on.
				var newRows = _.reduce(rows, function (memo, row) {
					var toAddress = parseInt(row.toaddress, 10);
					var fromAddress = parseInt(row.fromaddress, 10);
					if (fromAddress <= (streetNumber + 50) && toAddress >= (streetNumber - 50)) {
						memo.push(TowZoneChecker._parseRow(row));
					}
					return memo;
				}, []);
				onSuccess(newRows);
			})
			.on('error', onError);
	},

	_parseRow: function (row) {
		var location = row.fromaddress + " - " + row.toaddress + " " + row.streetname;
		var startDate = moment(row.starting_date).format("dddd, MMMM Do YYYY");
		var endDate = moment(row.ending_date).format("dddd, MMMM Do YYYY");
		var timeRange = startDate + " " + row.starttime + " - " +
			endDate + " " + row.endtime;

		return {
			location: location,
			timeRange: timeRange,
			_raw: row
		};
	}
};

module.exports = TowZoneChecker;
