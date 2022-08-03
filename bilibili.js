/*
 作者：https://github.com/lksky8/sign-ql
 日期：2022-8-3
 软件：B站签到
 功能：自动完成每日登录+5经验+1硬币 观看视频+5经验 分享视频+5经验 漫画签到 直播签到
 可选自动投币，银瓜子换硬币，大会员每月领取B币或其他福利，每月领取大会员漫画福利，月底在 B 币券过期前进行充电等功能	
 Cookies：通过扫码获取
 变量：
 ####################################################
 export bzck='ck1@ck2 '  多个账号用 @ 或者 换行 分割
 export bztb="" #true开启随机投币，false关闭随机投币
 export bzdhyb="" #true开启银瓜子兑换硬币
 export bzvipgift="" #B站大会员权益 1为B币劵，2为会员购优惠券，3为漫画福利券，4为会员购运费券每个月28号自动领取(非会员默认跳过任务)
 export bzbicd="" #true B币券过期前进行充电，只会在每个月28号运行
 export bzcdmid="" #充电up主id，不填默认自己，只会在每个月28号运行
 export bztbdz="" #投币点赞true 默认不点赞
 ####################################################
 定时一天一次
 aid获取：https://api.bilibili.com/x/web-interface/view?bvid=BVXXXXXXXX（手动填入bvid或者抓包）
 cron: 5 10 * * *
*/
const $ = new Env('B站签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const theday = new Date().getDate();
const {log} = console;
const Notify = 1; //0为关闭通知，1为打开通知,默认为1
//////////////////////
bzck = process.env.bzck;
mid2 = process.env.bzcdmid;
tb = process.env.bztb;
dhyb = process.env.bzdhyb;
vipgift = process.env.bzvipgift;
bicd = process.env.bzbicd;
tbdz = process.env.bztbdz; 
let bzckArr = [];
let msg = '';


!(async () => {

	if (!(await Envs()))
		return;
	else {



		log(`\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
			new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
			8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);

		log(`\n=================== 共找到 ${bzckArr.length} 个账号 ===================`)

		for (let index = 0; index < bzckArr.length; index++) {

			let num = index + 1
			log(`\n========= 开始【第 ${num} 个账号】=========\n`)

			cookies = bzckArr[index];
			bili_jct = cookies.match(/bili_jct=(.*?);/)[1]
			header = JSON.parse(`{"Connection":"keep-alive","Accept-Encoding":"gzip, deflate, br","Cache-Contro":"max-age=0","Cookie":"${cookies}","User-Agent":"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36","Accept-Language":"zh-cn","Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"}`);
			msg += `\n第${num}个账号运行结果：`
			await getBvid();
			await getinfo();
			await check_live_status();//查金银瓜子数量
			await doSign();
			await $.wait(5 * 1000);
			await live_sign();//直播签到
			await $.wait(5 * 1000);
			await manga_sign();//漫画签到
			await $.wait(5 * 1000);
			await sharebv();//分享视频
			await $.wait(5 * 1000);
			await playbv();//播放视频
			if(tb == 'true'){
			  log('已开启随机视频投币功能')
			    for (var i = 0;i<bvid.length;i++) {
                  await coin_add(bvid[i]);//投币
				  await $.wait(2 * 1000);
                }
              log('已完成投币任务')
			  msg +='\n【每日投币】已完成投币任务'
			}else{
			  log('未开启投币功能')
			}
			if(dhyb == 'true'){
			  log('已开启银瓜子兑换硬币功能')
			  await silver2coin();
			} else{
			  log('未开启银瓜子兑换硬币功能')
			  msg +='\n未开启银瓜子兑换硬币功能'
			}
			if(bzvip !='正式会员' && theday == 28){
			  await vip_privilege_receive();//兑换礼品
			  await $.wait(3 * 1000);
			  await vip_manga_reward();//领漫画福利

			}
            if(bicd == 'true' && theday == 28){
			  await elec_pay();//B币充电
			} else{
			  log('日期未到28日或未开启B币充值')
			  msg +='\n日期未到28日或未开启B币充值'
			}
			await checktask();//查任务完成情况
			await $.wait(2 * 1000);

		}
		await SendMsg(msg);
	}

})()
	.catch((e) => log(e))
	.finally(() => $.done())
//获取个人信息
function getinfo() {
  return new Promise((resolve) => {
    let url = {
        url: 'https://api.bilibili.com/x/web-interface/nav',
        headers: header,
    }

    $.get(url, (err, resp, data) => {
      try {
        if (err) {
          console.log(`${JSON.stringify(err)}`)
          console.log(`${$.name} API请求失败，请检查网路重试`);
        } else {
          let result = JSON.parse(data);
		  mid = result.data.mid
		  if(result.data.level_info.next_exp != '--'){
            var exp = parseInt(result.data.level_info.next_exp) - parseInt(result.data.level_info.current_exp)
			var needexp = exp.toString()
		  }else{
			var needexp = '未知'
		  }
		  if(result.data.vipStatus == 0){
            bzvip = '正式会员'
			var vipdate = '非会员'
		  }else if(result.data.vipStatus == 1 && result.data.vip_label.label_theme == 'vip'){
			bzvip = '大会员'
			var vipdate = getLocalTime(result.data.vipDueDate)
		  }else if(result.data.vipStatus == 1 && result.data.vip_label.label_theme == 'annual_vip'){
			bzvip = '年度大会员'
			var vipdate = getLocalTime(result.data.vipDueDate)
		  }else if(result.data.vipStatus == 1 && result.data.vip_label.label_theme == 'ten_annual_vip'){
		    bzvip = '十年大会员'
			var vipdate = getLocalTime(result.data.vipDueDate)
		  }else if(result.data.vipStatus == 1 && result.data.vip_label.label_theme == 'hundred_annual_vip'){
            bzvip = '百年大会员'
			var vipdate = getLocalTime(result.data.vipDueDate)
		  }
          log(`【账号信息】${result.data.uname}(ID:${mid})\n【会员等级】${bzvip}\n【会员到期】${vipdate}\n【账号等级】Lv.${result.data.level_info.current_level}\n【账号经验】${result.data.level_info.current_exp}|还要${needexp}经验可以升级\n【账号资本】硬币${result.data.money}个；B币${result.data.wallet.bcoin_balance}个`)

		
		} 
      } catch (e) {
        $.logErr(e, resp)
      } finally {
        resolve();
      }
    })
  })
}
/**
 * 登录+5经验+1硬币
 */
function doSign(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://www.bilibili.com/',
			headers: header,
		}
		$.get(url, async (error, response, data) => {
			try {
				if (error) {
					console.log(`${JSON.stringify(err)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else {
					log('【B站每日登录】登录成功+5经验+1硬币')
					msg += '\n【B站每日登录】登录成功+5经验+1硬币'
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
 * B站直播签到
 */
function live_sign(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://api.live.bilibili.com/xlive/web-ucenter/v1/sign/DoSign',
			headers: header,
		}
		$.get(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data);
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else if(result.code == 0){
					log(`【B站直播】签到成功，获得${result.data.text},今天是第${result.data.hadSignDays}天完成签到`)
					msg += `\n【B站直播】签到成功，获得${result.data.text},今天是第${result.data.hadSignDays}天完成签到`
                }else if(result.code == 1011040 && result.message == '今日已签到过,无法重复签到'){
                    log('【B站直播】今日已签到过,无法重复签到')
                    msg +='\n【B站直播】今日已签到过'
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
 * B站漫画签到
 */
function manga_sign(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://manga.bilibili.com/twirp/activity.v1.Activity/ClockIn',
			headers: header,
			body: 'platform=ios'
		}
		$.post(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data);
				if (result.msg == 'clockin clockin is duplicate') {
					log('【B站漫画签到】今日已签到过,无法重复签到')
                    msg +='\n【B站漫画签到】今日已签到过'
				} else if(result.code == 0){
					log('【B站漫画签到】签到成功')
					msg += `【B站漫画签到】签到成功`
                } else{
					log(`${JSON.stringify(error)}`)
                    log(`${$.name} API请求失败，请检查网路重试`);
					msg += `\n【B站漫画签到】签到失败`
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
 * 分享视频
 */
function sharebv(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://api.bilibili.com/x/web-interface/share/add',
			headers: header,
			body: `bvid=${BVid}&csrf=${bili_jct}`
		}
		$.post(url, async (error, response, data) => {
			try {
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else {
					log('【每日分享视频】任务完成+5经验')
					msg += '\n【每日分享视频】任务完成+5经验'
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
 * 播放视频
 */
function playbv(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://api.bilibili.com/x/click-interface/web/heartbeat',
			headers: header,
			body: `bvid=${BVid}&csrf=${bili_jct}&played_time=2`
		}
		$.post(url, async (error, response, data) => {
			try {
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else {
					log('【每日观看视频】任务完成+5经验')
					msg += '\n【每日观看视频】任务完成+5经验'
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
 * 投币
 */
function coin_add(id) {
	return new Promise((resolve) => {
		var dz = getdz();
		let url = {
			url: 'https://api.bilibili.com/x/web-interface/coin/add',
			headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36',
                'content-type': 'application/x-www-form-urlencoded',
                'referer': 'https://www.bilibili.com/video/'+ BVid,
                'cookie': cookies
			},
			body: `bvid=${id}&multiply=1&select_like=${dz}&cross_domain=true&csrf=${bili_jct}`
		}
		$.post(url, async (error, response, data) => {
			try {
                let result =JSON.parse(data)
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else if(result.code == 0) {
					log('【每日投币】投币成功')
					msg += '\n【每日投币】投币成功'
				} else if(result.code == 34005) {
					log('【每日投币】超过投币上限啦')
					msg += '\n【每日投币】超过投币上限啦'
				} else if(result.code == -104) {
					log('【每日投币】硬币不足无法投币')
					msg += '\n【每日投币】硬币不足无法投币'
				} else{
					log(result.message)
					msg += `\n${result.message}`
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		})
	})
}
//随机取一个bvid
function getBvid(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://api.bilibili.com/x/web-interface/dynamic/region?pn=3&ps=12&rid=129',
			headers: header,
		}
		$.get(url, async (error, response, data) => {
			try {
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else {
					bvid = uniq(data.match(/(BV[A-Za-z0-9]{10})/g)).slice(0,5)
                    BVid = data.match(/(BV[A-Za-z0-9]{10})/)[0]
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
//查任务完成状态
function checktask(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://api.bilibili.com/x/member/web/exp/reward',
			headers: header,
		}
		$.get(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data)
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else {
					log(`每日登录：${result.data.login}，每日观看视频：${result.data.watch}，每日投币获得：${result.data.coins}/50经验，每日分享视频：${result.data.share}\n有延迟，一般任务完成后过一段时间才会刷新`)
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
//查金银瓜子状态
function check_live_status(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://api.live.bilibili.com/pay/v1/Exchange/getStatus',
			headers: header,
		}
		$.get(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data)
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else {
					log(`B站直播金瓜子数：${result.data.gold}，银瓜子数：${result.data.silver}`)
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
//银瓜子换硬币
function silver2coin(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://api.live.bilibili.com/xlive/revenue/v1/wallet/silver2coin',
			headers: header,
			body: `csrf=${bili_jct}`
		}
		$.post(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data)
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else if(result.message == '每天最多能兑换 1 个') {
					log('【B站银瓜子换硬币】今天已经兑换过了')
					msg += '\n【B站银瓜子换硬币】今天已经兑换过了'
				} else if(result.message == '兑换成功'){
                    log(`【B站银瓜子换硬币】兑换1个硬币成功，剩余银瓜子：${result.data.silver}`)
				    msg += `\n【B站银瓜子换硬币】兑换1个硬币成功，剩余银瓜子：${result.data.silver}`
				} else {
                    log('【B站银瓜子换硬币】银瓜子不够，兑换失败')
					msg += '\n【B站银瓜子换硬币】银瓜子不够，兑换失败'
				}
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
//大会员每月领福利
function vip_privilege_receive(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let gift = getvipgift();
		let url = {
			url: 'https://api.bilibili.com/x/vip/privilege/receive',
			headers: header,
			body: `type=${gift}&csrf=${bili_jct}`
		}
		$.post(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data)
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else if(result.message == '当前非大会员') {
					log('【大会员每月领福利】领取失败，当前账号不是大会员')
					msg += '\n【大会员每月领福利】领取失败，当前账号不是大会员'
				} else if(result.code == 0){
                    log(`【大会员每月领福利】兑换奖励成功`)
				    msg += '\n【大会员每月领福利】兑换奖励成功'
				} else if(result.code == 69801)  {
                    log('【大会员每月领福利】你已领取过该权益')
					msg += '【大会员每月领福利】你已领取过该权益'
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
//大会员每月领漫画阅读券
function vip_manga_reward(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: 'https://manga.bilibili.com/twirp/user.v1.User/GetVipReward',
			headers: header,
			body: '{"reason_id": 1}'
		}
		$.post(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data)
				if (error) {
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
				} else if(result.msg == '已经领取过该奖励或者未达到领取条件哦~') {
					log('【大会员每月领漫画福利】已经领取过该奖励或者未达到领取条件哦~')
					msg += '\n【大会员每月领漫画福利】已经领取过该奖励或者未达到领取条件哦~'
				} else if(result.code == 0){
                    log(`【大会员每月领漫画福利】兑换奖励成功`)
				    msg += '\n【大会员每月领漫画福利】兑换奖励成功'
				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		}, timeout)
	})
}
//B币券给指定up主充电，可充自己
function elec_pay(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		midd = getcdid();
		let url = {
			url: 'http://api.bilibili.com/x/ugcpay/web/v2/trade/elec/pay/quick',
			headers: header,
			body: `bp_num=2&is_bp_remains_prior=true&up_mid=${midd}&otype=up&oid=${midd}&csrf=${bili_jct}`
		}
		$.post(url, async (error, response, data) => {
			try {
                let result = JSON.parse(data)
				if (result.code == 88214) {
					log('【用B币给up主充电】up主未开通充电')
					msg += '\n【用B币给up主充电】up主未开通充电'
				} else if(result.data.status == 4) {
					log(`【用B币给up主充电】充值${result.data.bp_num}个B币并获得${result.data.exp}经验`)
					msg += `\n【用B币给up主充电】充了${result.data.bp_num}个B币并获得${result.data.exp}经验`
				} else if(result.data.status == -2 || result.data.status == -4){
                    log(`【用B币给up主充电】充电失败，B币少于2或者是B币数量不足`)
				    msg += '\n【用B币给up主充电】充电失败，B币少于2或者是B币数量不足'
				} else if(error){
					console.log(`${JSON.stringify(error)}`)
                    console.log(`${$.name} API请求失败，请检查网路重试`);
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
	if (bzck) {
		if (bzck.indexOf("@") != -1) {
			bzck.split("@").forEach((item) => {
				bzckArr.push(item);
			});
		} else if (bzck.indexOf("\n") != -1) {
			bzck.split("\n").forEach((item) => {
				bzckArr.push(item);
			});
		} else {
			bzckArr.push(bzck);
		}
	} else {
		log(`\n 【${$.name}】：未填写变量 bzck`)
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
/**
 * 时间戳转日期
 */
function getLocalTime(nS) {  
 return new Date(parseInt(nS)).toLocaleString().replace(/:\d{1,2}$/,' ');  
}

function getcdid(){
	if(typeof(mid2) == 'undefined' || mid2 == ''){
	   log('检测到没有填写充电up主id，默认为自己充电')
       return mid
	}else{
		log(`指定为id：${mid2}充电`)
       return mid2
	}
}
function getdz(){
	if(tbdz == 'true'){
       return('1')
	}else{
       return('0')
	}
}
function getvipgift(){
	if(typeof(vipgift) == 'undefined' || vipgift == ''){
	   log('检测到没有填写大会员福利，默认选择B币券')
       return('1')
	}else{
		log(`你选择的福利是：${vipgift}`)
       return vipgift
	}
}
function uniq(array){
    var temp = []; 
    for(var i = 0; i < array.length; i++){
        if(temp.indexOf(array[i]) == -1){
            temp.push(array[i]);
        }
    }
    return temp;
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
