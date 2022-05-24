const fs = require('fs');
const jsonplus = require('jsonplus');

const { checkNull, checkSESSDATA, parseServe, resUtile } = require('../../utils/box');
const { addDNS } = require('../../utils/aliAPI');
const { reqLog, otherLog } = require('../../utils/log');
const {
    getUserInfo,
    checkDomain,
    getUserResolution,
    addResolution,
} = require('../../utils/mysql');
const { IPDomainName } = require('../../utils/getConfig');

const reservedDomainList = jsonplus.parse(fs.readFileSync('./data/reserved_domain_list.json', 'utf8')).data;

/**
 * 新增解析
 * /api/cp/add_resolution
 * 参数: sessdata, note, prefix, serve, servePort
 */
const addResolutionF = async(req, res) => {
    reqLog(req);
    otherLog('新增解析 /api/cp/add_resolution');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const sessdata = req.body.sessdata;
    const note = req.body.note;
    const prefix = req.body.prefix;
    const serve = req.body.serve;
    const servePort = Number(req.body.servePort);
    const serveType = parseServe(serve);
    if (checkNull([sessdata, note, prefix, serve, servePort], res) == null) return;
    if (
        prefix.search(/^[a-z|A-Z|0-9|\u4e00-\u9fa5|\-|_]{3,63}$/) != 0 ||
        servePort <= 0 ||
        servePort >= 65535 ||
        servePort.toString().search(/^[0-9]+$/) != 0 ||
        serveType == '?'
    ) {
        otherLog('特殊参数错误 | prefix: '+prefix+' | serve: '+serve+' | servePort: '+servePort, '[checkP][Error]');
        resUtile(res, 400, '参数错误', '');
        return;
    } else if (reservedDomainList.indexOf(prefix) != -1) {
        otherLog('域名 '+prefix+' 为保留域名', '[checkP][Error]');
        resUtile(res, 400, '该域名已被注册', '');
        return;
    };

    // 校验SESSDATA 获取userID
    const checkSESSDATA_data = checkSESSDATA(sessdata, res);
    if (checkSESSDATA_data == 'Error') return;
    const userID = checkSESSDATA_data.userID;

    // 通过用户ID从数据库获取用户信息
    var maxResolution;
    try {
        const getUserInfo_data = await getUserInfo(userID);
        maxResolution = Number(getUserInfo_data.max_resolution);
    } catch (e) {
        otherLog('通过用户ID从数据库获取用户信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过用户ID从数据库获取用户信息 | maxResolution: '+maxResolution);

    // 通过用户ID从数据库获取解析列表
    try {
        const getUserResolution_data = await getUserResolution(userID);
        if (getUserResolution_data.length >= maxResolution) {
            otherLog('解析数量达上限');
            resUtile(res, 400, '您的解析数量已到达上线, 请删除不必要的解析后重试', '');
            return;
        };
    } catch (e) {
        otherLog('通过用户ID从数据库获取解析列表 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 检查域名是否被占用
    try {
        const checkDomain_data = await checkDomain(prefix);
        if (checkDomain_data == true) {
            otherLog('域名被占用');
            resUtile(res, 400, '该域名已被注册', '');
            return;
        };
    } catch (e) {
        otherLog('检查域名是否被占用 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    if (serveType == 'domain') {
        otherLog('新增SRV记录');
        // 请求阿里API新增SRV记录
        var domainRecordID;
        try {
            const addDNS_SRV_data = await addDNS(`_minecraft._tcp.${prefix}`, 'SRV', `0 5 ${servePort} ${serve}`);
            domainRecordID = addDNS_SRV_data;
        } catch (e) {
            otherLog('请求阿里API新增SRV记录 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '请求阿里API出现错误', '');
            return;
        };
        otherLog('请求阿里API新增SRV记录 | domainRecordID: '+domainRecordID);

        // 添加解析记录至数据库
        try {
            await addResolution(userID, note, prefix, serve, servePort, domainRecordID);
        } catch (e) {
            otherLog('添加解析记录至数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '数据库出现错误', '');
            return;
        };
    } else {
        otherLog('新增A/AAAA记录');
        // 请求阿里API新增A/AAAA记录
        var IPRecordID;
        try {
            const addDNS_IP_data = await addDNS(prefix, serveType, serve, true);
            IPRecordID = addDNS_IP_data;
        } catch (e) {
            otherLog('请求阿里API新增A/AAAA记录 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '请求阿里API出现错误', '');
            return;
        };
        otherLog('请求阿里API新增A/AAAA记录 | IPRecordID: '+IPRecordID);

        // 请求阿里API新增SRV记录
        otherLog('新增SRV记录');
        var domainRecordID;
        try {
            const addDNS_SRV_data = await addDNS(`_minecraft._tcp.${prefix}`, 'SRV', `0 5 ${servePort} ${prefix}.${IPDomainName}`);
            domainRecordID = addDNS_SRV_data;
        } catch (e) {
            otherLog('请求阿里API新增SRV记录 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '请求阿里API出现错误', '');
            return;
        };
        otherLog('请求阿里API新增SRV记录 | domainRecordID: '+domainRecordID);

        // 添加解析记录至数据库
        try {
            await addResolution(userID, note, prefix, serve, servePort, domainRecordID, IPRecordID);
        } catch (e) {
            otherLog('添加解析记录至数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '数据库出现错误', '');
            return;
        };
    };

    otherLog('新增成功');
    resUtile(res, 200, '添加成功', '');
};

module.exports = addResolutionF;
