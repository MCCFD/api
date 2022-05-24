var CryptoJS = require("crypto-js");

var salt = CryptoJS.lib.WordArray.random(128 / 8); //生成盐值
var key512Bits1000Iterations = CryptoJS.PBKDF2("test", salt, {
    keySize: 512 / 32,
    iterations: 1000
}).toString();
salt = salt.toString();

// var test = '-1724980346,-1547324387,2045794628,-359857968';
// test = test.split(',');
// var tmp = CryptoJS.lib.WordArray.create(test, 16); //盐值转为word array
// var tmp = CryptoJS.enc.Utf8.parse('cc58cc6d18c800e9e9ede05b5a8aa2f0', );
// var tmp = CryptoJS.enc.Hex.parse('cc58cc6d18c800e9e9ede05b5a8aa2f0');
// var key512Bits1000Iterations = CryptoJS.PBKDF2('test', tmp, {
//     keySize: 512 / 32,
//     iterations: 1000
// }).toString();

// 829f539548348f915595aeb7c12998c4230797b3ddfe27717093fa39445192db51fa8344ab3d7e7118d174ea95ec10ef35f8de532c59d76509e4d1195660ba4b

// words
// [850094444, -911861208, -880611263, 2122417302, -1808027876, -982570561, -376889916, 848833153, -497427740, -1083811714, 201994840, -289408401, -551578334, 1261479259, -1565610575, -1684190887, 104053609, -762128388, 1543117532, 1913285163]
// var tmp = CryptoJS.MD5("123").toString();
console.log();