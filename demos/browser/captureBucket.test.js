// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { describe, expect, it } from 'vitest';

import captureBucket from './captureBucket.js';

const { captureBucketName, ensureCaptureBucket } = captureBucket;

/** An S3 client that answers HeadBucket (and GetBucketTagging) as told and records every call. */
function fakeS3({ head = 200, tags = null, createError = null } = {}) {
  const calls = [];
  const fail = (status, name) => Object.assign(new Error(name), { name, $metadata: { httpStatusCode: status } });
  return {
    calls,
    async send(command) {
      const name = command.constructor.name.replace(/Command$/, '');
      calls.push({ name, input: command.input });
      if (name === 'HeadBucket' && head !== 200) {
        throw fail(head, head === 404 ? 'NotFound' : 'Forbidden');
      }
      if (name === 'GetBucketTagging') {
        if (!tags) {
          throw fail(404, 'NoSuchTagSet');
        }
        return { TagSet: tags };
      }
      if (name === 'CreateBucket' && createError) {
        throw fail(409, createError);
      }
      return {};
    },
  };
}

let account = 100000000000;
const options = s3 => ({ accountId: String(++account), region: 'eu-west-1', s3 });

describe('ensureCaptureBucket', () => {
  it('names the bucket after the account, or after a configured prefix', () => {
    expect(captureBucketName({ accountId: '123456789012', region: 'us-east-1' })).toBe(
      'chime-sdk-demo-123456789012-us-east-1'
    );
    expect(captureBucketName({ accountId: '1', region: 'us-east-1', prefix: 'canary' })).toBe(
      'canary-us-east-1'
    );
  });

  it('creates a missing bucket private, tagged, with a policy for this account and a 1-day expiry', async () => {
    const s3 = fakeS3({ head: 404 });
    const opts = options(s3);
    const bucket = await ensureCaptureBucket(opts);

    expect(s3.calls.map(call => call.name)).toEqual([
      'HeadBucket',
      'CreateBucket',
      'PutBucketTagging',
      'PutPublicAccessBlock',
      'PutBucketPolicy',
      'PutBucketLifecycleConfiguration',
    ]);
    expect(s3.calls[0].input.ExpectedBucketOwner).toBe(opts.accountId);
    expect(s3.calls[1].input.CreateBucketConfiguration).toEqual({ LocationConstraint: 'eu-west-1' });
    const policy = JSON.parse(s3.calls[4].input.Policy);
    expect(policy.Statement[0].Resource).toBe(`arn:aws:s3:::${bucket}/*`);
    expect(policy.Statement[0].Condition.StringEquals['aws:SourceAccount']).toBe(opts.accountId);
    expect(s3.calls[5].input.LifecycleConfiguration.Rules[0].Expiration).toEqual({ Days: 1 });
  });

  it('reuses a bucket this account owns without touching one it did not create', async () => {
    const s3 = fakeS3({ head: 200, tags: [{ Key: 'team', Value: 'x' }] });
    await ensureCaptureBucket(options(s3));

    expect(s3.calls.map(call => call.name)).toEqual(['HeadBucket', 'GetBucketTagging']);
  });

  it('finishes the setup of a bucket it created before', async () => {
    const s3 = fakeS3({ head: 200, tags: [{ Key: 'chime-sdk-demo', Value: 'media-capture' }] });
    await ensureCaptureBucket(options(s3));

    expect(s3.calls.map(call => call.name)).toEqual([
      'HeadBucket',
      'GetBucketTagging',
      'PutPublicAccessBlock',
      'PutBucketPolicy',
      'PutBucketLifecycleConfiguration',
    ]);
  });

  it('refuses a name another account owns, and tries again on the next call', async () => {
    const s3 = fakeS3({ head: 403 });
    const opts = options(s3);
    await expect(ensureCaptureBucket(opts)).rejects.toMatchObject({
      name: 'CaptureBucketUnavailableError',
      message: expect.not.stringContaining(opts.accountId),
    });
    expect(s3.calls.map(call => call.name)).toEqual(['HeadBucket']);

    await expect(ensureCaptureBucket(opts)).rejects.toThrow();
    expect(s3.calls.length).toBe(2);
  });

  it('checks a bucket once per process', async () => {
    const s3 = fakeS3({ head: 200 });
    const opts = options(s3);
    await ensureCaptureBucket(opts);
    await ensureCaptureBucket(opts);

    expect(s3.calls.filter(call => call.name === 'HeadBucket').length).toBe(1);
  });

  it('treats a bucket another request just created as created', async () => {
    const s3 = fakeS3({ head: 404, createError: 'BucketAlreadyOwnedByYou' });
    await expect(ensureCaptureBucket(options(s3))).resolves.toMatch(/^chime-sdk-demo-/);
  });
});
