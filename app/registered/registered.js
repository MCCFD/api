const { checkNull, getEnPassword, checkVaptcha, createJWT, resUtile } = require('../../utils/box');
const { reqLog, otherLog } = require('../../utils/log');
const {
    addUser,
    getRegisteredInfo,
    delRegisteredInfo,
} = require('../../utils/mysql');

/**
 * 注册
 * /api/registered
 * 参数: key, userName, password, reCaptchaKey
 */
const registered = async (req, res) => {
    reqLog(req);
    otherLog('/api/registered 注册');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const checkMailCode = String(req.body.key).toUpperCase();
    const userName = req.body.userName;
    const password = req.body.password;
    const captchaServer = req.body.captchaServer;
    const captchaToken = req.body.captchaToken;
    if (checkNull([checkMailCode, userName, password, captchaServer, captchaToken], res) == null) return;
    if (
        userName.search(/^[a-z|A-Z|\u4e00-\u9fa5|0-9|_]{4,20}$/) != 0 ||
        password.search(
            /^[a-z|A-Z|0-9|,|.|/|<|>|?|;|'|:|"|[|\]|\\|{|}|||!|@|#|$|%|^|&|*|(|)|_|+|=|\-|`|~]{8,128}$/
        ) != 0
    ) {
        otherLog('特殊参数错误 | userName: '+userName+' | password: '+password, '[checkP][Error]');
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

    // 通过key从数据库获取注册信息
    var mail;
    try {
        const getRegisteredInfo_data = await getRegisteredInfo(checkMailCode);
        if (getRegisteredInfo_data == false) {
            otherLog('从数据库未找到注册记录');
            resUtile(res, 403, '验证码错误', '');
            return;
        };
        mail = getRegisteredInfo_data.mail;
    } catch(e) {
        otherLog('通过key从数据库获取注册信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过key从数据库获取注册信息 | mail: '+mail);

    // 通过key删除数据库中的注册记录
    try {
        await delRegisteredInfo(checkMailCode);
    } catch(e) {
        otherLog('通过key删除数据库中的注册记录 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 密码加盐
    const [enPassword, salf] = getEnPassword(password);

    // 将用户信息添加至数据库
    var userID;
    try {
        const addUser_data = await addUser(mail, userName, enPassword, salf);
        userID = addUser_data;
    } catch(e) {
        otherLog('将用户信息添加至数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('将用户信息添加至数据库 | userID: '+userID);

    // 生成SESSDATA并返回
    const sessdata = createJWT({ userID: userID });
    otherLog('注册成功 | userID: '+userID+' | sessdata: '+sessdata);
    resUtile(res, 200, '注册成功', sessdata);
};

module.exports = registered;
