'use strict';

import { Router } from 'express';
import * as controller from './aws.controller';

const router = new Router();

router.get('/s3Signature', controller.s3Signature);

module.exports.router = router;
module.exports.awsHelper = require('./aws.helper');
