/*
 作者：https://github.com/lksky8/sign-ql/
 日期：2022-10-7
 软件：叮咚买菜App
 功能：签到-叮咚鱼塘-叮咚果园
 抓包：打开叮咚鱼塘 → 选 “天天翻牌” → 开启抓包软件 → 返回到APP开始抽奖 →把 http://farm.api.ddxq.mobi/api/v2/lucky-draw-activity/draw? 填入ddmc变量
 变量: ddmc='https://farm.api.ddxq.mobi/api/v2/lucky-draw-activity/draw?api_version=9.7.3&app_version=1.0.0&app_client_id=3&station_id=XXXXXXXXX&city_number=XXXX&device_token=XXXXXXXXX&device_id=XXXXXXXXX&latitude=XXXXXXXXX&longitude=XXXXXXXXX&gameId=1&uid=XXXXXXXXX&DDXQSESSID=XXXXXXXXXXXXXXX
 注意：变量最后加上cookie DDXQSESSID= 按照格式填写100%有效；旧版不能使用需要更换新的变量；多个账号用 @ 或者 换行 分割
 定时一天3次
 鱼塘饲料瓶大于55会停止喂鱼，以免浪费
 如果出现无法喂鱼情况在手机APP上完成滑动验证
 <<<<<<完成会获得满49元使用的香蕉券，满59元使用的水产券>>>>>>

 cron: 22 7,10,16 * * *
*/

const $ = new Env('叮咚买菜');
const notify = $.isNode() ? require('./sendNotify') : '';
const {log} = console;
const Notify = 1; //0为关闭通知，1为打开通知,默认为1
//////////////////////
let ddmc = process.env.ddmc;
let ddmcArr = [];
let data = '';
let msg = '';

!(async () => {

	if (!(await Envs()))
		return;
	else {



		log(`\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
			new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
			8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);


		log(`\n=================== 共找到 ${ddmcArr.length} 个账号 ===================`)

		for (let index = 0; index < ddmcArr.length; index++) {

			let num = index + 1
			log(`\n========= 开始【第 ${num} 个账号】=========\n`)

			data=JSON.parse(JSON.stringify(getRequest(ddmcArr[index])));
			station_id=data.station_id;
			CityId=data.city_number;
			uid=data.uid;
			latitude=data.latitude;
			longitude=data.longitude;
			device_token=data.device_token;
			device_id=data.device_id;
			ddmck=data.DDXQSESSID;
			header1 = JSON.parse(`{"Accept":"*/*","Accept-Encoding":"gzip, deflate, br","Host":"farm.api.ddxq.mobi","Connection":"keep-alive","Accept-Language":"zh-cn","Origin":"https://game.m.ddxq.mobi","User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 xzone/9.61.1 station_id/${station_id} device_id/${device_id}","cookie":"DDXQSESSID=${ddmck}"}`)
			header2 = JSON.parse(`{"Accept":"*/*","Accept-Encoding":"gzip, deflate, br","Host":"farm.api.ddxq.mobi","Connection":"keep-alive","Accept-Language":"zh-cn","Origin":"https://game.m.ddxq.mobi","User-Agent":"Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 xzone/9.61.1 station_id/${station_id} device_id/${device_id}","DDMC-GAME-TID":2,"cookie":"DDXQSESSID=${ddmck}"}`)

			msg += `\n第${num}个账号运行结果：`
			await checkid();
			await $.wait(1 * 1000);
			log('【APP签到】')
			await $.wait(1 * 1000);
			await doSign();
			await $.wait(1 * 1000);
			log('开始鱼塘任务')
			await $.wait(1 * 1000);
			log('【鱼塘-连续签到】')
			await $.wait(1 * 1000);
			await doachieve('CONTINUOUS_SIGN',0);//鱼塘连续签到
			await $.wait(1 * 1000);
            log('【鱼塘-每日签到】')
			await $.wait(1 * 1000);
			await doachieve('DAILY_SIGN',0);//鱼塘每日签到
			await $.wait(1 * 1000);
            log('【鱼塘-三餐开福袋】')
			await $.wait(1 * 1000);
			await doachieve('LOTTERY',0);//三餐开福袋7-9 10-12 16-18
			await $.wait(1 * 1000);
            log('【鱼塘-去翻牌一次】')
			await $.wait(1 * 1000);
            await luckydarw();
			await $.wait(1 * 1000);
            log('【鱼塘-浏览商品得饲料】')
			await $.wait(1 * 1000);
            await doachieve('BROWSE_GOODS',0);//鱼塘
			await $.wait(1 * 1000);
            log('【鱼塘-浏览宝妈严选得饲料】')
			await $.wait(1 * 1000);
            await doachieve('BROWSE_GOODS3',0);//鱼塘
			await $.wait(1 * 1000);
            await getasklist();//获取鱼塘任务数据
			await $.wait(1 * 1000);
			log('【鱼塘-领饲料瓶】')
			await $.wait(1 * 1000);
			await rewardtask(slpid,0);
			await $.wait(1 * 1000);
			log('【鱼塘-参与天天翻牌活动】领取奖励')
			await $.wait(1 * 1000);
            await rewardtask(fpid,0);//完成翻牌任务，鱼塘
			await $.wait(1 * 1000);
			log('【果园-去鱼塘喂食一次】领取任务')
			await $.wait(1 * 1000);
			await gotofeedfish();//领取果园喂鱼任务
			await $.wait(1 * 1000);
			await checkfish();
			await $.wait(2 * 1000);
			log('开始喂鱼')
            if(nofish == 1){
			    log('!!!鱼塘没有鱼了!!!')
			}else if(parseInt(pid) < 55 || parseInt(newfish) > 10 ){
                for (i = 0; i < 20; i++) {
                    await feedfish();//喂鱼
				    await $.wait(3 * 1000);
				    if(parseInt(fish) > 55 || parseInt(sl) < 10 || nofish == 1){
					  log('无法喂养，可能饲料不足10g或者饲料瓶已经满了或者没有鱼')
					  break;
				    }
                }
			}else{
				log('无法喂养，可能饲料不足10g或者饲料瓶已经满了或者没有鱼')
			}
			await $.wait(1 * 1000);
			await checkfish2();
			await $.wait(1 * 3000);
			log('=============================================')
            log('开始果园任务')
			log('=============================================')
			await $.wait(1 * 1000);
			log('【果园-连续签到】')
			await $.wait(1 * 1000);
			await doachieve('CONTINUOUS_SIGN',1);
			await $.wait(1 * 1000);
            log('【果园-每日签到】')
			await $.wait(1 * 1000);
			await doachieve('DAILY_SIGN',1);
			await $.wait(1 * 1000);
			log('【果园-三餐开福袋】')
			await $.wait(1 * 1000);
			await doachieve('LOTTERY',1);//三餐开福袋7-9 10-12 16-18
			await $.wait(1 * 1000);
			log('【去鱼塘喂食一次】领奖励')
			await getasklist2();
			await $.wait(1 * 1000);
            await rewardtask(fishid2,1);
            log('【果园-浏览商品奖水滴】')
			await $.wait(1 * 1000);
            await doachieve('BROWSE_GOODS',1)
			await $.wait(1 * 1000);
			await checkwater();
			await $.wait(2 * 1000);
			if(nobanana == 1){
			    log('!!!农场没有树了!!!')
			}else if(parseInt(newater) > 10){
                for (i = 0; i < 10; i++) {
                    await water();//浇水
				    await $.wait(2 * 1000);
				    if(parseInt(nowater) < 10){
					  log('水滴不足10，停止浇水')
					  break;
				    }
                }
			}else{
				log('果园水滴不足10，停止浇水')
			}
			await $.wait(1 * 1000);
			log('领取【浇水10次送水滴】奖励')
			await $.wait(1 * 1000);
			await doachieve('FEED_N_TIMES',1)
			await $.wait(2 * 1000);
			await checkwater2();
			await $.wait(2 * 1000);

		}
		await SendMsg(msg);
	}

})()
	.catch((e) => log(e))
	.finally(() => $.done())


/**
 * APP签到
 */
function doSign(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://sunquan.api.ddxq.mobi/api/v2/user/signin/`,
			headers: { 
                "cookie":`DDXQSESSID=${ddmck}`
            },
			body: `api_version=9.7.3&app_version=1.0.0&app_client_id=3&station_id=${station_id}&native_version=9.35.1&city_number=${CityId}&latitude=${latitude}&longitude=${longitude}`,
		}

		$.post(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if (result.msg == '请求成功' && result.success == true) {
					log(`签到成功，获得：${result.data.point}积分，已经签到了${result.data.sign_series}天`)
					//msg += `\n签到成功，获得：${result.data.point}积分，已经签到了${result.data.sign_series}天`
				} else {
					log(`签到失败，原因是：${result.message}`)
					msg += '\n签到失败，可能是cookies失效'
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
/**
 * 获取鱼塘任务数据
 */
function getasklist(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/task/list?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=1&cityCode=${CityId}`,
			headers: header1,
		}

		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				var siliaoping = data.indexOf("HARD_BOX") != -1 
				if (result.msg == '请求成功' && result.success == true) {
					log('农场-获取任务数据成功')
					var tasklist = result.data.userTasks
					let fp = tasklist.find(item => item['taskName']==='参与天天翻牌活动')
                    fpid = fp['userTaskLogId']
					if(siliaoping == true){
						let slp = tasklist.find(item => item['taskCode']==='HARD_BOX')
						slpid = slp['userTaskLogId']
						pid= slp.targetRewardRangesVos[0].rewardRanges[0].amountDesc
					}else{
						slpid = 0
						pid = 0
					}


				} else {
					log(`获取任务数据失败，可能是cookies失效`)
                    msg += '\n获取任务数据失败，可能是cookies失效'
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
//果园
function getasklist2(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://farm.api.ddxq.mobi/api/v2/task/list-orchard?api_version=9.1.0&app_client_id=1&station_id=${station_id}&stationId=${station_id}&native_version=&CityId=${CityId}&OSVersion=14&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&reward=FEED&cityCode=${CityId}`,
			headers: header2,
		}

		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if (result.msg == '请求成功' && result.success == true) {
					log('果园-获取任务数据成功')
					let tasklist = result.data.userTasks
					let hesuan = tasklist.find(item => item['taskName']==='去鱼塘喂食1次')
                    fishid2 = hesuan['userTaskLogId']
				} else {
					log(`获取任务数据失败，可能是cookies失效`)
                    msg += '\n获取任务数据失败，可能是cookies失效'
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

/**
 * 鱼塘任务
 */
function doachieve(taskCode,code,timeout = 3 * 1000) {
	return new Promise((resolve) => {
        if(code == 0){
            ddmcheader=header1
			ddmcurl = `https://farm.api.ddxq.mobi/api/v2/task/achieve?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng${latitude}&device_token=${device_token}&gameId=1&taskCode=${taskCode}`
		}else{
			ddmcheader=header2
			ddmcurl =`https://farm.api.ddxq.mobi/api/v2/task/achieve?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng${latitude}&device_token=${device_token}&taskCode=${taskCode}`
		}
		let url = {
			url: ddmcurl,
			headers: ddmcheader,
		}

		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if (taskCode == 'CONTINUOUS_SIGN' && code == 0 && result.success == true) {
					log(`任务完成，获得：${result.data.rewards[0].amount}g饲料`)
                } else if(taskCode == 'DAILY_SIGN' && code == 0 && result.success == true) {
                    log(`任务完成，获得：${result.data.rewards[0].amount}g饲料`)
				} else if(taskCode == 'CONTINUOUS_SIGN' && code == 1 && result.success == true) {
                    log(`任务完成，获得：${result.data.rewards[0].amount}水滴`)
				} else if(taskCode == 'DAILY_SIGN' && code == 1 && result.success == true) {
                    log(`任务完成，获得：${result.data.rewards[0].amount}水滴`)
				} else if(result.msg == '今日已完成任务，明日再来吧！') {
					log(`任务已完成`)
				} else if(result.msg == '你已完成任务，去看看其他任务吧~') {
					log(`任务已完成`)
                } else if(taskCode == 'LOTTERY' && result.msg == '任务尚未开启，请耐心等待~') {
                    log('还没到领取时间，请在7-9；10-12；16-18这三个时间段内操作')
				} else if(taskCode == 'LOTTERY' && code == 0 && result.success == true) {
                    log(`任务完成，获得：${result.data.rewards[0].amount}g饲料`)
				} else if(taskCode == 'LOTTERY' && code == 1 && result.success == true) {
                    log(`任务完成，获得：${result.data.rewards[0].amount}水滴`)
                } else if(taskCode == 'BROWSE_GOODS' && code == 0 && result.success == true) {
					rewardtask(result.data.userTaskLogId,0);
				} else if(taskCode == 'BROWSE_GOODS' && code == 1 && result.success == true) {
					rewardtask(result.data.userTaskLogId,1);
                } else if(taskCode == 'BROWSE_GOODS3' && code == 0 && result.success == true) {
                    rewardtask(result.data.userTaskLogId,0);
				} else if(taskCode == 'FEED_N_TIMES' && result.success == true) {
                    log(`任务完成，获得：${result.data.rewards[0].amount}水滴`)
				} else if(taskCode == 'FEED_N_TIMES' && result.msg == '浇水次数不满足') {
                    log('浇水不满10次，无法完成任务')
				} else if(result.msg == '此任务不可手动完成') {
                    log('任务需要手动操作')
				} else{
					log(`获取任务数据失败，可能是cookies失效`)
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
function luckydarw(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/lucky-draw-activity/draw?api_version=9.7.3&app_version=1.0.0&app_client_id=3&station_id=${station_id}&native_version=9.58.0&city_number=${CityId}&device_token=${device_token}&device_id=${device_id}&latitude=${latitude}&longitude=${longitude}&gameId=1&uid=${uid}`,
			headers: header1,
		}
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if (result.msg == '请求成功' && result.success == true) {
					log(`已翻牌并获得：${result.data.chosen.amount}饲料`)
				} else {
					log('饲料不足，翻牌失败')
                    msg += '\n饲料不足，翻牌失败'
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function rewardtask(taskid,code,timeout = 3 * 1000) {
	return new Promise((resolve) => {
		if(code == 0){
            ddmcheader1=header1
			ddmcurl1 = `http://farm.api.ddxq.mobi/api/v2/task/reward?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=1&userTaskLogId=${taskid}`
		}else{
			ddmcheader1=header2
			ddmcurl1 = `http://farm.api.ddxq.mobi/api/v2/task/reward?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&userTaskLogId=${taskid}`
		}
		let url = {
			url: ddmcurl1,
			headers: ddmcheader1,
		}
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if(taskid == 0){
					log('暂时没有饲料瓶入口')
				}else if (result.msg == '请求成功' && result.success == true) {
					log(`任务完成，获得：${result.data.rewards[0].amount}饲料`)
                } else if(result.msg == '你已领取奖励，去领其他奖励吧~') {
					log('已经领取过该奖励')
				} else if(result.msg == '不可领取') {
					log('已经领取过该奖励')
				} else if(result.msg == '参数无效') {
					log('任务不存在或者已完成')
				} else {
					log('任务失败，可能是cookies失效')
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function gotofeedfish(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/task/receive?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&CityId=${CityId}&OSVersion=10&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=&gameId=2&taskCode=FEED_CRAP`,
			headers: header2,
		}
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if (result.msg == '请求成功' && result.success == true) {
					log(`【去鱼塘喂食一次】领取任务成功，等待喂鱼`)
				} else if(result.msg == '该任务已经完成了哦'){
					log('【去鱼塘喂食一次】任务已完成')
				}else{
					log('【去鱼塘喂食一次】任务失败，可能是cookies失效')
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function feedfish(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/props/feed?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=1&propsId=${fishpropsId}&seedId=${fishseedId}&cityCode=${CityId}&feedPro=0&triggerMultiFeed=1`,
			headers: { 
                "Host": "farm.api.ddxq.mobi",
                "user-agent": "Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/89.0.4389.72 MQQBrowser/6.2 TBS/045947 Mobile Safari/537.36 xzone/9.58.0 station_id/60dd252dbd8d8c0001eca0e0 OpenTime/"+timestampMs(),
                "accept": "*/*",
                "origin": "https://game.m.ddxq.mobi",
                "x-requested-with": "com.yaya.zone",
                "sec-fetch-site": "same-site",
                "sec-fetch-mode": "cors",
                "sec-fetch-dest": "empty",
                "referer": "https://game.m.ddxq.mobi/",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
                "cookie": `DDXQSESSID=${ddmck}`
            },
		}

		$.get(url, async (error, response, data) => {
			try {
				if(error){//406 Not Acceptable
                   log ('Api请求失败，请登陆APP完成滑动验证')
				   msg +='\n请登陆APP完成滑动验证完成喂鱼操作'
				   fish='0'
				   sl='0'
				}else{
					let result = JSON.parse(data);
				    if (result.success == true && result.data.hardBoxRewardAmountAfterFeed == null) {
					   log(`喂鱼成功，剩余${result.data.feed.amount}g饲料,${result.data.seed.msg}`)
                       fish=result.data.hardBoxRewardAmountAfterFeed
					   sl=result.data.feed.amount
				    }else if(result.success == true && result.data.hardBoxRewardAmountAfterFeed != null){
                       log(`喂鱼成功，剩余${result.data.feed.amount}g饲料,已存储${result.data.hardBoxRewardAmountAfterFeed}g饲料,${result.data.seed.msg}`)
                       fish=result.data.hardBoxRewardAmountAfterFeed
					   sl=result.data.feed.amount
				    } else if(result.msg == '饲料不足10g,请完成任务领饲料~' || result.msg == '今天喂食太多了,休息一下明天再来吧'){
					   log('喂鱼失败，饲料不足10g或者达到喂鱼上限')
					   fish='0'
					   sl='0'
				    }else{
					   log('喂鱼任务失败，可能是cookies失效')
				    }
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function water(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/props/feed?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&CityId=${CityId}&OSVersion=10&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&propsCode=FEED&seedId=${waterseedId}&propsId=${waterpropsId}`,
			headers: header2,
		}

		$.get(url, async (error, response, data) => {
			try {
                if(error){
					log ('Api请求失败，请登陆APP完成滑动验证')
				    msg +='\n请登陆APP完成滑动验证'
					nowater='0'
				}else{
					let result = JSON.parse(data);
					if (result.msg == '请求成功' && result.success == true) {
					   nowater=result.data.feed.amount
					   gyfl = result.data.fertilizerUse.amount
					   log(`浇水成功，剩余${nowater}水滴，当前肥力:${gyfl},${result.data.msg}`)
					   if(gyfl < 10){
						log('肥力不足，自动施肥')
						await userfeiliao();
					   }
				    } else {
					   log('浇水失败，可能是水滴不足或者cookies失效')
                       msg += '\n浇水失败，可能是水滴不足或者cookies失效'
				    }
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function userfeiliao(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://farm.api.ddxq.mobi/api/v2/props/props-use?api_version=9.1.0&app_client_id=1&station_id=${station_id}&stationId=${station_id}&native_version=&CityId=${CityId}&OSVersion=14&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&propsCode=FERTILIZER&propsId=220910108081811250&seedId=220910108081800250`,
			headers: header2,
		}
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if (result.msg == '请求成功' && result.success == true) {
					log(`施肥成功，剩余${result.data.propsUse.amount}肥料，当前可用肥料:${result.data.propsUseResultVo.amount}`)
				} else {
					log('肥料不足，施肥失败')
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function checkwater(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/userguide/orchard/detail?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&CityId=${CityId}&OSVersion=10&uid=${uid}&latitude=${latitude}&longitude=${longitude}lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=2&cityCode=${CityId}`,
			headers: header2,
		}
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if(data.indexOf("seedId")<0){
					nobanana = 1
					newater=result.data.feed.amount
					waterpropsId = result.data.feed.propsId
					waterseedId = 0
					log('农场没有香蕉可以种，检查是否已经获得奖励')
					msg +='\n农场没有香蕉可以种，检查是否已经获得奖励'
				}else if (result.msg == '请求成功' && result.success == true) {
					nobanana = 0
					newater=result.data.feed.amount
				    waterpropsId = result.data.feed.propsId
					waterseedId = result.data.baseSeed.seedId
					log(`目前果园水滴：${newater}`)
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function checkwater2(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/userguide/orchard/detail?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&CityId=${CityId}&OSVersion=10&uid=${uid}&latitude=${latitude}&longitude=${longitude}lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=2&cityCode=${CityId}`,
			headers: header2,
		}
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if(data.indexOf("seedId")<0){
					log('农场没有香蕉可以种，检查是否已经获得奖励')
				}else if (result.msg == '请求成功' && result.success == true) {
					msg+= `\n【果园】${result.data.baseSeed.msg}`
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function checkfish(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/userguide/detail?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=1&guideCode=FISHPOND_NEW`,
			headers: header1,
		}
		
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if(data.indexOf("seedId")<0){
					nofish = 1
					newfish=result.data.feed.amount
					fishpropsId = result.data.feed.propsId
					fishseedId = 0
					fish = 0
					log('鱼塘没有鱼可以喂，检查是否已经获得奖励')
					msg +='\n鱼塘没有鱼可以喂，检查是否已经获得奖励'
				}else if (result.msg == '请求成功' && result.success == true) {
					nofish = 0
					newfish=result.data.feed.amount
					fishpropsId = result.data.feed.propsId
					fishseedId = result.data.baseSeed.seedId
					log(`目前鱼饲料：${newfish}g`)
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function checkfish2(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/userguide/detail?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&app_version=9.58.0&OSVersion=10&CityId=${CityId}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=1&guideCode=FISHPOND_NEW`,
			headers: header1,
		}
		
		$.get(url, async (error, response, data) => {
			try {
				let result = JSON.parse(data);
				if(data.indexOf("seedId")<0){
					log('鱼塘没有鱼可以喂，检查是否已经获得奖励')
				}else if (result.msg == '请求成功' && result.success == true) {
					msg+= `\n【鱼塘】${result.data.baseSeed.msg}`
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}

function checkid(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `http://farm.api.ddxq.mobi/api/v2/friend/list?api_version=9.1.0&app_client_id=2&station_id=${station_id}&stationId=${station_id}&native_version=&CityId=${CityId}&OSVersion=10&uid=${uid}&latitude=${latitude}&longitude=${longitude}&lat=${latitude}&lng=${longitude}&device_token=${device_token}&gameId=1`,
			headers: header1,
		}

		$.get(url, async (error, response, data) => {
			try {

				let result = JSON.parse(data);
				if(result.msg == '您的访问已过期,请重新登录app~' && result.code == 111){
					log('cookie失效了!!!cookie失效了!!!cookie失效了!!!cookie失效了!!!')
					msg+='cookie失效了!!!cookie失效了!!!cookie失效了!!!cookie失效了!!!'

				}else if(result.msg == '您的访问已过期,请重新登录' && result.code == 1111){
					log('cookie失效了!!!cookie失效了!!!cookie失效了!!!cookie失效了!!!')
					msg+='cookie失效了!!!cookie失效了!!!cookie失效了!!!cookie失效了!!!'

				}else{
					nname=result.data.me.nickName
					log(`【账号】${nname}|登录成功，cookie有效`)
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
// ============================================变量检查============================================ \\
async function Envs() {
	if (ddmc) {
		if (ddmc.indexOf("@") != -1) {
			ddmc.split("@").forEach((item) => {
				ddmcArr.push(item);
			});
		} else if (ddmc.indexOf("\n") != -1) {
			ddmc.split("\n").forEach((item) => {
				ddmcArr.push(item);
			});
		} else {
			ddmcArr.push(ddmc);
		}
	} else {
		log(`\n 【${$.name}】：未填写变量 ddmc`)
		return;
	}
	return true;
}
// ============================================发送消息============================================ \\
async function SendMsg(message) {
	if (!message)
		return;

	if (Notify > 0) {
		if ($.isNode()) {
			var notify = require('./sendNotify');
			await notify.sendNotify($.name, message);
		} else {
			$.msg(message);
		}
	} else {
		log(message);
	}
}

function getRequest(url) {  
   var theRequest = new Object();  
   if (url.indexOf("?") != -1) {  
      var str = url.substr(1);  
      strs = str.split("&");  
      for(var i = 0; i < strs.length; i ++) {  
         theRequest[strs[i].split("=")[0]]=unescape(strs[i].split("=")[1]);  
      }  
   }  
   return theRequest;  
}

 function timestampMs(){
    return new Date().getTime();
 }

/**
 * 修改配置文件
 */
function modify() {

	fs.readFile('/ql/data/config/config.sh','utf8',function(err,dataStr){
		if(err){
			return log('读取文件失败！'+err)
		}
		else {
			var result = dataStr.replace(/regular/g,string);
			fs.writeFile('/ql/data/config/config.sh', result, 'utf8', function (err) {
				if (err) {return log(err);}
			});
		}
	})
}

function Env(t, e) { "undefined" != typeof process && JSON.stringify(process.env).indexOf("GITHUB") > -1 && process.exit(0); class s { constructor(t) { this.env = t } send(t, e = "GET") { t = "string" == typeof t ? { url: t } : t; let s = this.get; return "POST" === e && (s = this.post), new Promise((e, i) => { s.call(this, t, (t, s, r) => { t ? i(t) : e(s) }) }) } get(t) { return this.send.call(this.env, t) } post(t) { return this.send.call(this.env, t, "POST") } } return new class { constructor(t, e) { this.name = t, this.http = new s(this), this.data = null, this.dataFile = "box.dat", this.logs = [], this.isMute = !1, this.isNeedRewrite = !1, this.logSeparator = "\n", this.startTime = (new Date).getTime(), Object.assign(this, e), this.log("", `🔔${this.name}, 开始!`) } isNode() { return "undefined" != typeof module && !!module.exports } isQuanX() { return "undefined" != typeof $task } isSurge() { return "undefined" != typeof $httpClient && "undefined" == typeof $loon } isLoon() { return "undefined" != typeof $loon } toObj(t, e = null) { try { return JSON.parse(t) } catch { return e } } toStr(t, e = null) { try { return JSON.stringify(t) } catch { return e } } getjson(t, e) { let s = e; const i = this.getdata(t); if (i) try { s = JSON.parse(this.getdata(t)) } catch { } return s } setjson(t, e) { try { return this.setdata(JSON.stringify(t), e) } catch { return !1 } } getScript(t) { return new Promise(e => { this.get({ url: t }, (t, s, i) => e(i)) }) } runScript(t, e) { return new Promise(s => { let i = this.getdata("@chavy_boxjs_userCfgs.httpapi"); i = i ? i.replace(/\n/g, "").trim() : i; let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout"); r = r ? 1 * r : 20, r = e && e.timeout ? e.timeout : r; const [o, h] = i.split("@"), n = { url: `http://${h}/v1/scripting/evaluate`, body: { script_text: t, mock_type: "cron", timeout: r }, headers: { "X-Key": o, Accept: "*/*" } }; this.post(n, (t, e, i) => s(i)) }).catch(t => this.logErr(t)) } loaddata() { if (!this.isNode()) return {}; { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e); if (!s && !i) return {}; { const i = s ? t : e; try { return JSON.parse(this.fs.readFileSync(i)) } catch (t) { return {} } } } } writedata() { if (this.isNode()) { this.fs = this.fs ? this.fs : require("fs"), this.path = this.path ? this.path : require("path"); const t = this.path.resolve(this.dataFile), e = this.path.resolve(process.cwd(), this.dataFile), s = this.fs.existsSync(t), i = !s && this.fs.existsSync(e), r = JSON.stringify(this.data); s ? this.fs.writeFileSync(t, r) : i ? this.fs.writeFileSync(e, r) : this.fs.writeFileSync(t, r) } } lodash_get(t, e, s) { const i = e.replace(/\[(\d+)\]/g, ".$1").split("."); let r = t; for (const t of i) if (r = Object(r)[t], void 0 === r) return s; return r } lodash_set(t, e, s) { return Object(t) !== t ? t : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []), e.slice(0, -1).reduce((t, s, i) => Object(t[s]) === t[s] ? t[s] : t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}, t)[e[e.length - 1]] = s, t) } getdata(t) { let e = this.getval(t); if (/^@/.test(t)) { const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t), r = s ? this.getval(s) : ""; if (r) try { const t = JSON.parse(r); e = t ? this.lodash_get(t, i, "") : e } catch (t) { e = "" } } return e } setdata(t, e) { let s = !1; if (/^@/.test(e)) { const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e), o = this.getval(i), h = i ? "null" === o ? null : o || "{}" : "{}"; try { const e = JSON.parse(h); this.lodash_set(e, r, t), s = this.setval(JSON.stringify(e), i) } catch (e) { const o = {}; this.lodash_set(o, r, t), s = this.setval(JSON.stringify(o), i) } } else s = this.setval(t, e); return s } getval(t) { return this.isSurge() || this.isLoon() ? $persistentStore.read(t) : this.isQuanX() ? $prefs.valueForKey(t) : this.isNode() ? (this.data = this.loaddata(), this.data[t]) : this.data && this.data[t] || null } setval(t, e) { return this.isSurge() || this.isLoon() ? $persistentStore.write(t, e) : this.isQuanX() ? $prefs.setValueForKey(t, e) : this.isNode() ? (this.data = this.loaddata(), this.data[e] = t, this.writedata(), !0) : this.data && this.data[e] || null } initGotEnv(t) { this.got = this.got ? this.got : require("got"), this.cktough = this.cktough ? this.cktough : require("tough-cookie"), this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar, t && (t.headers = t.headers ? t.headers : {}, void 0 === t.headers.Cookie && void 0 === t.cookieJar && (t.cookieJar = this.ckjar)) } get(t, e = (() => { })) { t.headers && (delete t.headers["Content-Type"], delete t.headers["Content-Length"]), this.isSurge() || this.isLoon() ? (this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.get(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) })) : this.isQuanX() ? (this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t))) : this.isNode() && (this.initGotEnv(t), this.got(t).on("redirect", (t, e) => { try { if (t.headers["set-cookie"]) { const s = t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString(); s && this.ckjar.setCookieSync(s, null), e.cookieJar = this.ckjar } } catch (t) { this.logErr(t) } }).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) })) } post(t, e = (() => { })) { if (t.body && t.headers && !t.headers["Content-Type"] && (t.headers["Content-Type"] = "application/x-www-form-urlencoded"), t.headers && delete t.headers["Content-Length"], this.isSurge() || this.isLoon()) this.isSurge() && this.isNeedRewrite && (t.headers = t.headers || {}, Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })), $httpClient.post(t, (t, s, i) => { !t && s && (s.body = i, s.statusCode = s.status), e(t, s, i) }); else if (this.isQuanX()) t.method = "POST", this.isNeedRewrite && (t.opts = t.opts || {}, Object.assign(t.opts, { hints: !1 })), $task.fetch(t).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => e(t)); else if (this.isNode()) { this.initGotEnv(t); const { url: s, ...i } = t; this.got.post(s, i).then(t => { const { statusCode: s, statusCode: i, headers: r, body: o } = t; e(null, { status: s, statusCode: i, headers: r, body: o }, o) }, t => { const { message: s, response: i } = t; e(s, i, i && i.body) }) } } time(t, e = null) { const s = e ? new Date(e) : new Date; let i = { "M+": s.getMonth() + 1, "d+": s.getDate(), "H+": s.getHours(), "m+": s.getMinutes(), "s+": s.getSeconds(), "q+": Math.floor((s.getMonth() + 3) / 3), S: s.getMilliseconds() }; /(y+)/.test(t) && (t = t.replace(RegExp.$1, (s.getFullYear() + "").substr(4 - RegExp.$1.length))); for (let e in i) new RegExp("(" + e + ")").test(t) && (t = t.replace(RegExp.$1, 1 == RegExp.$1.length ? i[e] : ("00" + i[e]).substr(("" + i[e]).length))); return t } msg(e = t, s = "", i = "", r) { const o = t => { if (!t) return t; if ("string" == typeof t) return this.isLoon() ? t : this.isQuanX() ? { "open-url": t } : this.isSurge() ? { url: t } : void 0; if ("object" == typeof t) { if (this.isLoon()) { let e = t.openUrl || t.url || t["open-url"], s = t.mediaUrl || t["media-url"]; return { openUrl: e, mediaUrl: s } } if (this.isQuanX()) { let e = t["open-url"] || t.url || t.openUrl, s = t["media-url"] || t.mediaUrl; return { "open-url": e, "media-url": s } } if (this.isSurge()) { let e = t.url || t.openUrl || t["open-url"]; return { url: e } } } }; if (this.isMute || (this.isSurge() || this.isLoon() ? $notification.post(e, s, i, o(r)) : this.isQuanX() && $notify(e, s, i, o(r))), !this.isMuteLog) { let t = ["", "==============📣系统通知📣=============="]; t.push(e), s && t.push(s), i && t.push(i), console.log(t.join("\n")), this.logs = this.logs.concat(t) } } log(...t) { t.length > 0 && (this.logs = [...this.logs, ...t]), console.log(t.join(this.logSeparator)) } logErr(t, e) { const s = !this.isSurge() && !this.isQuanX() && !this.isLoon(); s ? this.log("", `❗️${this.name}, 错误!`, t.stack) : this.log("", `❗️${this.name}, 错误!`, t) } wait(t) { return new Promise(e => setTimeout(e, t)) } done(t = {}) { const e = (new Date).getTime(), s = (e - this.startTime) / 1e3; this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`), this.log(), (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t) } }(t, e) }
