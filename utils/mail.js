const nodemailer = require('nodemailer');

const { otherLog } = require('./log');
const { mailConfig } = require('./getConfig');

const transporter = nodemailer.createTransport({
    host: mailConfig.host,
    port: mailConfig.port,
    secureConnection: true,
    auth: {
        user: mailConfig.user,
        pass: mailConfig.password
    }
});
// var transporter = nodemailer.createTransport({
//     "host": mailConfig.host,
//     "port": mailConfig.port,
//     "secureConnection": true,
//     "auth": {
//         "user": mailConfig.user,
//         "pass": mailConfig.password
//     }
// });

/**
 * 发送注册验证码
 * @param {String} key 验证码
 * @param {String} mail 邮箱
 */
const sendRegisteredEmail = async (key, mail) => {
    const mailOptions = {
        from: 'MCCFD <'+mailConfig.user+'>',
        to: mail,
        subject: 'MC.CFD 注册邮箱验证',
        html: `
        <h1>MC.CFD 注册邮箱验证</h1>
        <p>${mail}, 您好!</p>
        <p>您的验证码为 <b>${key}</b></p>
        <p>请在15分钟内完成验证</p>
        <p>如果您没有请求此验证码, 可放心忽略这封电子邮件, 别人可能错误地键入了您的电子邮件地址</p>
        <p>管理员不会向您索要验证码, 请勿将验证码发送给任何人</p>
        <br><hr>
        <p>如有任何问题, 请发送邮件至 <a href="mailto:qiaoshouzi@hgy.ooo">qiaoshouzi@hgy.ooo</a> 联系管理员</p>
        <p>此邮件由 MC.CFD 自动发送, 请勿直接回复</p>
        `
    };
    try {
        const sendMail_data = await transporter.sendMail(mailOptions);
        otherLog(`注册邮箱验证 - 成功 | Mail: ${mail} Key: ${key}`, '[Mail]');
        Promise.resolve(sendMail_data);
    } catch(e) {
        otherLog(
            `注册邮箱验证 - 失败 | Mail: ${mail} Key: ${key} - `+e.message,
            '[Mail][Error]',
            'error'
        );
        Promise.reject(e);
    };
};

/**
 * 找回密码
 * @param {String} key 验证码
 * @param {String} mail 邮箱
 */
const sendFindEmail = async (key, mail) => {
    const mailOptions = {
        from: 'MCCFD <'+mailConfig.user+'>',
        to: mail,
        subject: 'MC.CFD 找回密码',
        html: `
        <h1>MC.CFD 找回密码</h1>
        <p>${mail}, 您好!</p>
        <p>您的验证码为 <b>${key}</b></p>
        <p>请在15分钟内完成验证</p>
        <p>如果您没有请求此验证码, 可放心忽略这封电子邮件, 别人可能错误地键入了您的电子邮件地址</p>
        <p>管理员不会向您索要验证码, 请勿将验证码发送给任何人</p>
        <br><hr>
        <p>如有任何问题, 请发送邮件至 <a href="mailto:qiaoshouzi@hgy.ooo">qiaoshouzi@hgy.ooo</a> 联系管理员</p>
        <p>此邮件由 MC.CFD 自动发送, 请勿直接回复</p>
        `
    };
    try {
        const sendMail_data = await transporter.sendMail(mailOptions);
        otherLog(`找回密码 - 成功 | Mail: ${mail} Key: ${key}`, '[Mail]');
        Promise.resolve(sendMail_data);
    } catch(e) {
        otherLog(
            `找回密码 - 失败 | Mail: ${mail} Key: ${key} - `+e.message,
            '[Mail][Error]',
            'error'
        );
        Promise.reject(e);
    };
};

/**
 * 修改密码
 * @param {String} key 验证码
 * @param {String} mail 邮箱
 */
const sendChangePasswordEmail = async (key, mail) => {
    const mailOptions = {
        from: 'MCCFD <'+mailConfig.user+'>',
        to: mail,
        subject: 'MC.CFD 修改密码',
        html: `
        <h1>MC.CFD 修改密码</h1>
        <p>${mail}, 您好!</p>
        <p>您正在尝试修改密码, 这是您的验证码 <b>${key}</b></p>
        <p>请在15分钟内完成验证</p>
        <p><b>如果您没有请求此验证码, 您账户的密码可能已经泄露, 请及时修改</b></p>
        <p>管理员不会向您索要验证码, 请勿将验证码发送给任何人</p>
        <br><hr>
        <p>如有任何问题, 请发送邮件至 <a href="mailto:qiaoshouzi@hgy.ooo">qiaoshouzi@hgy.ooo</a> 联系管理员</p>
        <p>此邮件由 MC.CFD 自动发送, 请勿直接回复</p>
        `
    };
    try {
        const sendMail_data = await transporter.sendMail(mailOptions);
        otherLog(`修改密码 - 成功 | Mail: ${mail} Key: ${key}`, '[Mail]');
        Promise.resolve(sendMail_data);
    } catch(e) {
        otherLog(
            `修改密码 - 失败 | Mail: ${mail} Key: ${key} - `+e.message,
            '[Mail][Error]',
            'error'
        );
        Promise.reject(e);
    };
};

module.exports = {
    sendRegisteredEmail,
    sendFindEmail,
    sendChangePasswordEmail,
};
