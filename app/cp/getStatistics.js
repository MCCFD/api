const { checkNull, checkSESSDATA, resUtile, getNowTime } = require('../../utils/box');
const { reqLog, otherLog } = require('../../utils/log');
const { getUserResolution } = require('../../utils/mysql');
const { getStatisticsData } = require('../../utils/mongodb');

/**
 * 查询解析量
 * /api/cp/getStatistics
 * 参数: sessdata, startTime, endTime
 */
const getStatistics = async (req, res) => {
    reqLog(res);
    otherLog('查询解析量 /api/cp/getStatistics');
    res.setHeader('Content-Type', 'application/json;charset=utf-8');

    const sessdata = req.body.sessdata;
    const startTime = Number(req.body.startTime);
    const endTime = Number(req.body.endTime);
    if (checkNull([sessdata, startTime, endTime], res) == null) return;
    const NowTime = getNowTime();
    if (NowTime-startTime > 16 || NowTime < endTime) {
        otherLog('时间参数错误 | startTime: '+startTime+' | endTime: '+endTime+' | NowUTCTime: '+NowTime, '[LOG][Error]', 'error');
        resUtile(res, 400, '参数错误', '');
        return;
    };

    // 校验SESSDATA 获取userID
    const checkSESSDATA_data = checkSESSDATA(sessdata, res);
    if (checkSESSDATA_data == 'Error') return;
    const userID = checkSESSDATA_data.userID;

    // 通过用户ID从数据库获取解析列表
    let resolutionList = [];
    try {
        const getUserResolution_data = await getUserResolution(userID);
        if (getUserResolution_data.length == 0) {
            resUtile(res, 200, '无解析', {});
            return;
        };
        for (const i in getUserResolution_data) {
            resolutionList.push(getUserResolution_data[i].domain);
        }
    } catch(e) {
        otherLog('通过用户ID从数据库获取解析列表 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    // 获取解析量
    let statisticsData = [];
    try {
        const getStatisticsData_data = await getStatisticsData(startTime, endTime, resolutionList);
        statisticsData = getStatisticsData_data;
    } catch(e) {
        otherLog('获取解析量 出现错误 | '+e.message, '[LOG][Error]', 'error');
        resUtile(res, 500, '数据库出现错误', '');
        return;
    };

    let resData = {
        domain: {},
        date: {}
    };
    for (const i in resolutionList) resData.domain[resolutionList[i]] = 0;
    for (const i in statisticsData) resData.date[statisticsData[i].time] = 0;
    for (const i in statisticsData) {
        const tmp = statisticsData[i];
        for (const ii in tmp.data) {
            resData.domain[ii] += tmp.data[ii];
            resData.date[tmp.time] += tmp.data[ii];
        };
    };
    resData.date = ((data) => {
        let data_time = [];
        for (const i in data) data_time.push(i);
        data_time.sort();

        let retData = [];
        for (const i in data_time) {
            const t = String(data_time[i]);
            retData.push([
                t.substring(0, 4) + '-' + t.substring(4, 6) + '-' + t.substring(6, 8),
                data[data_time[i]]
            ]);
        }
        return retData;
    })(resData.date)

    resUtile(res, 200, '', resData);
};

module.exports = getStatistics;
