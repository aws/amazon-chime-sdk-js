// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

const { Connect } = require('@aws-sdk/client-connect');
const fs = require('fs');

exports.index = async (event, context) => {
  return response(200, 'text/html', fs.readFileSync('./index.html', { encoding: 'utf8' }));
};

exports.start_webrtc_contact = async (event, context) => {
  const body = JSON.parse(event.body);

  if (!body.contactFlowArn || !body.customerName) {
    return response(400, 'application/json', JSON.stringify({ error: 'Need parameters: contactFlowArn, customerName' }));
  }

  // Parse instance ID, region, and flow ID from contact flow ARN
  // Format: arn:aws:connect:<region>:<account>:instance/<instance-id>/contact-flow/<flow-id>
  const arnParts = body.contactFlowArn.split(':');
  const connectRegion = arnParts[3];
  const resourceParts = arnParts[5].split('/');
  const instanceId = resourceParts[1];
  const contactFlowId = resourceParts[3];

  const connectClient = new Connect({
    region: connectRegion,
    ...(body.connectEndpoint && { endpoint: body.connectEndpoint }),
  });

  const webrtcResponse = await connectClient.startWebRTCContact({
    ContactFlowId: contactFlowId,
    InstanceId: instanceId,
    AllowedCapabilities: {
      Customer: { Video: 'SEND' },
      Agent: { Video: 'SEND' },
    },
    ParticipantDetails: {
      DisplayName: body.customerName,
    },
  });

  return response(201, 'application/json', JSON.stringify({
    ContactId: webrtcResponse.ContactId,
    ConnectionData: webrtcResponse.ConnectionData,
  }));
};

function response(statusCode, contentType, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    body,
  };
}
