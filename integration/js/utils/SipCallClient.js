const {exec} = require('child_process');

class SipCallClient {

  constructor(sipTestAssetPath, resultPath) {
    this.sipTestAssetPath = sipTestAssetPath;
    this.resultPath = resultPath;
  }

  call(voiceConnectorId, joinToken) {
    return exec(`env PLAY_TONE=1 TONE_PATH=${this.sipTestAssetPath}/test_tone.wav SIP_DOMAIN="${voiceConnectorId}.voiceconnector.chime.aws;transport=tls;X-chime-join-token=${joinToken.split("X-joinToken=")[1]}" SIP_USER=29709308 SIP_PASSWD=Tz6cghdEgKA4 SIP_CALLER_ID=+12156901457 SIP_PUBLIC_IP_ADDR=3.227.216.243 ${this.sipTestAssetPath}/sipagent_tls +17035550122 12345 ${this.resultPath}/test.wav`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return;
      }
      console.log(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
    });
  }

  end(sipCallProcess) {
    sipCallProcess.kill('SIGTERM')
  }

}

module.exports.SipCallClient = SipCallClient;
