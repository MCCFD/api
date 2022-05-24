const { checkNull, checkSESSDATA, resUtile } = require('../../utils/box');
const { reqLog, otherLog } = require('../../utils/log');
const { getUserInfo, getUserResolution } = require('../../utils/mysql');

/**
 * 获取用户信息
 * /api/cp
 * 参数: sessdata
 */
const cp = async (req, res) => {
    reqLog(req);
    otherLog('获取用户信息 /api/cp');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const sessdata = req.body.sessdata;
    if (checkNull([sessdata], res) == null) return;

    // 校验SESSDATA 获取userID
    const checkSESSDATA_data = checkSESSDATA(sessdata, res);
    if (checkSESSDATA_data == 'Error') return;
    const userID = checkSESSDATA_data.userID;

    // 通过用户ID从数据库获取用户信息
    var mail, name, maxResolution;
    try {
        const getUserInfo_data = await getUserInfo(userID);
        mail = getUserInfo_data.mail;
        name = getUserInfo_data.name;
        maxResolution = getUserInfo_data.max_resolution;
    } catch(e) {
        otherLog('通过用户ID从数据库获取用户信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过用户ID从数据库获取用户信息 | mail: '+mail+', name: '+name+', maxResolution: '+maxResolution);

    // 通过用户ID从数据库获取解析列表
    var resolutionList = [];
    try {
        const getUserResolution_data = await getUserResolution(userID);
        for (var i in getUserResolution_data) {
            resolutionList.push({
                RID: getUserResolution_data[i].ud_id,
                note: getUserResolution_data[i].note,
                domain_prefix: getUserResolution_data[i].domain,
                serve: getUserResolution_data[i].serve,
                serve_port: getUserResolution_data[i].serve_port
            });
        };
    } catch(e) {
        otherLog('通过用户ID从数据库获取解析列表 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过用户ID从数据库获取解析列表 | resolutionList: '+resolutionList);

    // 200
    resUtile(res, 200, '', {
        user: {
            UID: userID,
            name: name,
            mail: mail
        },
        resolution: {
            max: maxResolution,
            data: resolutionList
        }
    });
};

module.exports = cp;
