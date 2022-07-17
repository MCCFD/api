const CryptoJS = require("crypto-js");

const { getPassword } = require('../utils/mysql');
const { reqLog, otherLog } = require('../utils/log');
const { checkNull, checkVaptcha, createJWT, resUtile } = require('../utils/box');

/**
 * 检测密码
 * @param {String} password 密码
 * @param {String} enPassword 加盐后的密码
 * @param {String} salf 盐值
 * @returns 密码是否正确
 */
const checkPassword = (password, enPassword, salf) => {
    salf = CryptoJS.enc.Hex.parse(salf); //String To Word Array
    password = CryptoJS.PBKDF2(password, salf, {
        keySize: 512 / 32,
        iterations: 1000
    }).toString();
    return password == enPassword;
};

/**
 * 登陆
 * /api/login
 * 参数: mail, password, reCaptchaKey
 */
const login = async (req, res) => {
    reqLog(req);
    otherLog('/api/login 登陆');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');
    
    const mail = req.body.mail;
    const password = req.body.password;
    const captchaServer = req.body.captchaServer;
    const captchaToken = req.body.captchaToken;
    if (checkNull([mail, password, captchaServer, captchaToken], res) == null) return;
    if (
        mail.search(/^.+@.+\.[a-z]+$/) != 0
    ) {
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

    // 从数据库获取用户信息
    var userID, enPassword, salf;
    try {
        const getPassword_data = await getPassword(mail);
        if (getPassword_data == 'NotFound') {
            otherLog('未通过邮箱找到相关用户');
            resUtile(res, 403, '邮箱/密码错误', '');
            return;
        };
        userID = getPassword_data.user_id;
        enPassword = getPassword_data.password;
        salf = getPassword_data.salf;
    } catch(e) {
        otherLog('从数据库获取用户信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    if (checkPassword(password, enPassword, salf) != true) {
        otherLog('密码错误');
        resUtile(res, 403, '邮箱/密码错误', '');
    } else {
        const sessdata = createJWT({ userID: userID });

        otherLog('登陆成功');
        resUtile(res, 200, '登陆成功', sessdata);
    };
};

module.exports = login;
