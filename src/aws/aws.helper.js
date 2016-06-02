'use strict';

import AWS from 'aws-sdk';
import Promise from 'bluebird';

/**
 * Generate an array of image style objects based on the S3 key (original url)
 * @param  {String} s3Key The original S3 Key
 * @return {Object}        Object of image styles
 */
export function stylesForImage(s3Key) {
  const baseDirectory = 'original';
  const styles = ['large', 'large_square', 'medium', 'medium_square', 'thumb', 'thumb_square'];

  let imageStyles = {};

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
export function validateExistence(s3Key) {
  return new Promise((resolve, reject) => {
    if (!s3Key) {
      reject(new Error('S3 key is required to validate existence of the file.'));
    }

    let params = {
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: s3Key,
    };
    let s3 = new AWS.S3();
    s3.headObject(params, (err, response) => {
      if (err) {
        let errMessage = new Error(`Could not find S3 file ${s3Key}. ` +
                                   `Error '${err.code}' with status '${err.statusCode}'.`);
        console.error(errMessage);
        reject(errMessage);
      }

      console.log(`Confirmed existence for ${s3Key}.`);
      resolve(response);
    });
  });
}

/**
 * Returns a promise of a S3 key file
 * @param  {String} s3Key S3 key of CSV
 * @return {Promise<Response|Error>} Returns the success response of the s3.headObject API call or error
 */
export function getFile(s3Key) {
  return new Promise((resolve, reject) => {
    if (!s3Key) {
      reject(new Error('S3 key is required to get the file.'));
    }

    let params = {
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: s3Key,
    };
    let s3 = new AWS.S3();
    s3.getObject(params, (err, response) => {
      if (err) {
        let errMessage = new Error(`Could not find S3 file ${s3Key}. ` +
                                   `Error '${err.code}' with status '${err.statusCode}'.`);
        console.error(errMessage);
        reject(errMessage);
      }

      console.log(`Found file for ${s3Key}.`);
      resolve(response);
    });
  });
}
