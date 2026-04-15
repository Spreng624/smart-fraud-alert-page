const qs = require('querystring');
const http = require('https');

const options = {
	method: 'POST',
	hostname: 'truecaller-api3.p.rapidapi.com',
	port: null,
	path: '/v2.php',
	headers: {
		'x-rapidapi-key': '32cf2fd565msh3f416c33bcdb0b1p1ba83djsnb7aa5e633f90',
		'x-rapidapi-host': 'truecaller-api3.p.rapidapi.com',
		'Content-Type': 'application/x-www-form-urlencoded'
	}
};

const req = http.request(options, function (res) {
	const chunks = [];

	res.on('data', function (chunk) {
		chunks.push(chunk);
	});

	res.on('end', function () {
		const body = Buffer.concat(chunks);
		console.log(body.toString());
	});
});

req.write(qs.stringify({}));
req.end();