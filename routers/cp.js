const express = require('express');
const router = express.Router();

const cp = require('../app/cp/cp');
const addResolutionF = require('../app/cp/addResolution');
const updateResolution = require('../app/cp/updateResolution');
const delResolution = require('../app/cp/delResolution');
const changePassword = require('../app/cp/changePassword/changePassword');
const changePassword_getCheckMailCode = require('../app/cp/changePassword/getCheckMailCode');

/**
 * 获取用户信息
 * /api/cp
 * 参数: sessdata
 */
router.post('/', cp);

/**
 * 新增解析
 * /api/cp/add_resolution
 * 参数: sessdata, note, prefix, serve, servePort
 */
router.post('/add_resolution', addResolutionF);

/**
 * 更新解析
 * /api/cp/update_resolution
 * 参数: sessdata, udid, note, prefix, serve, servePort
 */
router.post('/update_resolution', updateResolution);

/**
 * 删除解析
 * /api/cp/del_resolution
 * 参数: sessdata, udid
 */
router.post('/del_resolution', delResolution);

/**
 * 修改密码
 * /api/cp/change_password
 * 参数: sessdata, key, password
 */
router.post('/change_password', changePassword);

/**
 * 修改密码 获取邮箱验证码
 * /api/cp/change_password/get_check_mail_code
 * 参数: sessdata
 */
router.post('/change_password/get_check_mail_code', changePassword_getCheckMailCode);

module.exports = router;
