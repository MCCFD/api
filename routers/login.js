const express = require('express');
const router = express.Router();

const login = require('../app/login');

/**
 * 登陆
 * /api/login
 * 参数: mail, password, reCaptchaKey
 */
router.post('/', login);

module.exports = router;
