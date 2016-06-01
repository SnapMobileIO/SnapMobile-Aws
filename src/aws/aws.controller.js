'use strict';

import aws from 'aws-sdk';
import crypto from 'crypto';

const AWS_S3_FILES_BUCKET = process.env.AWS_S3_FILES_BUCKET;
const AWS_S3_FILES_KEY_PREFIX = process.env.AWS_S3_FILES_KEY_PREFIX;
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

export function s3Signature(req, res, next) {

  if (!req.query.fileType || !req.query.fileName) {
    return res.status(422).json({ error: 'Missing required parameters' });
  }

  let fileType = req.query.fileType;

  // Clean the file name of special characters, extra spaces, etc.
  let fileName = req.query.fileName
                          .replace(/[^a-zA-Z0-9. ]/g, '')
                          .replace(/\s+/g, ' ')
                          .replace(/[ ]/g, '-');

  // Create random string to ensure unique filenames
  let randomBytes = crypto.randomBytes(32).toString('hex');

  /**
   * Create aws file key by combining random string and file name
   * e.g., 73557ec94ea744c5c24bdb03ee114a1ef83ab2dd9bfb20f38999faea14564d19/DarthVader.jpg
   */
  let fileKey = AWS_S3_FILES_KEY_PREFIX + '/' + randomBytes + '/' + fileName;

  // Create expiration for S3 signature
  let expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 20);

  // Create S3 policy document for signing
  let s3Policy = {
    expiration: expiration,
    conditions: [
      ['starts-with', '$key', fileKey],
      { bucket: AWS_S3_FILES_BUCKET },
      { acl: 'public-read' },
      ['starts-with', '$Content-Type', fileType],
    ],
  };

  // Stringify and encode the policy
  let stringPolicy = JSON.stringify(s3Policy);
  let base64Policy = Buffer(stringPolicy, 'utf-8').toString('base64');

  // Sign the base64 encoded policy
  let signature = crypto.createHmac('sha1', AWS_SECRET_ACCESS_KEY)
                        .update(new Buffer(base64Policy, 'utf-8'))
                        .digest('base64');

  // Build the response object
  let response = {
    s3Policy: base64Policy,
    s3Signature: signature,
    awsAccessKey: AWS_ACCESS_KEY_ID,
    s3Bucket: AWS_S3_FILES_BUCKET,
    s3Key: fileKey,
  };

  res.status(200).json(response);
};
