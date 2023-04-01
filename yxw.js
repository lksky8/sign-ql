/**
 作者：https://github.com/lksky8/sign-ql/
 日期：2023-4-1
 网站：游侠网APP签到
 功能：签到、抽奖，金币可换现金买游戏
 变量：yxwlogin='账号&密码'  多个账号用@分割 
 定时：一天一次
 cron：10 8 * * *
 需要安装MD5模块，node
 */

 const md5 = require('md5');
 const $ = new Env('游侠网');
 const notify = $.isNode() ? require('./sendNotify') : '';
 const {log} = console;
 const Notify = 1; //0为关闭通知，1为打开通知,默认为1
 //////////////////////
 let yxw = process.env.yxwlogin;
 let yxwArr = [];
 let data = '';
 let msg = '';
 let loginBack = 0;
 let token = '';
 let name = '';
 let allcoin ='';
 let cash = '';
 
 !(async () => {
 
    if (!(await Envs()))
        return;
    else {
 

 
        log(`\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
            new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
            8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);

        
        log(`\n=================== 共找到 ${yxwArr.length} 个账号 ===================`)
 
        for (let index = 0; index < yxwArr.length; index++) {
 
 
            let num = index + 1
            log(`\n========= 开始【第 ${num} 个账号】=========\n`)
            yxw = yxwArr[index].split('&');
            msg += `\n第${num}个账号运行结果：`
            log('【开始登录】');
            await login();  //登录
            await $.wait(2 * 1000);
            if (loginBack != 1){

                log('\n【开始查询签到状态】');
                await getSign();
                await $.wait(2 * 1000);  
                log('\n【开始查询新旧用户签到】')
                await checknew();
                await $.wait(2 * 1000); 
            }
            await checkcoin();   //查金币
        }
        await SendMsg(msg);
    }
 
 })()
    .catch((e) => log(e))
    .finally(() => $.done())

 /**
  * 登录  
  */
  function login(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let time10 = timestampS()
        let signature = md5(`username-${yxw[0]}-time-${time10}-passwd-${yxw[1]}-from-feedearn-action-loginBGg)K6ng4?&x9sCIuO%C2%{@TJ?fnFJ,bZKy/[/EWnw9UsC$@1`)
        let url = {
            url: `https://i.ali213.net/api.html`,    
            headers: { 
                "Connection": "keep-alive",
                "Accept": "application/json, text/plain, */*",
                "User-Agent": "Apache-HttpClient/UNAVAILABLE (java 1.4)",
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `action=login&username=${yxw[0]}&passwd=${yxw[1]}&time=${time10}&from=feedearn&signature=${signature}`,
        }

        $.post(url, async (error, response, data) => {
            try {
                let result = JSON.parse(data);
                if (result.status == 1) {
                    token = result.data.token;
                    name = result.data.userinfo.username
                    log(`${result.msg},${name}`)
                } else {  
                    loginBack = 1;
                    log(`【登录失败】${result.message}`) 
                    msg += `\n【登陆失败】${result.message}`
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
  * 查询签到状态并签到
  */
function getSign(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api3.ali213.net/feedearn/signing?action=set&token=${token}`,    
            headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": "ali213app",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'api3.ali213.net',
                "Accept-Language": 'zh-Hans-CN;q=1'
            },
            body: 'count=5&paged=1',
        }
 
        $.post(url, async (error, response, data) => {
            try {
 
                let result = JSON.parse(data);
                if (result.data.status == 1 && result.data.msg == '\u7b7e\u5230\u6210\u529f') { //签到成功
                    log(`签到成功，获得金币:${result.data.coins}`)
                    msg += `\n签到成功，获得金币:${result.data.coins}`
                    await $.wait(2 * 1000);
                } else if (result.data.status == 0 && result.data.msg == '\u7b7e\u5230\u5931\u8d25\uff0c\u91cd\u590d\u7b7e\u5230'){  
                    log(`账号[${name}]今天已签到，签到日期：${result.signinfo.qiandaotime}`)
                    msg += `\n账号[${name}]今天已经签到了`
                } else if (result.data.status == 0 && result.data.msg == '\u7528\u6237\u672a\u767b\u5f55\u6216\u767b\u5f55\u5df2\u8d85\u65f6'){  
                    log(`\n用户未登录或登录已超时`)
                    msg += `\n用户未登录或登录已超时`
                } else if (result == null){
                    log(`\n账号[${name}]签到失败：原因未知`)
                    msg += `\n账号[${name}]签到失败：签到失效`
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
* 看看是不是新用户
*/
function checknew(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api3.ali213.net/feedearn/newusercheck?token=${token}`,    
            headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": "ali213app",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'api3.ali213.net',
                "Accept-Language": 'zh-Hans-CN;q=1'
            }
        }
 
        $.get(url, async (error, response, data) => {
            try {
                let result = JSON.parse(data);
                if (result.status == 3 && result.msg == '\u60a8\u662f\u6700\u65b0\u7528\u6237\uff0c\u53ef\u4ee5\u8df3\u6700\u65b0\u6d3b\u52a8\u9875\u9762\u4e86') { 
                    log(`账号[${name}]您是最新用户，可以跳最新活动页面了`)
                    await newusersign();
                    await $.wait(2 * 1000);
                } else {
                    log(`账号[${name}]老用户了，去周签`)
                    msg +=`\n账号[${name}]老用户了，去周签`
                    log('\n【开始一周签到】')
                    await weeksign();
                    await $.wait(2 * 1000); 
                    await weeksigncheck();  //查周签
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
  * 查一周签到时间，到时间自动抽奖
  */
function weeksigncheck(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api3.ali213.net/feedearn/oldusermonthactivity?token=${token}`,    
            headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Accept": "*/*",
                "Connection": "keep-alive",
                "Host": 'api3.ali213.net',
                "User-Agent": "ali213app",
                "Accept-Language": 'zh-Hans-CN;q=1',
                "Content-Length": "0"
            },
        }

        $.get(url, async (error, response, data) => {
            try {
                let result = JSON.parse(data);
                let weeksingday = result.data.signday
                if (result.status == 1) { 
                    log(`第${weeksingday}天完成签到，第七天可以抽奖领取奖励\n`)
                    msg += `\n账号[${name}]第${weeksingday}天完成签到，第七天可以抽奖领取奖励`
                    if(weeksingday == 7){
                        log(`今天是第七天了，可以抽奖领取奖励`)
                        await kjl();
                    }
                } else {
                    log('查询失败')
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
  *查询金币信息   
  */
function checkcoin(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api3.ali213.net/feedearn/userbaseinfo?token=${token}`,    
            headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Accept": "*/*",
                "Connection": "keep-alive",
                "Host": 'api3.ali213.net',
                "User-Agent": "ali213app",
                "Accept-Language": 'zh-Hans-CN;q=1',
                "Content-Length": "0"
            },
        }

        $.get(url, async (error, response, data) => {
            try {

                let result = JSON.parse(data);
                if (result.username == `${name}`) {
                    allcoin = result.coins
                    cash = result.available
                    log('\n【开始查询金币信息】')
                    log(`账号[${name}]总金币：${allcoin}个，可用现金：${cash}（忽略小数点）`)
                    msg += `\n账号[${name}]总金币：${allcoin}个，可用现金：${cash}（忽略小数点）`
                } else {  
                    log(`查询失败`)
                    msg += `\n查询失败`
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
  * 一周签到  
  */
function weeksign(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api3.ali213.net/feedearn/olduseractivitysign?token=${token}`,    
            headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": "ali213app",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'api3.ali213.net',
                "Accept-Language": 'zh-Hans-CN;q=1'
            },
        }
 
        $.get(url, async (error, response, data) => {
            try {
                let result = JSON.parse(data);
                if (result.status == 1 && result.msg == '\u7b7e\u5230\u6210\u529f') { //\u7b7e\u5230\u6210\u529f签到成功
                    log('周签成功')
                } else if(result.msg == '\u60a8\u4eca\u5929\u5df2\u7b7e\u5230') {  
                    log(`账号[${name}]礼包周签今天已签到`)
                } else {
                   log('查询签到状态失败')
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
* 新用户签到
*/
function newusersign(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api3.ali213.net/feedearn/newuseractivitysign?token=${token}`,    
            headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": "ali213app",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'api3.ali213.net',
                "Accept-Language": 'zh-Hans-CN;q=1'
            },
        }
 
        $.get(url, async (error, response, data) => {
            try {
                let result = JSON.parse(data);
                if (result.status == 1 && result.msg == '\u7b7e\u5230\u6210\u529f') { //\u7b7e\u5230\u6210\u529f签到成功
                    log('新用户福利签到成功')
                } else if(result.msg == '\u60a8\u4eca\u5929\u5df2\u7b7e\u5230') {  
                    log(`账号[${name}]新用户福利今天已签到`)
                } else {
                   log('查询签到状态失败')
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
  * 第七天抽奖
*/
function kjl(timeout = 3 * 1000) {
    return new Promise((resolve) => {
        let url = {
            url: `https://api3.ali213.net/feedearn/olduseractivityprizing?token=${token}`,    
            headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": "ali213app",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'api3.ali213.net',
                "Accept-Language": 'zh-Hans-CN;q=1'
            },
        }

        $.get(url, async (error, response, data) => {
            try {
                let result = JSON.parse(data);
                if (result.status == 0 && result.msg == '\u672a\u5230\u62bd\u5956\u65e5\u671f') { //\u672a\u5230\u62bd\u5956\u65e5\u671f   未到抽奖日期
                    log('未到抽奖日期')
                    msg += `\n账号[${name}]今天不是抽奖日`
                } else if (result.status == 1 && result.msg == '\u606d\u559c\u4e2d\u5956'){
                    log(`开奖并获得了${result.data.name}`)
                    msg += `\n账号[${name}]开奖并获得了${result.data.name},游戏需要手动到APP查看cd-key`
                } else if (result.status == 0 && result.msg == '\u60a8\u5df2\u62bd\u8fc7\u5956\u4e86'){  
                    log(`今天已经抽过奖了`)
                    msg += `\n账号[${name}]今天已经抽过奖了`
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
	if (yxw) {
		if (yxw.indexOf("@") != -1) {
			yxw.split("@").forEach((item) => {
				yxwArr.push(item);
			});
		} else if (yxw.indexOf("\n") != -1) {
			yxw.split("\n").forEach((item) => {
				yxwArr.push(item);
			});
		} else {
			yxwArr.push(yxw);
		}
	} else {
		log(`\n 【${$.name}】：未填写变量 yxw`)
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
