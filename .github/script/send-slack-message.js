const axios = require('axios');

var myArgs = process.argv.slice(2);

axios.post(myArgs[0], {
  'github_workflow_url': myArgs[1],
  'browser_compatibility_tests_status': myArgs[2].toUpperCase()
}, res => {
  console.log(res);
}, err => {
  console.log(err);
});
