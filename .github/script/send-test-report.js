// Send test report is a minimal script that makes a HTTP POST call to a webhook to send a slack message.
// For example, this script passes results of the browser compatibility report to the webhook so that the amazon-chime-js-sdk team can be notified of the results.

// Disabled until a kind soul fixes these tests

// const axios = require('axios');

// var myArgs = process.argv.slice(2);

// if (myArgs[2].toUpperCase() !== 'SUCCESS') {
//   axios.post(myArgs[0], {
//     'github_workflow_url': myArgs[1],
//     'browser_compatibility_tests_status': myArgs[2].toUpperCase()
//   }).then(res => {
//     console.log(res.data);
//   }).catch(err => {
//     console.log(err);
//   });
// }
