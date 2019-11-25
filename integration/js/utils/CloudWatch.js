const AWS = require('../node_modules/aws-sdk');
const {getOS, getOSVersion} = require('./WebdriverBrowserStack');

AWS.config.update({region: 'us-east-1'});
var cloudWatch = new AWS.CloudWatch({
  apiVersion: '2010-08-01'
});

module.exports.emitMetric = async (namespace, capabilities, metric_name, value) => {
  if (process.env.CLOUD_WATCH_METRIC === undefined || process.env.CLOUD_WATCH_METRIC === "false") {
    return
  }
  namespace = namespace.trim();
  metric_name = metric_name.trim();
  console.log(`Emitting metric: ${namespace}/${metric_name} : ${value}`);
  var params = {
    MetricData: [
      {
        MetricName: metric_name,
        Dimensions: [
          {
            Name: 'Browser',
            Value: capabilities.browserName
          },
          {
            Name: 'BrowserVersion',
            Value: capabilities.version
          },
          {
            Name: 'OS',
            Value: getOS(capabilities)
          },
          {
            Name: 'OSVersion',
            Value: getOSVersion(capabilities)
          },
        ],
        Unit: 'None',
        Value: value
      },
    ],
    Namespace: `Canary/${namespace}`
  };
  await publishMetricToCloudWatch(params);
  var paramsWithoutDimensions = {
    MetricData: [
      {
        MetricName: metric_name,
        Unit: 'None',
        Value: value
      },
    ],
    Namespace: `Canary/${namespace}`
  };
  await publishMetricToCloudWatch(paramsWithoutDimensions);
  var paramsWithBrowserDimension = {
    MetricData: [
      {
        MetricName: metric_name,
        Dimensions: [
          {
            Name: 'Browser',
            Value: capabilities.browserName
          },
        ],
        Unit: 'None',
        Value: value
      },
    ],
    Namespace: `Canary/${namespace}`
  };
  await publishMetricToCloudWatch(paramsWithBrowserDimension);
  var paramsWithOSDimension = {
    MetricData: [
      {
        MetricName: metric_name,
        Dimensions: [
          {
            Name: 'OS',
            Value: getOS(capabilities)
          },
        ],
        Unit: 'None',
        Value: value
      },
    ],
    Namespace: `Canary/${namespace}`
  };
  await publishMetricToCloudWatch(paramsWithOSDimension);
};

const publishMetricToCloudWatch = async (params) => {
  try {
    await cloudWatch.putMetricData(params).promise();
  } catch (error) {
    console.log(`Unable to emit metric: ${error}`)
  }
};