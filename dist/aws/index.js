'use strict';

var _express = require('express');

var _aws = require('./aws.controller');

var controller = _interopRequireWildcard(_aws);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

var router = new _express.Router();

router.get('/s3Signature', controller.s3Signature);

module.exports.router = router;
module.exports.awsHelper = require('./aws.helper');