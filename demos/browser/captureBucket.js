// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

// The S3 bucket a media capture pipeline writes to, made the first time someone records in a
// media Region: one bucket per account and Region, named after the account so it is reused by
// every deployment there and never mistaken for another account's bucket. api-server.js uses
// this file directly; the serverless demo's deploy.js copies it into the Lambda bundle.

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

// Marks the buckets this file created; only those get their policy and expiry managed here.
const MANAGED_TAG = { Key: 'chime-sdk-demo', Value: 'media-capture' };

// Buckets already checked in this process, so a Record press costs one S3 call per Region at most.
const ready = new Map();

/** `<prefix>-<region>` when a prefix is configured, else `chime-sdk-demo-<account>-<region>`. */
function captureBucketName({ accountId, region, prefix }) {
  return prefix ? `${prefix}-${region}` : `chime-sdk-demo-${accountId}-${region}`;
}

/**
 * Returns the capture bucket for `region`, creating it on first use: private, with a policy that
 * lets the media pipelines service write for this account only, and a one-day expiry. A bucket
 * this account already owns under that name is reused; a name another account owns is refused,
 * so recordings are never written into someone else's bucket.
 */
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
      // 403: the name belongs to another account (or this one may not read it); 301: the bucket is
      // in another Region. Either way it is not this account's bucket for this Region.
      // The message reaches the browser, so it leaves out the name (which carries the account ID).
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

/** The media pipelines service may write capture artifacts, for this account's pipelines only. */
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

module.exports = { captureBucketName, ensureCaptureBucket, capturePolicy };
