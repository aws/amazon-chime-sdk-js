// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// One capture bucket per account and media Region, named after the account so every deployment
// there reuses it. api-server.js uses this file directly; deploy.js copies it into the Lambda bundle.

const {
  CreateBucketCommand,
  GetBucketTaggingCommand,
  HeadBucketCommand,
  PutBucketLifecycleConfigurationCommand,
  PutBucketPolicyCommand,
  PutBucketTaggingCommand,
  PutPublicAccessBlockCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

// Only buckets carrying this tag get their policy and expiry managed here.
const MANAGED_TAG = { Key: 'chime-sdk-demo', Value: 'media-capture' };

const ready = new Map();

function captureBucketName({ accountId, region, prefix }) {
  return prefix ? `${prefix}-${region}` : `chime-sdk-demo-${accountId}-${region}`;
}

function ensureCaptureBucket(options) {
  const bucket = captureBucketName(options);
  if (!ready.has(bucket)) {
    const pending = prepare(bucket, options);
    ready.set(bucket, pending);
    // A failure is not cached: the next Record press tries again.
    pending.catch(() => ready.delete(bucket));
  }
  return ready.get(bucket);
}

async function prepare(bucket, { accountId, region, servicePrincipal, s3 }) {
  const client = s3 ?? new S3Client({ region });
  let exists = true;
  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket, ExpectedBucketOwner: accountId }));
  } catch (error) {
    const status = error.$metadata?.httpStatusCode;
    if (status !== 404) {
      // 403: the name belongs to another account; 301: the bucket is in another Region. Refused, so
      // recordings never land in someone else's bucket. The message omits the name (it carries the account ID).
      throw Object.assign(
        new Error(
          `The media capture bucket for ${region} is not available to this account (S3 answered ${status ?? error.name}). Choose another bucket prefix.`
        ),
        { name: 'CaptureBucketUnavailableError', bucket }
      );
    }
    exists = false;
  }
  if (exists && !(await isManaged(client, bucket, accountId))) {
    return bucket;
  }
  if (!exists) {
    try {
      await client.send(
        new CreateBucketCommand({
          Bucket: bucket,
          ...(region === 'us-east-1' ? {} : { CreateBucketConfiguration: { LocationConstraint: region } }),
        })
      );
    } catch (error) {
      // Two first recordings at once: the other request created it.
      if (error.name !== 'BucketAlreadyOwnedByYou') {
        throw error;
      }
    }
    await client.send(
      new PutBucketTaggingCommand({
        Bucket: bucket,
        ExpectedBucketOwner: accountId,
        Tagging: { TagSet: [MANAGED_TAG] },
      })
    );
  }
  // Applied again on reuse too, so a bucket whose setup was interrupted gets finished.
  await client.send(
    new PutPublicAccessBlockCommand({
      Bucket: bucket,
      ExpectedBucketOwner: accountId,
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        IgnorePublicAcls: true,
        BlockPublicPolicy: true,
        RestrictPublicBuckets: true,
      },
    })
  );
  await client.send(
    new PutBucketPolicyCommand({
      Bucket: bucket,
      ExpectedBucketOwner: accountId,
      Policy: JSON.stringify(capturePolicy(bucket, accountId, servicePrincipal)),
    })
  );
  await client.send(
    new PutBucketLifecycleConfigurationCommand({
      Bucket: bucket,
      ExpectedBucketOwner: accountId,
      LifecycleConfiguration: {
        Rules: [
          {
            ID: 'Delete media capture artifacts after 1 day',
            Status: 'Enabled',
            Filter: { Prefix: '' },
            Expiration: { Days: 1 },
          },
        ],
      },
    })
  );
  return bucket;
}

async function isManaged(client, bucket, accountId) {
  try {
    const { TagSet = [] } = await client.send(
      new GetBucketTaggingCommand({ Bucket: bucket, ExpectedBucketOwner: accountId })
    );
    return TagSet.some(tag => tag.Key === MANAGED_TAG.Key && tag.Value === MANAGED_TAG.Value);
  } catch (error) {
    if (error.name === 'NoSuchTagSet') {
      return false;
    }
    throw error;
  }
}

function capturePolicy(bucket, accountId, servicePrincipal = 'mediapipelines.chime.amazonaws.com') {
  return {
    Version: '2012-10-17',
    Statement: [
      {
        Sid: 'AWSChimeMediaCaptureBucketPolicy',
        Effect: 'Allow',
        Principal: { Service: servicePrincipal },
        Action: ['s3:PutObject', 's3:PutObjectAcl'],
        Resource: `arn:aws:s3:::${bucket}/*`,
        Condition: {
          StringEquals: { 'aws:SourceAccount': accountId },
          ArnLike: { 'aws:SourceArn': `arn:aws:chime:*:${accountId}:*` },
        },
      },
    ],
  };
}

module.exports = { ensureCaptureBucket };
