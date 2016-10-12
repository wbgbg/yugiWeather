'use strict';
var rp = require('request-promise-native');
var fs = require('fs-extra');
var co = require('co');
var CronJob = require('cron').CronJob;
var TopClient = require('./sdk').ApiClient;
var baseUri = 'https://api.thinkpage.cn/v3';
var mykey = 'vaeqfgg9lj9jjlym';


function fetchWeather(city, tryTimes) {
    if (tryTimes > 5) {
        return Promise.reject();
    }
    return rp({
        uri: baseUri + '/weather/daily.json',
        qs: {
            key: mykey,
            location: city,
            start: 0,
            days: 1
        },
        json: true
    }).then(res => {
        //console.dir(res, { depth: 10 });
        return res;
    }).catch(err => {
        console.log(err);
        return fetchWeather(city, tryTimes+1);
    });
}

function fetchSuggestion(city) {
    return rp({
        uri: baseUri + '/life/suggestion.json',
        qs: {
            key: mykey,
            location: city
        },
        json: true
    }).then(res => {
        //console.dir(res, { depth: 10 });
        return res;
    }).catch(err => {
        console.log(err);
        return null;
    });
}

function sendRequest(user, weather) {
	
	console.log(`{name:'${user.name}',city:'${weather.location.name}',low:'${weather.daily[0].low}',high:'${weather.daily[0].high}',text_day:'${weather.daily[0].text_day}',text_night:'${weather.daily[0].text_night}',precip:'${weather.daily[0].precip == '' ? 0 : weather.daily[0].precip}%'}`);
    let app = fs.readJSONSync('./key.json');
    var client = new TopClient({
        'appkey': app.appkey,
        'appsecret': app.appsecret,
        'REST_URL': 'http://gw.api.taobao.com/router/rest'
    });

    client.execute('alibaba.aliqin.fc.sms.num.send', {
        'extend': '',
        'sms_type': 'normal',
        'sms_free_sign_name': 'yugi天气',
        'sms_param': `{name:'${user.name}',city:'${weather.location.name}',low:'${weather.daily[0].low}',high:'${weather.daily[0].high}',text_day:'${weather.daily[0].text_day}',text_night:'${weather.daily[0].text_night}',precip:'${weather.daily[0].precip == '' ? 0 : weather.daily[0].precip}%'}`,
        'rec_num': user.phone,
        'sms_template_code': 'SMS_16820210'
    }, (error, response) => {
        if (!!error) {
            console.log(error);
        } else {
            console.log(response);
        }
    })
    //console.log(JSON.stringify(weather, '',0));
    //console.log(user.phone);
    //console.log(`早上好,${user.name}!今天${weather.location.name}的温度为${weather.daily[0].low}度到${weather.daily[0].high}度,白天天气为${weather.daily[0].text_day},晚上天气为${weather.daily[0].text_night},降雨概率为${weather.daily[0].precip == '' ? 0 : weather.daily[0].precip}`);
}

var job = new CronJob({
    cronTime: '00 07 07 * * *',
    onTick: function() {
    	let obj = fs.readJSONSync('./config.json');
        for (let i=0; i<obj.length; i++) {
            co(function*() {
                let item = obj[i];
                let weather = yield fetchWeather(item.city, 0);
                sendRequest(item, weather.results[0]);
            }).catch(err => {
                console.log(err);
            });;
        }
    },
    start: false,
    timeZone: 'Asia/Shanghai'
});
job.start();



/*
(function tester() {
    let obj = fs.readJSONSync('./config.json');
    for (let i=0; i<obj.length; i++) {
    co(function*() {
        let item = obj[i];
        let weather = yield fetchWeather(item.city, 0);
        sendRequest(item, weather.results[0]);
    }).catch(err => {
        console.log(err);
    });
    }
})()
*/
