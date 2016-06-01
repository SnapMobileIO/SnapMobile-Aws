'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.s3Signature = s3Signature;

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _crypto = require('crypto');

var _crypto2 = _interopRequireDefault(_crypto);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var AWS_S3_FILES_BUCKET = process.env.AWS_S3_FILES_BUCKET;
var AWS_S3_FILES_KEY_PREFIX = process.env.AWS_S3_FILES_KEY_PREFIX;
var AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
var AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;

function s3Signature(req, res, next) {

  if (!req.query.fileType || !req.query.fileName) {
    return res.status(422).json({ error: 'Missing required parameters' });
  }

  var fileType = req.query.fileType;

  // Clean the file name of special characters, extra spaces, etc.
  var fileName = req.query.fileName.replace(/[^a-zA-Z0-9. ]/g, '').replace(/\s+/g, ' ').replace(/[ ]/g, '-');

  // Create random string to ensure unique filenames
  var randomBytes = _crypto2.default.randomBytes(32).toString('hex');

  /**
   * Create aws file key by combining random string and file name
   * e.g., 73557ec94ea744c5c24bdb03ee114a1ef83ab2dd9bfb20f38999faea14564d19/DarthVader.jpg
   */
  var fileKey = AWS_S3_FILES_KEY_PREFIX + '/' + randomBytes + '/' + fileName;

  // Create expiration for S3 signature
  var expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + 20);

  // Create S3 policy document for signing
  var s3Policy = {
    expiration: expiration,
    conditions: [['starts-with', '$key', fileKey], { bucket: AWS_S3_FILES_BUCKET }, { acl: 'public-read' }, ['starts-with', '$Content-Type', fileType]]
  };

  // Stringify and encode the policy
  var stringPolicy = JSON.stringify(s3Policy);
  var base64Policy = Buffer(stringPolicy, 'utf-8').toString('base64');

  // Sign the base64 encoded policy
  var signature = _crypto2.default.createHmac('sha1', AWS_SECRET_ACCESS_KEY).update(new Buffer(base64Policy, 'utf-8')).digest('base64');

  // Build the response object
  var response = {
    s3Policy: base64Policy,
    s3Signature: signature,
    awsAccessKey: AWS_ACCESS_KEY_ID,
    s3Bucket: AWS_S3_FILES_BUCKET,
    s3Key: fileKey
  };

  res.status(200).json(response);
};