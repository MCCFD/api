const { checkNull, checkSESSDATA, parseServe, resUtile } = require('../../utils/box');
const { delDNS } = require('../../utils/aliAPI');
const { reqLog, otherLog } = require('../../utils/log');
const { delUserDomain, getUserDomainInfo } = require('../../utils/mysql');

/**
 * 删除解析
 * /api/cp/del_resolution
 * 参数: sessdata, udid
 */
const delResolution = async (req, res) => {
    reqLog(res);
    otherLog('删除解析 /api/cp/del_resolution');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const sessdata = req.body.sessdata;
    const udID = Number(req.body.udid);
    if (checkNull([sessdata, udID], res) == null) return;

    // 校验SESSDATA 获取userID
    const checkSESSDATA_data = checkSESSDATA(sessdata, res);
    if (checkSESSDATA_data == 'Error') return;
    const userID = checkSESSDATA_data.userID;

    // 通过udID从数据库获取解析信息
    var serveType, domainRecordID, IPDomainRecordID;
    try {
        const getUserDomainInfo_data = await getUserDomainInfo(userID, udID);
        if (getUserDomainInfo_data == 'ok?') {
            otherLog('彩蛋 删除失败');
            resUtile(res, 200, '删除成功!!!!!!!!', '');
            return;
        };
        serveType = parseServe(getUserDomainInfo_data.serve);
        domainRecordID = getUserDomainInfo_data.domain_record_id;
        IPDomainRecordID = getUserDomainInfo_data.ip_domain_record_id;
    } catch(e) {
        otherLog('通过udID从数据库获取解析信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过udID从数据库获取解析信息 | serveType: '+serveType+', domainRecordID: '+domainRecordID+', IPDomainRecordID: '+IPDomainRecordID);

    // 删除域名
    otherLog('删除域名')
    try {
        await delDNS(domainRecordID);
    } catch(e) {
        otherLog('删除域名 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '请求阿里API出现错误', '');
        return;
    };

    // 删除IP域名
    otherLog('删除IP域名');
    if (serveType != 'domain') {
        try {
            await delDNS(IPDomainRecordID);
        } catch(e) {
            otherLog('删除IP域名 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '请求阿里API出现错误', '');
            return;
        };
    };

    // 删除数据库数据
    otherLog('删除数据库数据');
    try {
        await delUserDomain(udID);
        resUtile(res, 200, '', '');
    } catch(e) {
        otherLog('删除数据库数据 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
    };
};

module.exports = delResolution;
