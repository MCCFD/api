const express = require('express');
const router = express.Router();

const find = require('../app/find/find');
const getCheckMailCode = require('../app/find/getCheckMailCode');

/**
 * 找回密码
 * /api/find
 * 参数: key, password, reCaptchaKey
 */
router.post('/', find);

/**
 * 获取邮箱验证码
 * /api/find/get_check_mail_code
 * 参数: mail, reCaptchaKey
 */
router.post('/get_check_mail_code', getCheckMailCode);

module.exports = router;
