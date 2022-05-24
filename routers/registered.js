const express = require('express');
const router = express.Router();

const registered = require('../app/registered/registered');
const getCheckMailCode = require('../app/registered/getCheckMailCode');

/**
 * 注册
 * /api/registered
 * 参数: key, userName, password, reCaptchaKey
 */
router.post('/', registered);

/**
 * 获取邮箱验证码
 * /api/registered/get_check_mail_code
 * 参数: mail, reCaptchaKey
 */
router.post('/get_check_mail_code', getCheckMailCode);

module.exports = router;
