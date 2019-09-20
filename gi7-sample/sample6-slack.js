const request = require('request');
require('dotenv').config();

function postSlack(message) {
    const options = {
        url: process.env.NP_SLACK_URL,
        method: 'POST',
        form: `payload={"text": "${message}", "username": "net_perf_by_puppeteer"}`,
        json: true
    };

    request(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            console.log(body.name);
        } else {
            console.log('error: '+ response.statusCode + body);
        }
    })
}

postSlack(process.argv[2]);
