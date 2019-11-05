const axios = require('axios');
const Base64 = require('js-base64').Base64;

const header = () => {
  return {
    Authorization: 'Basic ' + Base64.encode(process.env.BROWSER_STACK_USERNAME + ':' + process.env.BROWSER_STACK_ACCESSKEY)
  }
};

const getFromBrowserStack = async (url_path) => {
  const res = await axios.get(`https://api.browserstack.com/automate/${url_path}`, {
    headers: header()
  });
  return res.data;
};

const getBuildId = async () => {
  const build_details = await getFromBrowserStack("builds.json?status=running");
  if (build_details.length === 0) {
    return ""
  }
  return build_details[0]["automation_build"]["hashed_id"]
};

const getRunDetails = async (session_id) => {
  const build_id = await getBuildId();
  run_details = await getFromBrowserStack(`builds/${build_id}/sessions/${session_id}.json`);
  return run_details
};

module.exports.getBuildId = getBuildId;
module.exports.getRunDetails = getRunDetails;