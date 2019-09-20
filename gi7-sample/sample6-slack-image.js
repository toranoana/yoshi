const request = require('request');
const fs = require('fs');

require('dotenv').config();

function postImageSlack(imageFileName) {

    const options = {
        token: process.env.NP_SLACK_TOKEN,
        channels: process.env.NP_CHANNEL,
        file: fs.createReadStream(imageFileName),
        filename: 'puppeteer.jpg'
    };

    request.post({url:'https://slack.com/api/files.upload', formData: options}, function(error, response) {
        if (!error && response.statusCode == 200) {
            console.log('ok');
        } else {
            console.log('status code: ' + response.statusCode);
        }
    });
}

postImageSlack(process.argv[2]);
