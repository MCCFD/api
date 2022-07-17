const fs = require('fs');
const jsonplus = require('jsonplus');
const CryptoJS = require("crypto-js");

const { reqLog, otherLog } = require('../../utils/log');
const { sendRegisteredEmail } = require('../../utils/mail');
const { checkNull, checkVaptcha, resUtile } = require('../../utils/box');
const {
    checkMail,
    addRegisteredInfo,
    updateRegisteredInfo
} = require('../../utils/mysql');

const blackMailList = jsonplus.parse(fs.readFileSync('./data/black_mail_list.json', 'utf8'));

/**
 * 获取邮箱验证码
 * /api/registered/get_check_mail_code
 * 参数: mail, reCaptchaKey
 */
const getCheckMailCode = async (req, res) => {
    reqLog(req);
    otherLog('/api/registered/get_check_mail_code 获取邮箱验证码');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const captchaServer = req.body.captchaServer;
    const captchaToken = req.body.captchaToken;
    const mail = String(req.body.mail).toLowerCase();
    if (checkNull([mail, captchaServer, captchaToken], res) == null) return;
    if (mail.search(/^.+@.+\.[a-z]+$/) != 0) {
        otherLog('特殊参数错误 | mail: '+mail, '[checkP][Error]');
        resUtile(res, 400, '参数错误', '');
        return;
    };
    if (blackMailList.suffix.indexOf(mail.split("@")[mail.split("@").length - 1]) != -1) {
        otherLog('使用被拉黑邮箱后缀注册');
        resUtile(res, 400, '@'+mail.split("@")[mail.split("@").length - 1]+' 邮箱已被管理员拉入黑名单', '');
        return;
    } else if (blackMailList.mail[mail] != undefined) {
        otherLog('使用被拉黑邮箱注册');
        resUtile(res, 400, `${mail} 已被管理员拉入黑名单, 原因: ${blackMailList.mail[mail]}`, '');
        return;
    };

    // 校验Vaptcha
    try {
        const checkVaptcha_data = await checkVaptcha(captchaServer, captchaToken, 1, req, res);
        if (checkVaptcha_data == false) return;
    } catch(e) {
        return;
    };

    // 检查邮箱是否被注册
    try {
        var checkMail_data = await checkMail(mail);
        if (checkMail_data == false) {
            otherLog('邮箱已被注册');
            resUtile(res, 403, '该邮箱已被注册', '');
            return;
        };
    } catch(e) {
        otherLog('检查邮箱是否被注册 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 生成Key
    const checkMailCode = (() => {
        const key = CryptoJS.PBKDF2(mail+'registered', CryptoJS.lib.WordArray.random(128 / 8), {
            keySize: 512 / 32,
            iterations: 1000
        }).toString().toUpperCase();
        const ran = Math.ceil(Math.random() * (key.length - 9));
        return key.substring(ran, ran + 8);
    })();

    // 发送邮件
    try {
        await sendRegisteredEmail(checkMailCode, mail);
    } catch(e) {
        otherLog('发送邮件 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '发送邮件时出现错误', '');
        return;
    };

    // 获取注册时间
    const registeredTime = Math.floor(Date.now() / 1000);

    try {
        if (checkMail_data == true) {
            // 新建注册信息
            otherLog('新建注册信息');
            await addRegisteredInfo(mail, checkMailCode, registeredTime);
        } else if (checkMail_data == 'update') {
            // 更新注册信息
            otherLog('更新注册信息');
            await updateRegisteredInfo(mail, checkMailCode, registeredTime);
        };
        resUtile(res, 200, '', '');
    } catch(e) {
        otherLog('新建/更新注册信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
    };
};

module.exports = getCheckMailCode;
