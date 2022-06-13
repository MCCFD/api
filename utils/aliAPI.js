const Core = require('@alicloud/pop-core');

const { otherLog } = require('./log');
const { aliyunConfig, IPDomainName } = require('./getConfig');

const accessKeyId = aliyunConfig.accessKeyId;
const accessKeySecret = aliyunConfig.accessKeySecret;
const client = new Core({
    accessKeyId: accessKeyId,
    accessKeySecret: accessKeySecret,
    // https://alidns.cn-hongkong.aliyuncs.com 香港
    // https://alidns.cn-shanghai.aliyuncs.com 香港
    endpoint: 'https://alidns.cn-hongkong.aliyuncs.com',
    apiVersion: '2015-01-09'
});
const requestOption = {
    method: 'POST',
    formatParams: false
};
const TTL = 1;

/**
 * 标准化解析类型名
 * @param {String} type 
 * @returns 标准解析类型名
 */
const getType = (type) => {
    switch (type) {
        case 'v4':
            return 'A';
        case 'v6':
            return 'AAAA';
        default:
            return type.toUpperCase();
    };
};

/**
 * 新增解析
 * @param {String} prefix 域名前缀
 * @param {String} type v4/v6/A/AAAA/SRV/...
 * @param {String} value 记录值
 * @param {String} IPDomain (选)是否使用IPDomain 默认false
 */
const addDNS = async(prefix, type, value, IPDomain = false) => {
    otherLog(`新增解析 ${prefix} ${type} ${value} | IPDomain: ${IPDomain}`, '[AliAPI][DNS]');
    var DomainName;
    if (IPDomain) {
        DomainName = IPDomainName;
    } else {
        DomainName = "mc.cfd";
    }
    const params = {
        "RR": prefix,
        "DomainName": DomainName,
        "Type": getType(type),
        "Value": value,
        "TTL": TTL
    };

    try {
        const reqData = await client.request('AddDomainRecord', params, requestOption);
        return Promise.resolve(reqData.RecordId);
    } catch (e) {
        otherLog(
            '新增解析失败 '+e.message,
            '[AliAPI][DNS][Error]',
            'error'
        );
        return Promise.reject(e);
    };
};

/**
 * 删除解析记录
 * @param {Number} RecordId 解析ID
 */
const delDNS = async(RecordId) => {
    otherLog(`删除解析 ${RecordId}`, '[AliAPI][DNS]');
    const params = {
        "RecordId": RecordId
    };

    try {
        await client.request('DeleteDomainRecord', params, requestOption);
        return Promise.resolve(true);
    } catch (e) {
        otherLog(
            '删除解析失败 '+e.message,
            '[AliAPI][DNS][Error]',
            'error'
        );
        return Promise.reject(e);
    };
};

/**
 * 更新解析记录
 * @param {Number} RecordId 解析ID
 * @param {String} prefix 域名前缀
 * @param {String} type v4/v6/A/AAAA/SRV/...
 * @param {String} value 记录值
 */
const updateDNS = async(RecordId, prefix, type, value) => {
    otherLog(`更新解析 ${RecordId} ${prefix} ${type} ${value}`, '[AliAPI][DNS]');
    var params = {
        "RecordId": RecordId,
        "RR": prefix,
        "Type": getType(type),
        "Value": value,
        "TTL": TTL
    };

    try {
        await client.request('UpdateDomainRecord', params, requestOption);
        return Promise.resolve(true);
    } catch (e) {
        otherLog(
            '更新解析失败 '+e.message,
            '[AliAPI][DNS][Error]',
            'error'
        );
        return Promise.reject(e);
    };
};

module.exports = {
    addDNS,
    delDNS,
    updateDNS,
};