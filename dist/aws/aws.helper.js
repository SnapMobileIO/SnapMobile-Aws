'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.stylesForImage = stylesForImage;
exports.validateExistence = validateExistence;

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generate an array of image style objects based on the S3 key (original url)
 * @param  {String} s3Key The original S3 Key
 * @return {Object}        Object of image styles
 */
function stylesForImage(s3Key) {
  var baseDirectory = 'original';
  var styles = ['large', 'large_square', 'medium', 'medium_square', 'thumb', 'thumb_square'];

  var imageStyles = {};

  for (var i = styles.length - 1; i >= 0; i--) {
    imageStyles[styles[i]] = s3Key.replace(baseDirectory, styles[i]);
  }

  return imageStyles;
}

/**
 * Validates existence of S3 key via AWS API `headObject` method
 * @param  {String} s3Key S3 key to validate
 * @return {Promise<Response|Error>} Returns the success response of the s3.headObject API call or error
 */
function validateExistence(s3Key) {
  return new _bluebird2.default(function (resolve, reject) {
    if (!s3Key) {
      reject(new Error('S3 key is required to validate existence of the file.'));
    }

    var params = {
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: s3Key
    };
    var s3 = new _awsSdk2.default.S3();
    s3.headObject(params, function (err, response) {
      if (err) {
        var errMessage = new Error('Could not find S3 file ' + s3Key + '. ' + ('Error \'' + err.code + '\' with status \'' + err.statusCode + '\'.'));
        console.error(errMessage);
        reject(errMessage);
      }

      console.log('Confirmed existence for ' + s3Key + '.');
      resolve(response);
    });
  });
}