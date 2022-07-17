const { checkNull, checkVaptcha, getEnPassword, createJWT, resUtile } = require('../../utils/box');
const { getFindInfo, updateUserPassword, delFindInfo } = require('../../utils/mysql');
const { reqLog, otherLog } = require('../../utils/log');

/**
 * 找回密码
 * /api/find
 * 参数: key, password, reCaptchaKey
 */
const getCheckMailCode = async (req, res) => {
    reqLog(req);
    otherLog('/api/find 找回密码');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const captchaServer = req.body.captchaServer;
    const captchaToken = req.body.captchaToken;
    const key = String(req.body.key).toLocaleLowerCase();
    const password = req.body.password;
    if (checkNull([captchaServer, captchaToken, key, password], res) == null) return;
    if (key.length != 8) {
        otherLog('特殊参数错误 | key: '+key, '[checkP][Error]');
        resUtile(res, 400, '验证码错误', '');
        return;
    };
    if (
        password.search(
            /^[a-z|A-Z|0-9|,|.|/|<|>|?|;|'|:|"|[|\]|\\|{|}|||!|@|#|$|%|^|&|*|(|)|_|+|=|\-|`|~]{8,128}$/
        ) != 0
    ) {
        otherLog('特殊参数错误 | password: '+password, '[checkP][Error]');
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

    // 通过Key获取userID, Mail
    var userID, mail;
    try {
        const getFindInfo_data = await getFindInfo(key);
        if (getFindInfo_data == false) {
            otherLog('从数据库未找到找回密码记录');
            resUtile(res, 403, '验证码错误', '');
            return;
        };
        userID = getFindInfo_data.user_id;
        mail = getFindInfo_data.mail;
    } catch(e) {
        otherLog('通过Key获取userID, Mail 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过Key获取到 | userID: '+userID+', mail: '+mail);

    // 删除找回信息
    try {
        await delFindInfo(key);
        otherLog('删除找回记录成功');
    } catch(e) {
        otherLog('删除找回信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 对新密码加盐
    const [enPassword, salf] = getEnPassword(password);

    // 更新数据库
    try {
        await updateUserPassword(userID, enPassword, salf);
        otherLog('更新数据库成功');
    } catch(e) {
        otherLog('更新数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    const sessdata = createJWT({ userID: userID });
    otherLog('找回密码成功');
    resUtile(res, 200, '', sessdata);
};

module.exports = getCheckMailCode;
