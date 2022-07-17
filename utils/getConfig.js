const fs = require('fs');
const YAML = require('yaml');

const CONFIG = YAML.parse(fs.readFileSync('config.yml', 'utf8'));

const dev = Boolean(CONFIG.dev);
const IPDomainName = CONFIG.IPDomainName;

const aliyunConfig = {
    accessKeyId: CONFIG.aliyun.accessKeyId,
    accessKeySecret: CONFIG.aliyun.accessKeySecret
};

const dbConfig = {
    host: CONFIG.db.host,
    port: CONFIG.db.port,
    user: CONFIG.db.user,
    password: CONFIG.db.password,
    database: CONFIG.db.database
};

const mgdbConfig = {
    host: CONFIG.mgdb.host,
    port: CONFIG.mgdb.port,
};

const mailConfig = {
    host: CONFIG.mail.host,
    port: CONFIG.mail.port,
    user: CONFIG.mail.user,
    password: CONFIG.mail.password
};

module.exports = {
    dev,
    IPDomainName,
    aliyunConfig,
    dbConfig,
    mgdbConfig,
    mailConfig
};