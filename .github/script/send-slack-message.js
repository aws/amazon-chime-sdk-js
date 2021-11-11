#!/usr/bin/env node
const https = require('https');

var myArgs = process.argv.slice(2);

var postRequestBody = JSON.stringify({
  'github_workflow_url': myArgs[0],
  'browser_compatibility_tests_status': myArgs[1]
});

var options = {
  hostname: 'hooks.slack.com',
  port: 443,
  path: '/workflows/T01G4KQGFRR/A02MQHS4FDL/382095100571825165/eddzDQMlopIW3VYdiuUoWFC9',
  method: 'POST',
  headers: {
       'Content-Type': 'application/x-www-form-urlencoded',
       'Content-Length': postRequestBody.length
     }
}

const req = https.request(options, (res) => {
  console.log(res);
});

req.on('error', (e) => {
  console.error(e);
});

req.write(postRequestBody);
req.end();

console.log("Done!!");
