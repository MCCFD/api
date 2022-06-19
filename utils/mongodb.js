const { MongoClient } = require('mongodb');

const { mgdbConfig } = require('./getConfig');

const url = 'mongodb://'+mgdbConfig.host+':'+mgdbConfig.port;
const client = new MongoClient(url);

/**
 * 获取collection
 * @param {String} collectionName collectionName
 */
const getCollection = async (collectionName) => {
    try {
        await client.connect();
        const db = client.db('mccfd');
        const collection = db.collection(collectionName);
        return Promise.resolve([client, collection]);
    } catch(e) {
        otherLog(e.message, '[mgdb][DB][Error]', 'error');
        return Promise.reject(e);
    };
};

/**
 * 获取解析量数据
 * @param {Number} startTime startTime 20220101
 * @param {Number} endTime endTime 20220201
 * @param {List} domainList domainList
 */
const getStatisticsData = async (startTime, endTime, domainList) => {
    let client = void 0;
    try {
        let projection = { "_id": 0, "time": 1 };
        for (const i in domainList) {
            projection['data.'+domainList[i]] = 1;
        }
        let collection;
        [client, collection] = await getCollection('request_statistic');
        const statisticsData = await collection.find({
            "time": {
                $gte: Number(startTime),
                $lte: Number(endTime)
            },
        }).project(projection).toArray();
        client.close();
        return Promise.resolve(statisticsData);
    } catch(e) {
        if (client != void 0) client.close();
        return Promise.reject(e);
    };
};

module.exports = {
    getStatisticsData,
};
