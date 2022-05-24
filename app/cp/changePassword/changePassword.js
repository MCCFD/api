const { checkNull, checkSESSDATA, getEnPassword, resUtile } = require('../../../utils/box');
const { reqLog, otherLog } = require('../../../utils/log');
const { getChangePasswordInfo, updateUserPassword, delChangePasswordInfo } = require('../../../utils/mysql');

/**
 * 修改密码
 * /api/cp/change_password
 * 参数: sessdata, key, password
 */
const changePassword = async (req, res) => {
    reqLog(res);
    otherLog('修改密码 /api/cp/change_password');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const sessdata = req.body.sessdata;
    const key = String(req.body.key).toUpperCase();
    const password = req.body.password;
    if (checkNull([sessdata, key, password], res) == null) return;

    // 校验SESSDATA 获取userID
    const checkSESSDATA_data = checkSESSDATA(sessdata, res);
    if (checkSESSDATA_data == 'Error') return;
    const userID = checkSESSDATA_data.userID;

    // 校验userID key
    try {
        const getChangePasswordInfo_data = await getChangePasswordInfo(userID);
        if (key != getChangePasswordInfo_data.key) {
            otherLog('验证码已过期，请重新获取');
            resUtile(res, 400, '验证码已过期，请重新获取', '');
            return;
        };
    } catch(e) {
        otherLog('校验userID key 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 密码加盐
    const [enPassword, salf] = getEnPassword(password);

    // 删除修改密码信息
    try {
        await delChangePasswordInfo(userID, key);
    } catch(e) {
        otherLog('删除修改密码信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 更新数据库
    try {
        await updateUserPassword(userID, enPassword, salf);
    } catch(e) {
        otherLog('更新数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    resUtile(res, 200, '', '');
};

module.exports = changePassword;
