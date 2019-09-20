const fs = require('fs');

exports.handler = async (event, context, callback) => {
  var response = {
    "statusCode": 200,
    "headers": {
      'Content-Type': 'text/html'
    },
    "body": '',
    "isBase64Encoded": false
  };
  response.body = fs.readFileSync('./index.html', {encoding: 'utf8'});
  callback(null, response);
};
