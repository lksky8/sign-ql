/*
 作者：https://github.com/lksky8/sign-ql/
 日期：2022-7-22
 网站：3dmgame论坛签到
 功能：签到、抽奖，金币可换现金买游戏
 变量：bbs3dmck='cookie'  多个账号用换行分割 
 定时一天3次
 【3DM论坛 每日打卡】=68;【3DM论坛 热门游戏区】帖子=tid:6272162;fid:3357;
 【3DM论坛 国产单机游戏爱好者】任务=110;【3DM论坛国产单机游戏讨论区】帖子=tid:6272166;fid:3340;
 【3DM网游加速器助你畅玩国外内多款热门游戏！】任务=96;【3DM论坛网游加速器】帖子=tid:6272167;fid:3469;
 【永久免费】《风灵月影》修改器工具=126;【风灵月影修改器大全】帖子=tid:6274349;fid:3217;
 玩家用户组【论坛常客】=70 【论坛达人】=71 【论坛居民】=72  【游戏之神】=73
 特殊任务：
 一周一次--------MOD站福利【需完成连锁前置任务后才可领取】=128；【3DM MOD站欢迎您】帖子=tid:5751666;fid:2661
 cron: 0 8,13,20 * * *
 */

const $ = new Env('3dmgame论坛签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const {log} = console;
const Notify = 1; //0为关闭通知，1为打开通知,默认为1
//////////////////////
let bbs3dmck = process.env.bbs3dmck;
let bbs3dmckArr = [];
let msg = '';


!(async () => {

	if (!(await Envs()))
		return;
	else {

		log(`\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
			new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
			8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);

		log(`\n=================== 共找到 ${bbs3dmckArr.length} 个账号 ===================`)


		for (let index = 0; index < bbs3dmckArr.length; index++) {


			let num = index + 1
			log(`\n========= 开始【第 ${num} 个账号】=========\n`)

			ck = bbs3dmckArr[index].split('&');
			msg += `\n第${num}个账号运行结果：`
			await checkgold();
			log('开始做论坛任务');
            //开始
			log('做 【3DM论坛 每日打卡】任务')
			await dotask('apply',68); //apply=接受任务，draw=完成任务
			for (i = 0; i < 3; i++) {
                await reply(6272162,3357);
                await $.wait(35 * 1000);
            }
            await dotask('draw',68);
            //结束
	        log('做【3DM论坛 国产单机游戏爱好者】任务')
			await dotask('apply',110); 
			for (i = 0; i < 3; i++) {
                await reply(6272166,3340);
                await $.wait(35 * 1000);
            }
            await dotask('draw',110);
            //
			log('做 【3DM网游加速器助你畅玩国外内多款热门游戏！】任务')
            await dotask('apply',96); 
            for (i = 0; i < 3; i++) {
                await reply(6272167,3469);
                await $.wait(35 * 1000);
            }
            await dotask('draw',96);
            //
			log('做 【永久免费】《风灵月影》修改器工具 任务')
            await dotask('apply',126); 
			for (i = 0; i < 3; i++) {
                await reply(6274349,3217);
                await $.wait(35 * 1000);
            }
            await dotask('draw',126);
            //
			if(njifen > 249 && njifen <= 1999 ){
				
				log('做 玩家用户组【论坛常客】 任务') //会按等级升级的【论坛常客】=70 【论坛达人】=71 【论坛居民】=72  【游戏之神】=73
                await dotask('apply',70); 
                await $.wait(2 * 1000);

			} else if(njifen > 1999 && njifen <= 8999){

                log('做 玩家用户组【论坛达人】 任务') 
                await dotask('apply',71); 
                await $.wait(2 * 1000);

			} else if(njifen > 17999 && njifen <= 64999){

				log('做 玩家用户组【论坛居民】 任务') 
                await dotask('apply',72); 
                await $.wait(2 * 1000);

			} else if(njifen >= 65000){

                log('做 玩家用户组【游戏之神】 任务') 
                await dotask('apply',73); 
                await $.wait(2 * 1000);

			} else{
				log('等级不足，等积分大于250再领取任务')
			}

            log('每日任务完成,尝试做一周的特殊任务')
            //
            await dotask('apply',128); 
            await $.wait(1 * 1000);
            await reply(5751666,2661);
            await $.wait(1 * 1000);
            await dotask('draw',128);
            msg += `\n3dmgame论坛任务操作完成，建议每日3次以防万一`
            await checkgold();
		}
		await SendMsg(msg);
	}

})()
	.catch((e) => log(e))
	.finally(() => $.done())


/**
 * 做任务
 */
function dotask(task,taskid) {
	return new Promise((resolve) => {
		let url = {
			url: `https://bbs.3dmgame.com/home.php?mod=task&do=${task}&id=${taskid}`,
			headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0",
				"Cookie": `${ck}`
            }
		}

		$.get(url, async (error, response, data) => {
			try {

                let message = getinformation('"alert_info">\n<p>','<script type="text/javascript" reload="1"',data)
				if (message == '任务申请成功 '){

					log('任务申请成功 ')
					
				} else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 68){

					log('完成 【3DM论坛 每日打卡】任务')
			        msg += `\n完成 【3DM论坛 每日打卡】任务`

                } else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 110){

					log('完成 【3DM论坛 国产单机游戏爱好者】任务')
			        msg += `\n完成 【3DM论坛 国产单机游戏爱好者】任务`
					
				} else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 96){

					log('完成 【3DM网游加速器助你畅玩国外内多款热门游戏！】任务')
			        msg += `\n完成 【3DM网游加速器助你畅玩国外内多款热门游戏！】任务`
	
                } else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 126){

					log('完成 【永久免费】《风灵月影》修改器工具 任务')
			        msg += `\n完成 【永久免费】《风灵月影》修改器工具 任务`

				} else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 70){

					log('完成 玩家用户组【论坛常客】 任务')
			        msg += `\n完成 玩家用户组【论坛常客】 任务`

				}else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 71){

                    log('完成 玩家用户组【论坛达人】 任务')
			        msg += `\n完成 玩家用户组【论坛达人】 任务`

				}else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 72){

                    log('完成 玩家用户组【论坛居民】 任务')
			        msg += `\n完成 玩家用户组【论坛居民】 任务`
				}else if(message == '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' && taskid == 73){

                    log('完成 玩家用户组【游戏之神】 任务')
			        msg += `\n完成 玩家用户组【游戏之神】 任务`

				}else{
					log('任务失败，可能是还没到时间或者已经完成了')
				}
			
			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		})
	})
}
//回复帖子
function reply(tid,fid) {
	return new Promise((resolve) => {
		let random = randomInt(1,10)
		let time = timestampS()
		let url = {
			url: `https://bbs.3dmgame.com/forum.php?mod=post&action=reply&fid=${fid}&tid=${tid}&extra=page%3D1&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1`,
			headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:85.0) Gecko/20100101 Firefox/85.0",
				"Cookie": `${ck}`
            },
			body: `message=%E6%AF%8F%E6%97%A5%E7%AD%BE%E5%88%B0%2B${random}&posttime=${time}&formhash=${formhash}&usesig=&subject=%20%20`,
		}

		$.post(url, async (error, response, data) => {
			try {

			  let message = getinformation('非常感谢，','，现在将转入主题页',data)
        
				if (message == '回复发布成功') {

                    log('回帖成功,等待35秒后回复下个帖子')

				} else {

					log('回复失败，未知原因')
					msg += `\n回复失败，未知原因`

				}

			} catch (e) {
				log(e)
			} finally {
				resolve();
			}
		})
	})
}
//查积分
function checkgold(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://bbs.3dmgame.com/home.php?mod=spacecp&ac=credit&op=base`,
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.198 Safari/537.36",
				"Cookie": '_ga=GA1.2.1536251836.1648362855; Hm_lvt_41e10dae8e5d7e8cc907484abce82fb9=1657789308,1657960493,1658051008,1658132409; uchome_2132_saltkey=N0oeh0PO; uchome_2132_lastvisit=1658132989; uchome_2132_visitedfid=256; uchome_2132_con_request_uri=https%3A%2F%2Fbbs.3dmgame.com%2Fconnect.php%3Fmod%3Dlogin%26op%3Dcallback%26referer%3Dforum.php%253Fmod%253Dviewthread%2526tid%253D6317997%2526extra%253Dpage%25253D1%2526page%253D1; uchome_2132_client_created=1658136795; uchome_2132_client_token=9F83FB26A02602694C2EA0912123CE08; uchome_2132_ulastactivity=1658136795%7C0; uchome_2132_auth=8fe6LugBBxo7GACQ8EZn1jmOGqVK6UOkTq7e9CKF0WuVHIQxHXkqzyKSo5zoACh6132amggoZkn9KqxHqx%2BACDe1uk9N; uchome_2132_connect_login=1; uchome_2132_connect_is_bind=1; uchome_2132_connect_uin=9F83FB26A02602694C2EA0912123CE08; uchome_2132_stats_qc_login=3; uchome_2132_security_cookiereport=e936eQMov2mrxsZ0Lpvh%2F0Wbul5lY7x6nVZzZDfQ2ILqvm5R1nr0; uchome_2132_connect_last_report_time=2022-07-18; uchome_2132_smile=1D1; uchome_2132_st_t=8145175%7C1658136816%7C342422dc82de26f408957c0e030509d3; uchome_2132_forum_lastvisit=D_256_1658136816; uchome_2132_viewid=tid_6317911; uchome_2132_st_p=8145175%7C1658137808%7C6d7884c485a5a8692ae4bfaa35716b2e; uchome_2132_lastact=1658137857%09connect.php%09check; Hm_lpvt_41e10dae8e5d7e8cc907484abce82fb9=1658137857'
            },
		}

		$.get(url, async (error, response, data) => {
			try {

				if (data != null) {
                    let jinyuan = getinformation('金元: </em>','  &nbsp; </li>',data);
					let jifen = getinformation('class="showmenu">积分: ','</a>',data);
					njifen = Number(jifen)
					username = getinformation('访问我的空间">','</a></strong>',data);
					formhash = getinformation('formhash=','">退出</a>',data);
					log(`[${username}]目前金元：${jinyuan}，目前积分：${jifen}`)
					msg += `[${username}]目前金元：${jinyuan}，目前积分：${jifen}`

				} else {

					log('获取积分失败')
					msg += `\n获取个人信息失败，查看Cookie是否过期`

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
	if (bbs3dmck) {
		if (bbs3dmck.indexOf("@") != -1) {
			bbs3dmck.split("@").forEach((item) => {
				bbs3dmckArr.push(item);
			});
		} else if (bbs3dmck.indexOf("\n") != -1) {
			bbs3dmck.split("\n").forEach((item) => {
				bbs3dmckArr.push(item);
			});
		} else {
			bbs3dmckArr.push(bbs3dmck);
		}
	} else {
		log(`\n 【${$.name}】：未填写变量 bbs3dmck`)
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

function getinformation( key1,key2, str ) { 

  var m = str.match( new RegExp(key1+'(.*?)'+key2) );
  return m ? m[ 1 ] : false;

}

/**
 * 随机整数生成
 */
function randomInt(min, max) {
	return Math.round(Math.random() * (max - min) + min)
}

/**
 * 获取秒时间戳
 */
function timestampS(){
	return Date.parse(new Date())/1000;
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
