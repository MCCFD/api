const fs = require('fs');
const jsonplus = require('jsonplus');

const { checkNull, checkSESSDATA, parseServe, resUtile } = require('../../utils/box');
const { addDNS, delDNS, updateDNS } = require('../../utils/aliAPI');
const { reqLog, otherLog } = require('../../utils/log');
const {
    checkDomain,
    getUserDomainInfo,
    updateUserDomainInfo,
} = require('../../utils/mysql');
const { IPDomainName } = require('../../utils/getConfig');

const reservedDomainList = jsonplus.parse(fs.readFileSync('./data/reserved_domain_list.json', 'utf8')).data;

/**
 * 更新解析
 * /api/cp/update_resolution
 * 参数: sessdata, udid, note, prefix, serve, servePort
 */
const updateResolution = async (req, res) => {
    reqLog(req);
    otherLog('更新解析 /api/cp/update_resolution');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const sessdata = req.body.sessdata;
    const udID = Number(req.body.udid);
    const note = req.body.note;
    const domain = req.body.prefix;
    const serve = req.body.serve;
    const servePort = Number(req.body.servePort);
    const serveType = parseServe(serve);
    if (checkNull([sessdata, udID, note, domain, serve, servePort], res) == null) return;
    if (
        domain.search(/^[a-z|A-Z|0-9|\u4e00-\u9fa5|\-|_]{3,63}$/) != 0 ||
        servePort <= 0 ||
        servePort >= 65535 ||
        String(servePort).search(/^[0-9]+$/) != 0 ||
        serveType == '?'
    ) {
        otherLog('特殊参数错误 | domain: '+domain+' | serve: '+serve+' | servePort: '+servePort, '[checkP][Error]');
        resUtile(res, 400, '参数错误', '');
        return;
    } else if (reservedDomainList.indexOf(domain) != -1) {
        otherLog('域名为保留域名 | domain: '+domain, '[checkP][Error]');
        resUtile(res, 400, '该域名已被注册', '');
        return;
    };

    // 校验SESSDATA 获取userID
    const checkSESSDATA_data = checkSESSDATA(sessdata, res);
    if (checkSESSDATA_data == 'Error') return;
    const userID = checkSESSDATA_data.userID;

    // 通过udID从数据库获取解析信息
    var oldNote, oldDomain, oldServe, oldServePort, oldServeType, domainRecordID, IPDomainRecordID;
    try {
        const getUserDomainInfo_data = await getUserDomainInfo(userID, udID);
        if (getUserDomainInfo_data == 'ok?') {
            otherLog('彩蛋 更新失败');
            resUtile(res, 200, '更新成功!!!!!!!!', '');
            return;
        };
        oldNote = getUserDomainInfo_data.note;
        oldDomain = getUserDomainInfo_data.domain;
        oldServe = getUserDomainInfo_data.serve;
        oldServePort = getUserDomainInfo_data.serve_port;
        oldServeType = parseServe(oldServe);
        domainRecordID = getUserDomainInfo_data.domain_record_id;
        IPDomainRecordID = getUserDomainInfo_data.ip_domain_record_id;
    } catch(e) {
        otherLog('通过udID从数据库获取解析信息 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };
    otherLog('通过udID从数据库获取解析信息 | oldNote: '+oldNote+', oldDomain: '+oldDomain+', oldServe: '+oldServe+', oldServePort: '+oldServePort+', oldServeType: '+oldServeType+', domainRecordID: '+domainRecordID+', IPDomainRecordID: '+IPDomainRecordID);

    // 没有修改
    if (oldNote == note && oldDomain == domain && oldServe == serve && oldServePort == servePort) {
        otherLog('没有修改');
        resUtile(res, 200, '', '');
        return;
    };

    // 流程
    var process = {
        updateDomain: false, //更新域名
        IPDomain: '', //update|del|add 处理IP域名
        checkServePort: servePort != oldServePort //校验服务器端口
    };

    // 校验domain
    if (domain != oldDomain) {
        otherLog('域名更新，检查是否被占用');
        try {
            const checkDomain_data = await checkDomain(domain);
            if (checkDomain_data == true) {
                otherLog('已被占用');
                resUtile(res, 400, '该域名已被使用', '');
                return;
            };
            process.updateDomain = true;
            process.IPDomain = 'update';
        } catch(e) {
            otherLog('检查是否被占用 出现错误 | '+e.message, '[LOG][Error]', 'error');
            resUtile(res, 500, '请求阿里API出现错误', '');
            return; 
        };
    };

    // 校验服务器IP/域名
    if (serve != oldServe) {
        otherLog('serve更新 old: '+oldServe+'new: '+serve);
        if (
            oldServeType == 'domain' &&
            (serveType == 'v4' || serveType == 'v6')
        ) {
            // 域名 -> IP
            process.IPDomain = 'add';
            process.updateDomain = true;
        } else if (
            oldServeType == 'domain' &&
            serveType == 'domain'
        ) {
            // 域名 -> 域名
            process.updateDomain = true;
        } else if (
            (oldServeType == 'v4' || oldServeType == 'v6') &&
            (serveType == 'v4' || serveType == 'v6')
        ) {
            // IP -> IP
            process.IPDomain = 'update';
            process.checkServePort = true;
        } else if (
            (oldServeType == 'v4' || oldServeType == 'v6') &&
            serveType == 'domain'
        ) {
            // IP -> 域名
            process.IPDomain = 'del';
            process.updateDomain = true;
        };
    };

    // 校验服务器端口
    if (process.checkServePort) {
        otherLog('服务器端口更新');
        process.updateDomain = true;
    };

    otherLog('流程: ', process);

    // 请求阿里API
    try {
        // 处理IP域名
        if (process.IPDomain == 'update' && serveType != 'domain') {
            // 更新IP域名
            await updateDNS(IPDomainRecordID, domain, serveType, serve);
        } else if (process.IPDomain == 'add' && serveType != 'domain') {
            // 新增IP域名
            const addDNS_data = await addDNS(domain, serveType, serve, true);
            IPDomainRecordID = String(addDNS_data);
        } else if (process.IPDomain == 'del') {
            // 删除IP域名
            await delDNS(IPDomainRecordID);
        };

        // 更新域名
        if (process.updateDomain) {
            if (serveType == 'domain') {
                await updateDNS(domainRecordID, `_minecraft._tcp.${domain}`, 'SRV', `0 5 ${servePort} ${serve}`);
            } else {
                await updateDNS(domainRecordID, `_minecraft._tcp.${domain}`, 'SRV', `0 5 ${servePort} ${domain}.${IPDomainName}`);
            };
        };
    } catch(e) {
        otherLog('请求阿里API 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '请求阿里API出现错误', '');
        return;
    };

    // 更新数据库
    try {
        await updateUserDomainInfo(udID, note, domain, serve, servePort, IPDomainRecordID);
        otherLog('更新成功');
        resUtile(res, 200, '', '');
    } catch(e) {
        otherLog('更新数据库 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '更新数据库错误', '');
    };
};

module.exports = updateResolution;
