const mysql = require('mysql2');

const { otherLog } = require('../utils/log');
const { dbConfig } = require('./getConfig');

const connection = mysql.createConnection({
    host: dbConfig.host,
    port: dbConfig.port,
    user: dbConfig.user,
    password: dbConfig.password,
    database: dbConfig.database
});

/**
 * 执行SQL命令
 * @param {String} sql SQL命令
 * @param {String} value 参数
 */
const query = async (sql, value) => {
    otherLog(sql+' | '+value, '[DB]');
    try {
        const [rows, fields] = await connection.promise().query(sql, value);
        return Promise.resolve(rows);
    } catch(e) {
        otherLog(e.message, '[DB][Error]', 'error');
        return Promise.reject(e);
    };
};

/**
 * 通过邮箱获取用户信息
 * @param {String} mail 邮箱
 * @returns 用户信息|NotFound|Error
 */
const getPassword = async (mail) => {
    try {
        const userData = await query('SELECT * FROM `user` WHERE mail=?;', [mail]);
        if (userData.length == 1) {
            return Promise.resolve(userData[0]);
        } else {
            return Promise.resolve('NotFound');
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 检查邮箱是否被注册
 * @param {String} mail 邮箱
 */
const checkMail = async (mail) => {
    try {
        // 从用户表中查询
        const userData = await query('SELECT * FROM `user` WHERE mail=?;', [mail]);
        if (userData.length == 0) {
            // 从注册表中查询
            const registerData = await query('SELECT * FROM register WHERE mail=?;', [mail]);
            if (registerData.length == 0) {
                return Promise.resolve(true); //未注册
            } else {
                return Promise.resolve('update'); //注册中
            };
        } else {
            return Promise.resolve(false); //已被注册
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 新增注册信息
 * @param {String} mail 邮箱
 * @param {String} key Key
 * @param {Number} registeredTime 注册时间
 */
const addRegisteredInfo = async (mail, key, registeredTime) => {
    try {
        await query(
            'INSERT INTO register (mail, `key`, register_time) VALUES (?, ?, ?);',
            [mail, key, registeredTime]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 更新注册信息
 * @param {String} mail 邮箱
 * @param {String} key Key
 * @param {Number} registeredTime 注册时间
 * @param {Function} callback 回调函数
 */
const updateRegisteredInfo = async (mail, key, registeredTime, callback) => {
    try {
        await query(
            'UPDATE register SET `key` = ?, register_time = ? WHERE mail = ?;',
            [key, registeredTime, mail]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 获取注册信息
 * @param {String} key Key
 */
const getRegisteredInfo = async (key) => {
    try {
        const registeredInfo = await query('SELECT mail FROM `register` WHERE `key` = ?;', [key]);
        if (registeredInfo.length == 1) {
            return Promise.resolve(registeredInfo[0]);
        } else {
            return Promise.resolve(false);
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 新增用户
 * @param {String} mail 邮箱
 * @param {String} user_name 用户名
 * @param {String} password 加盐后的密码
 * @param {String} salf 盐值
 */
const addUser = async (mail, user_name, password, salf) => {
    try {
        // 添加用户
        await query(
            'INSERT INTO `user` (mail, `name`, `password`, salf, group_id) VALUES (?, ?, ?, ?, 1);',
            [mail, user_name, password, salf]
        );

        // 查询用户ID
        const userID = await query('SELECT user_id FROM `user` WHERE mail = ?;', [mail]);
        return Promise.resolve(userID[0].user_id);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 通过邮箱获取用户信息
 * @param {String} mail 邮箱
 */
const checkUserInfo = async (mail) => {
    try {
        const userData = await query('SELECT * FROM `user` WHERE mail = ?;', [mail]);
        if (userData.length == 1) {
            const findData = await query('SELECT * FROM `find` WHERE mail = ?;', [mail]);
            if (findData.length == 1) {
                return Promise.resolve([true, findData[0]]);
            } else {
                return Promise.resolve(userData[0]);
            };
        } else {
            return Promise.resolve(false);
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 新增找回信息
 * @param {Number} user_id userID
 * @param {String} mail 邮箱
 * @param {String} key checkMailCode
 * @param {String} find_time Key生成时间
 */
const addFindInfo = async (user_id, mail, key, find_time) => {
    try {
        await query(
            'INSERT INTO `find` (user_id, mail, `key`, find_time) VALUES (?, ?, ?, ?);',
            [Number(user_id), mail, key, String(find_time)]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 更新找回信息
 * @param {String} key checkMailCode
 * @param {Number} findTime Key生成时间
 * @param {Number} userID 用户ID
 */
const updateFindInfo = async (key, findTime, userID) => {
    try {
        await query(
            'UPDATE `find` SET `key` = ?, find_time = ? WHERE user_id = ?;',
            [key, Number(findTime), Number(userID)]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 删除找回信息
 * @param {String} key checkMailCode
 */
const delFindInfo = async (key) => {
    try {
        await query('DELETE FROM `find` WHERE `key` = ?;', [key]);
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 通过Key获取找回信息
 * @param {String} key checkMailCode
 */
const getFindInfo = async (key) => {
    try {
        const findInfo = await query('SELECT * FROM `find` WHERE `key` = ?;', [key]);
        if (findInfo.length == 1) {
            return Promise.resolve(findInfo[0]);
        } else {
            return Promise.resolve(false);
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 通过用户ID更新用户密码
 * @param {Number} userID 用户ID
 * @param {String} password 加盐后的密码
 * @param {String} salf 盐值
 */
const updateUserPassword = async (userID, password, salf) => {
    try {
        await query(
            'UPDATE `user` SET `password` = ?, `salf` = ? WHERE user_id = ?;',
            [password, salf, userID]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 通过Key删除注册记录
 * @param {String} key Key
 */
const delRegisteredInfo = async (key) => {
    try {
        await query('DELETE FROM register WHERE `key` = ?;', [key]);
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 通过用户ID获取用户信息
 * @param {Number} userID 用户ID
 * @returns 用户信息
 */
const getUserInfo = async (userID) => {
    try {
        const userData = await query(
            'SELECT u.*, g.max_resolution FROM `user` u JOIN user_group g ON u.group_id = g.group_id WHERE user_id = ?;',
            [userID]
        );
        return Promise.resolve(userData[0]);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 通过用户ID获取解析列表
 * @param {Number} userID 用户ID
 * @returns 用户解析列表
 */
const getUserResolution = async (userID) => {
    try {
        const userDomainData = await query('SELECT * FROM user_domain WHERE user_id = ?;', [userID]);
        return Promise.resolve(userDomainData);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 检查域名是否被使用
 * @param {String} domain_prefix 域名前缀
 */
const checkDomain = async (domain_prefix) => {
    try {
        const checkDomainData = await query('SELECT * FROM user_domain WHERE domain = ?;', [domain_prefix]);
        if (checkDomainData.length == 0) {
            return Promise.resolve(false); //未被占用
        } else {
            return Promise.resolve(true); //已占用
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 添加解析记录
 * @param {Number} userID 用户ID
 * @param {String} note 备注
 * @param {String} domain 域名前缀
 * @param {String} serve 服务器IPV4/IPV6
 * @param {Number} servePort 服务器端口
 * @param {String} domainRecordID 域名解析ID
 * @param {String} IPDomainRecordID (选)IP域名解析ID
 */
const addResolution = async (userID, note, domain, serve, servePort, domainRecordID, IPDomainRecordID = '') => {
    try {
        await query(
            'INSERT INTO user_domain (user_id, note, domain, serve, serve_port, domain_record_id, ip_domain_record_id) VALUES (?, ?, ?, ?, ?, ?, ?);',
            [userID, note, domain, serve, servePort, String(domainRecordID), String(IPDomainRecordID)]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 获取域名解析信息
 * @param {Number} userID 用户ID
 * @param {Number} UDID UDID
 */
const getUserDomainInfo = async (userID, UDID) => {
    try {
        const userDomainData = await query(
            'SELECT * FROM `user_domain` WHERE ud_id = ? AND user_id = ?;',
            [Number(UDID), Number(userID)]
        );
        if (userDomainData.length == 1) {
            return Promise.resolve(userDomainData[0]);
        } else {
            return Promise.resolve('ok?');
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 更新域名解析信息
 * @param {Number} udID 域名ID
 * @param {String} note 备注
 * @param {String} domain 域名前缀
 * @param {String} serve 服务器域名/IP
 * @param {Number} servePort 服务器端口
 * @param {String} IPDomainRecordID IP域名解析ID
 */
const updateUserDomainInfo = async (udID, note, domain, serve, servePort, IPDomainRecordID) => {
    try {
        await query(
            'UPDATE user_domain SET note = ?, domain = ?, serve = ?, serve_port = ?, ip_domain_record_id = ? WHERE ud_id = ?;',
            [note, domain, serve, Number(servePort), String(IPDomainRecordID), Number(udID)]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 删除域名信息
 * @param {Number} udID 域名ID
 */
const delUserDomain = async (udID) => {
    try {
        await query('DELETE FROM user_domain WHERE ud_id = ?;', [Number(udID)]);
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 通过用户ID获取修改密码记录
 * @param {Number} userID 用户ID
 * @returns checkMailCode / false | error
 */
const getChangePasswordInfo = async (userID) => {
    try {
        const changePasswordInfo = await query('SELECT * FROM change_password WHERE user_id = ?;', [Number(userID)]);
        if (changePasswordInfo.length == 1) {
            return Promise.resolve(changePasswordInfo[0]);
        } else if (changePasswordInfo.length == 0) {
            return Promise.resolve(false);
        };
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 新增changPasswordInfo
 * @param {Number} userID 用户ID
 * @param {String} key Key
 * @param {Number} time Key生成时间
 * @returns true | error
 */
const addChangePasswordInfo = async (userID, key, time) => {
    try {
        await query(
            'INSERT INTO change_password (user_id, `key`, `time`) VALUES (?, ?, ?);',
            [Number(userID), key, Number(time)]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

/**
 * 删除修改密码信息
 * @param {Number} userID 用户ID
 * @param {String} key Key
 * @returns true | error
 */
const delChangePasswordInfo = async (userID, key) => {
    try {
        await query(
            'DELETE FROM change_password WHERE user_id=? AND `key`=?;',
            [Number(userID), key]
        );
        return Promise.resolve(true);
    } catch(e) {
        return Promise.reject(e);
    };
};

module.exports = {
    // login
    getPassword,
    // registered
    checkMail,
    addRegisteredInfo,
    updateRegisteredInfo,
    getRegisteredInfo,
    delRegisteredInfo,
    addUser,
    // find
    checkUserInfo,
    addFindInfo,
    updateFindInfo,
    delFindInfo,
    getFindInfo,
    updateUserPassword,
    // cp
    getUserInfo,
    getUserResolution,
    checkDomain,
    addResolution,
    getUserDomainInfo,
    updateUserDomainInfo,
    delUserDomain,
    // cp change password
    getChangePasswordInfo,
    addChangePasswordInfo,
    delChangePasswordInfo,
};
