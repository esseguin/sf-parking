var nodemailer = require('nodemailer');

module.exports = function (nodemailerConfig) {
	var transporter = nodemailer.createTransport(nodemailerConfig);

	return {
		transporter: transporter,
		send: function (mailOptions) {
			// send mail with defined transport object
			this.transporter.sendMail(mailOptions, function(error, info){
				if (error) {
					console.error(error);
				}
				console.log('Message sent: ' + info.response);

			});
		}
	};
};
