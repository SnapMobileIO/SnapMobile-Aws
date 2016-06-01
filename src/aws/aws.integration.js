'use strict';

import chai from 'chai';
import chaiHttp from 'chai-http';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import AWS from 'aws-sdk';
import async from 'async';
import server from '../../../dist/server/app';

chai.use(chaiHttp);

const s3 = new AWS.S3();

describe('AWS Component - Integration', function() {

  it('should get a S3 signature object on /api/aws/s3Signature GET', function(done) {
    chai.request(server)
      .get('/api/aws/s3Signature?fileName=DarthVader.jpg&fileType=image/jpg')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('s3Policy');
        res.body.should.have.property('s3Signature');
        res.body.should.have.property('awsAccessKey');
        res.body.awsAccessKey.should.equal(process.env.AWS_ACCESS_KEY_ID);
        res.body.should.have.property('s3Bucket');
        res.body.s3Bucket.should.equal(process.env.AWS_S3_FILES_BUCKET);
        res.body.should.have.property('s3Key');
        done();
      });
  });

  /**
   * This test is long and nasty, but matches what happens with AWS image upload
   * 1. Retrieves S3 key from our server
   * 2. Uploads image to bucket (where AWS Lamnda resizes)
   * 3. Checks that the new image sizes exist
   */
  it('should upload file to AWS S3', function(done) {

    // Extend the Mocha timeout since this includes file uploads
    this.timeout(5000);

    chai.request(server)
      .get('/api/aws/s3Signature?fileName=DarthVader.jpg&fileType=image/jpg')
      .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');

        let s3Key = res.body.s3Key;
        let file = fs.readFileSync(path.resolve(__dirname, 'test', 'DarthVader.jpg'));

        s3.putObject({
          Bucket: process.env.AWS_S3_FILES_BUCKET,
          Key: s3Key,
          Body: file,
          ContentType: 'image/jpg',
          ACL: 'public-read'
        }, function(err, res) {

          // Turn error to string to protect from weird circular chai error
          if (err) {
            console.error(err);
            `Error uploading file ${s3Key}`.should.not.exist;
          }

          (!!res).should.not.be.false;
          res.should.have.property('ETag');

          // Create array of image sizes (set in AWS Lamda script)
          const imageSizes = ['large',
                              'large_square',
                              'medium',
                              'medium_square',
                              'thumb',
                              'thumb_square'];

          // Require timeout to allow AWS Lamda script enough time to resize images
          setTimeout(function() {

            // Loop through each image size syncronously to check if it exists
            async.each(imageSizes, function(imageSize, callback) {

              // Replace the 'original' in the url with the appropraite size
              let sizedS3Key = s3Key.replace('original', imageSize);

              s3.headObject({
                Bucket: process.env.AWS_S3_FILES_BUCKET,
                Key: sizedS3Key
              }, function(err, res) {

                // Turn error to string to protect from weird circular chai error
                if (err) {
                  console.error(err);
                  `File does not exist: ${sizedS3Key}`.should.not.exist;
                }

                (!!res).should.not.be.false;
                res.should.have.property('ETag');
                callback(err);
              });

            }, function(err) {
              (!!err).should.be.false;
              done();
            });

          }, 3000);
        });
      });
  });

});
