const CryptoJS = require("crypto-js");

const { checkNull, checkSESSDATA, resUtile } = require('../../../utils/box');
const { sendChangePasswordEmail } = require('../../../utils/mail');
const { reqLog, otherLog } = require('../../../utils/log');
const { getUserInfo, getChangePasswordInfo, addChangePasswordInfo } = require('../../../utils/mysql');

/**
 * 修改密码 获取邮箱验证码
 * /api/cp/change_password/get_check_mail_code
 * 参数: sessdata
 */
const changePassword_getCheckMailCode = async (req, res) => {
    reqLog(res);
    otherLog('修改密码 获取邮箱验证码 /api/cp/change_password/get_check_mail_code');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const sessdata = req.body.sessdata;
    if (checkNull([sessdata], res) == null) return;

    // 校验SESSDATA 获取userID
    const checkSESSDATA_data = checkSESSDATA(sessdata, res);
    if (checkSESSDATA_data == 'Error') return;
    const userID = checkSESSDATA_data.userID;

    // 通过userID获取用户信息
    var mail;
    try {
        const getUserInfo_data = await getUserInfo(userID);
        mail = getUserInfo_data.mail;
    } catch(e) {
        otherLog('通过userID获取用户信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过userID获取用户信息 | mail: '+mail);

    // 通过用户ID从数据库读取修改密码记录
    var key, changePasswordTime, isUpdate;
    try {
        const getChangePasswordInfo_data = await getChangePasswordInfo(userID);
        // 数据库中没有记录, 生成
        otherLog('数据库中没有记录, 生成');
        if (getChangePasswordInfo_data == false) {
            isUpdate = false;
            key = (() => {
                const key = CryptoJS.PBKDF2(sessdata+userID+mail+'changePassword', CryptoJS.lib.WordArray.random(128 / 8), {
                    keySize: 512 / 32,
                    iterations: 1000
                }).toString().toUpperCase();
                const ran = Math.ceil(Math.random() * (key.length - 9));
                return key.substring(ran, ran + 8);
            })();
            changePasswordTime = Math.floor(Date.now() / 1000);
        } else {
            // 数据库中有记录
            otherLog('数据库中有记录');
            isUpdate = true;
            key = getChangePasswordInfo_data.key;
            changePasswordTime = getChangePasswordInfo_data.time;
        };
    } catch(e) {
        otherLog('通过用户ID从数据库读取修改密码记录 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过用户ID从数据库读取修改密码记录 | key: '+key+' | changePasswordTime: '+changePasswordTime+' | isUpdate: '+isUpdate);

    if (isUpdate == false) {
        // 新增数据至数据库
        try {
            await addChangePasswordInfo(userID, key, changePasswordTime);
        } catch(e) {
            otherLog('新增数据至数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '数据库出现错误', '');
            return;
        };
    };

    // 发送邮件
    try {
        await sendChangePasswordEmail(key, mail);
        resUtile(res, 200, '', '');
    } catch(e) {
        otherLog('发送邮件 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '发送邮件时出现错误', '');
    };
};

module.exports = changePassword_getCheckMailCode;
