const axios = require('axios');
const CryptoJS = require("crypto-js");
const jwt = require('jsonwebtoken');
const fs = require('fs');

const { otherLog, resLog } = require('./log');
const { dev, reCaptchaServeKey } = require('./getConfig');

const privateKey = fs.readFileSync('data/private.key');
const publicKey = fs.readFileSync('data/public.pem');

/**
 * resUtils
 * @param {Response} res Response
 * @param {Number} code code
 * @param {String} msg msg
 * @param {*} data data
 */
const resUtile = (res, code, msg, data) => {
    resLog(code, msg, data);
    res.end(JSON.stringify({
        'code': code,
        'msg': msg,
        'data': data
    }));
};

/**
 * 获取访问IP
 * @param {Response} req Response 
 * @returns IP
 */
const getIP = (req) => {
    if (dev == true) {
        return '127.0.0.1';
    } else if (dev == false) {
        return req.headers['x-forwarded-for'];
    };
};

/**
 * 检查数据是否不存在
 * @param {List} data 需要检测的数据
 * @param {Response} res Response
 * @returns null
 */
const checkNull = (data, res) => {
    for (const i in data) {
        if (
            data[i] == undefined ||
            data[i] == null ||
            data[i] == NaN ||
            data[i] == "" ||
            data[i] == "undefined" ||
            data[i] == 'NaN'
        ) {
            otherLog(`参数错误 | ${i} 为 `+data[i], '[checkNull]');
            resUtile(res, 400, '参数错误', '');
            return null;
        };
    };
    return data;
};

/**
 * 校验reCaptchaKey
 * @param {String} reCaptchaKey reCaptchaKey
 * @param {Request} req Request
 * @param {Response} res Response
 */
const checkReCaptchaKey = async (reCaptchaKey, req, res) => {
    const params = new URLSearchParams();
    params.append('secret', reCaptchaServeKey);
    params.append('response', reCaptchaKey);
    params.append('remoteip', getIP(req));

    try {
        const req = await axios.post('https://www.google.com/recaptcha/api/siteverify', params);
        if (req.status == 200) {
            if (req.data.success != true) {
                otherLog(`reCaptcha 验证失败 ${String(req.data['error-codes'])}`, '[reCaptcha]');
                resUtile(res, 403, `reCaptcha 验证失败 ${String(req.data['error-codes'])}`, '');
                return Promise.resolve(false);
            } else {
                otherLog('reCaptcha 验证成功', '[reCaptcha]');
                return Promise.resolve(true);
            };
        } else {
            otherLog(
                `请求 reCaptcha API 失败, Status Error ${req.status}`,
                '[reCaptcha][Error]',
                'error'
            );
            throw new Error('Status Error ' + req.status);
        };
    } catch(e) {
        otherLog(
            '请求 reCaptcha API 失败, ErrorMessage '+e.message,
            '[reCaptcha][Error]',
            'error'
        );
        resUtile(res, 500, '服务器请求 reCaptcha API 错误', '');
        return Promise.reject(e);
    };
};

/**
 * 密码加盐
 * @param {String} password 加盐前的密码
 * @returns [enPassword, salf]
 */
const getEnPassword = (password) => {
    const salf = CryptoJS.lib.WordArray.random(128 / 8); //生成盐值
    const enPassword = CryptoJS.PBKDF2(password, salf, {
        keySize: 512 / 32,
        iterations: 1000
    }).toString();
    
    return [enPassword, salf.toString()];
};

/**
 * JWT 签名
 * @param {JSON} data 数据
 * @param {Number} exTime (选) 有效期，默认一小时
 * @returns Token
 */
const createJWT = (data, exTime = 60 * 60) => {
    return token = jwt.sign(
        data, privateKey, {
            algorithm: 'RS256',
            expiresIn: exTime //60*60 1小时
        }
    );
};

/**
 * JWT 校验
 * @param {String} token Token
 * @returns data
 */
const verifyJWT = (token) => {
    try {
        const data = jwt.verify(token, publicKey);
        return data;
    } catch(e) {
        return ['Error', e];
    };
};

/**
 * 校验SESSDATA，返回用户信息
 * @param {String} SESSDATA SESSDATA
 * @param {Response} res res
 */
 const checkSESSDATA = (SESSDATA, res) => {
    const verifyJWT_data = verifyJWT(SESSDATA);
    if (verifyJWT_data[0] == 'Error') {
        resUtile(res, 403, 'SESSDATA 过期, 请重新登陆', '');
        return 'Error';
    };
    return verifyJWT_data;
};

/**
 * 解析serve
 * @param {String} serve 域名/IP
 * @returns v4/v6/domain/?
 */
const parseServe = (serve) => {
    if (
        serve.search(
            /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/
        ) == 0
    ) {
        return 'v4';
    } else if (
        serve.search(
            /^([\da-fA-F]{1,4}:){6}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^::([\da-fA-F]{1,4}:){0,4}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:):([\da-fA-F]{1,4}:){0,3}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){2}:([\da-fA-F]{1,4}:){0,2}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){3}:([\da-fA-F]{1,4}:){0,1}((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){4}:((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$|^([\da-fA-F]{1,4}:){7}[\da-fA-F]{1,4}$|^:((:[\da-fA-F]{1,4}){1,6}|:)$|^[\da-fA-F]{1,4}:((:[\da-fA-F]{1,4}){1,5}|:)$|^([\da-fA-F]{1,4}:){2}((:[\da-fA-F]{1,4}){1,4}|:)$|^([\da-fA-F]{1,4}:){3}((:[\da-fA-F]{1,4}){1,3}|:)$|^([\da-fA-F]{1,4}:){4}((:[\da-fA-F]{1,4}){1,2}|:)$|^([\da-fA-F]{1,4}:){5}:([\da-fA-F]{1,4})?$|^([\da-fA-F]{1,4}:){6}:$/
        ) == 0
    ) {
        return 'v6';
    } else if (serve.search(/^.+\..+$/) == 0) {
        return 'domain';
    } else {
        return '?';
    };
};

/**
 * 获取当前UTC时间戳
 * @returns {String} NowUTCTime
 */
const getNowUTCTime = () => {
    const nowTime = new Date();
    return nowTime.getTime() + (nowTime.getTimezoneOffset() * 60000);
};

module.exports = {
    resUtile,
    getIP,
    checkNull,
    checkReCaptchaKey,
    getEnPassword,
    createJWT,
    verifyJWT,
    checkSESSDATA,
    parseServe,
    getNowUTCTime,
};
