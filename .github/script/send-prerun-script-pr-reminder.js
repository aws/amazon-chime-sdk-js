// Send prerun script PR reminder is a minimal script that makes a HTTP POST call to a webhook to send a slack message.
// For example, this script passes PR URLs to the webhook so that the amazon-chime-js-sdk team can be notified.

const axios = require('axios');

var myArgs = process.argv.slice(2);

axios.post(myArgs[0], {
  'major-version-pr': myArgs[1],
  'pmv-pr': myArgs[2]
});
