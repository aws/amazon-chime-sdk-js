const axios = require('axios');
const Base64 = require('js-base64').Base64;

const putTestResults = async (session_id, passed) => {

  console.log(`Publishing test results to saucelabs for session: ${session_id} status: ${passed ? 'passed' : 'failed'}`);
  const url = `https://saucelabs.com/rest/v1/${process.env.SAUCE_USERNAME}/jobs/${session_id}`;
  await axios.put(url, `{\"passed\": ${passed}}`, {
    headers: {
      "Accept": "application/json",
      "Content-type": "application/json",
      "Authorization": 'Basic ' + Base64.encode(process.env.SAUCE_USERNAME + ':' + process.env.SAUCE_ACCESS_KEY)
    }
  })
};

module.exports.putTestResults = putTestResults;