const CryptoJS = require("crypto-js");

const { sendFindEmail } = require('../../utils/mail');
const { reqLog, otherLog } = require('../../utils/log');
const { checkNull, checkVaptcha, resUtile } = require('../../utils/box');
const { checkUserInfo, addFindInfo, updateFindInfo } = require('../../utils/mysql');

/**
 * 获取邮箱验证码
 * /api/find/get_check_mail_code
 * 参数: mail, reCaptchaKey
 */
const getCheckMailCode = async (req, res) => {
    reqLog(req);
    otherLog('/api/find/get_check_mail_code 获取邮箱验证码');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const captchaServer = req.body.captchaServer;
    const captchaToken = req.body.captchaToken;
    const mail = String(req.body.mail).toLocaleLowerCase();
    if (checkNull([mail, captchaServer, captchaToken], res) == null) return;
    if (mail.search(/^.+@.+\.[a-z]+$/) != 0) {
        otherLog('特殊参数错误 | mail: '+mail, '[checkP][Error]');
        resUtile(res, 400, '参数错误', '');
        return;
    };

    // 校验Vaptcha
    try {
        const checkVaptcha_data = await checkVaptcha(captchaServer, captchaToken, 1, req, res);
        if (checkVaptcha_data == false) return;
    } catch(e) {
        return;
    };

    // 通过邮箱检查是否有该用户
    var userID, isUpdateFindInfo;
    try {
        const checkUserInfo_data = await checkUserInfo(mail);
        if (checkUserInfo_data == false) {
            otherLog('从数据库未找到该邮箱的用户');
            resUtile(res, 400, '该账号未注册', '');
            return;
        };
        if (checkUserInfo_data[0] == true) {
            otherLog('更新Key');
            isUpdateFindInfo = true;
            userID = checkUserInfo_data[1].user_id;
        } else {
            isUpdateFindInfo = false;
            userID = checkUserInfo_data.user_id;
        };
    } catch(e) {
        otherLog('通过邮箱检查是否有该用户 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过邮箱检查是否有该用户 | userID: '+userID);

    // 生成Key
    const checkMailCode = (() => {
        const key = CryptoJS.PBKDF2(userID+mail+'findPassword', CryptoJS.lib.WordArray.random(128 / 8), {
            keySize: 512 / 32,
            iterations: 1000
        }).toString().toUpperCase();
        const ran = Math.ceil(Math.random() * (key.length - 9));
        return key.substring(ran, ran + 8);
    })();

    const findTime = Math.floor(Date.now() / 1000);

    // 写入/更新数据库
    try {
        if (isUpdateFindInfo == true) {
            await updateFindInfo(checkMailCode, findTime, userID);
        } else {
            await addFindInfo(userID, mail, checkMailCode, findTime);
        };
    } catch(e) {
        otherLog('写入/更新数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 发送邮件
    try {
        await sendFindEmail(checkMailCode, mail);
    } catch(e) {
        otherLog('发送邮件 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '发送邮件时出现错误', '');
        return;
    };

    // 200
    resUtile(res, 200, '', '');
};

module.exports = getCheckMailCode;
