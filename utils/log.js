const { dev } = require('./getConfig');

const getNowTime = () => String(Date.now());

/**
 * 请求日志
 * @param {Request} req Request
 */
const reqLog = (req) => {
    if (dev) return;

    const headers = req.headers; //请求头
    const body = req.body; //参数 { mail: 'qiaoshouzi@hgy.ooo' }
    const baseUrl = req.baseUrl; // `/api/login`
    const hostname = req.hostname; //192.168.1.133
    const httpVersion = req.httpVersion //1.1
    const method = req.method; //POST
    const originalUrl = req.originalUrl; // `/api/login`

    var log = {
        headers: {},
        body: {},
        baseUrl,
        hostname,
        httpVersion,
        method,
        originalUrl,
        nowTime: getNowTime()
    };

    for (var i in headers) log.headers[i] = headers[i];
    for (var i in body) log.body[i] = body[i];

    console.log('--------------- reqLog ---------------');
    console.log(log);
    console.log('--------------- reqLog ---------------');
};

/**
 * 返回日志
 * @param {Number} code 返回code
 * @param {String} msg 返回msg
 * @param {*} data 返回data
 */
const resLog = (code, msg, data) => {
    if (dev) return;

    const log = {
        code,
        msg,
        data,
        nowTime: getNowTime()
    };

    console.log('--------------- resLog ---------------');
    console.log(log);
    console.log('--------------- resLog ---------------');
};

/**
 * 其他日志
 * @param {String} msg Message
 * @param {String} tag (选) Tag
 * @param {String} type (选)日志类型 默认log (log, error, warn, info, debug)
 */
const otherLog = (msg, tag='[LOG]', type='log') => {
    if (dev) return;

    msg = `${tag}[${getNowTime()}] ${msg}`;

    switch (type) {
        case 'log':
            console.log(msg);
            return;
        case 'warn':
            console.warn(msg);
            return;
        case 'error':
            console.error(msg);
            return;
        case 'info':
            console.info(msg);
            return;
        case 'debug':
            console.debug(msg);
            return;
        default:
            console.log(msg);
            return;
    };
};

module.exports = {
    reqLog,
    otherLog,
    resLog
};
