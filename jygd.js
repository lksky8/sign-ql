/*
 作者：https://github.com/lksky8/sign-ql
 日期：7-11
 软件：APP分享
 功能：中石化加油广东APP签到
 备注：签到活动已结束
 变量：jygd='账号&密码 '  多个账号换行 分割
 定时一天一次

 cron: 5 10 * * *
 */

const $ = new Env('中石化加油广东APP签到');
const notify = $.isNode() ? require('./sendNotify') : '';
const crypto = require('crypto');
const NodeRSA = require('node-rsa');
const {log} = console;
const Notify = 1; //0为关闭通知，1为打开通知,默认为1
const debug = 1; //0为关闭调试，1为打开调试,默认为0
//////////////////////
let jygd = process.env.jygd;
let jygdArr = [];
const iv = 'L%n67}G/Mk@k%:~Y'
const clientkey = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnUKx2bWkp7flkIeNpLMwI3SA9217Zo4t9G3kgR4cx2n2UAxN7PZ70Q6wFh9zHq/3NJ8ddkGAVCv0rs7ebBodlkpXBxeTI9OGgZtx3x1GJLVw+nXqNXt51pXJHHaGXFFMAZYPfy9vcWhenQ9YQ+WsBxTIkH2TjvYdXcjlTKp+YnkpNpyXjhAg5VAjWnmJ06kikAOTGGusrgUgtNxDsu9EpAD8HE/Zr+zyUvOjWzGvPV2xr72JRj4pUAL8Df17Qj+t43ujsoLBy4cPdZB/Pru8uJgGSZj7dO8BkBcBu5y+c4Yi9bj07OwMGSMMFnuZCkWZaQ2cTObwodO9pEMd/rl8QwIDAQAB'
let data = '';
let msg = '';

!(async () => {

	if (!(await Envs()))
		return;
	else {



		log(`\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
			new Date().getTime() + new Date().getTimezoneOffset() * 60 * 1000 +
			8 * 60 * 60 * 1000).toLocaleString()} \n=============================================\n`);


		log(`\n=================== 共找到 ${jygdArr.length} 个账号 ===================`)

		if (debug) {
			log(`【debug】 这是你的全部账号数组:\n ${jygdArr}`);
		}


		for (let index = 0; index < jygdArr.length; index++) {


			let num = index + 1
			log(`\n========= 开始【第 ${num} 个账号】=========\n`)

			jygd = jygdArr[index].split('&');

			if (debug) {
				log(`\n 【debug】 这是你第 ${num} 账号信息:\n ${data}\n`);
			}

			msg += `\n第${num}个账号运行结果：`
			log('开始登录');
			await getnewserverkey();
			await $.wait(2 * 1000);
			await login();
			await $.wait(2 * 1000);
			log('开始签到');
			await doSign();

		}
		await SendMsg(msg);
	}

})()
	.catch((e) => log(e))
	.finally(() => $.done())


/**
 * 签到
 */
function doSign(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://m.gdoil.cn/webapi/usersign/addusersign`,
			headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": 'jygd_android_'+ accode +'_Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.101 Mobile Safari/537.36_5.4.7',
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'm.gdoil.cn',
                "Accept-Language": 'zh-cn'
            },
		}

		if (debug) {
			log(`\n【debug】=============== 这是 签到 请求 url ===============`);
			log(JSON.stringify(url));
		}

		$.post(url, async (error, response, data) => {
			try {
				if (debug) {
					log(`\n\n【debug】===============这是 签到 返回data==============`);
					log(data)
				}

				let result = JSON.parse(data);
				if (result.msg == '插入成功') {

					log(`签到成功，获得：`)
					msg += `\n签到成功，获得：`

				} else if (result.msg == '很抱歉，您今天已经签到过了') {

					log(`签到失败，今日已签到`)
					msg += `\n签到失败，今日已签到`

				} else {

					log(`签到失败，原因是：${result.msg}`)
                    msg += `\n签到失败，原因是：${result.msg}`

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
 * 获取最新数据包
 */
function getnewserverkey(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://m.gdoil.cn/gd/sys/collocateFunctions`,
			headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": "ijygd_android_",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'm.gdoil.cn',
                "Accept-Language": 'zh-Hans-CN;q=1'
            },
            body: 'serverkey=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAisPUFQ9b2nstxYMwaAaTKX2mjAKoMDbVuPNItJSREkZa426blKc%252B2grcxG9HwF8Av%252BMccs0UxoNVdRCMnndHMSsWSMXJbK8hZMizNRNVBXGa5X1HQqT65WVpMIIFKpeSvz6wE0PQ1naSg%252F7u5V5NZplZ%252BGJPtxOYNIKMxd%252B69ebt8Xd0W2hhUj%252BwBLosX%252B3mA%252BnnDgaa95qjL6Ax84WFC%252BUq3NtPBgPw0tcSGJfoFgUwCCvnVGpefyYreIxNP2b0%252FmJKL8Oh8zbdLh14fD3waThP7A6AkHyZFi6%252FjqbiTwO3HV75spZsac1SBuZWLhDeZyL0BM2ijnri%252FWQ0QAUqrwIDAQAB&s0OUQNQpaJeq7IpsUxvllA%253D%253D=id3rOfJk0n0Pck4kntbOCA%253D%253D&sign=373764756B81BCB8CCA906E5F6CCCCCC&XDwTDvv1PY2amPINQGWuMA%253D%253D=MizQxeRlF0mogfIzVSuHIRvKwEQPUMnn9hK3ASHG82Ae%252F0WpVsi1BBx3AQZpz7CE&UMPA5UPQq9S4yFFt6BLSCA%253D%253D=toKPsOZPtr%252FpDY%252FjT%252B3WsQ%253D%253D&Mjg%252BT001qTW6f959htWTfA%253D%253D=sgkCYL%252BmpSuE7fQ4rOlOBGsyB%252FgNp5VDTTeIG5ka6%252Fg%253D&isencrypt=1&clientkey=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAnUKx2bWkp7flkIeNpLMwI3SA9217Zo4t9G3kgR4cx2n2UAxN7PZ70Q6wFh9zHq%252F3NJ8ddkGAVCv0rs7ebBodlkpXBxeTI9OGgZtx3x1GJLVw%252BnXqNXt51pXJHHaGXFFMAZYPfy9vcWhenQ9YQ%252BWsBxTIkH2TjvYdXcjlTKp%252BYnkpNpyXjhAg5VAjWnmJ06kikAOTGGusrgUgtNxDsu9EpAD8HE%252FZr%252BzyUvOjWzGvPV2xr72JRj4pUAL8Df17Qj%252Bt43ujsoLBy4cPdZB%252FPru8uJgGSZj7dO8BkBcBu5y%252Bc4Yi9bj07OwMGSMMFnuZCkWZaQ2cTObwodO9pEMd%252Frl8QwIDAQAB&nj9PIsw7URBZX23dwlyi',
		}

		if (debug) {
			log(`\n【debug】=============== 这是 获取数据包 请求 url ===============`);
			log(JSON.stringify(url));
		}

		$.post(url, async (error, response, data) => {
			try {
				if (debug) {
					log(`\n\n【debug】===============这是 获取数据包 返回data==============`);
					log(data)
				}

				if (data != null) {

                    data = data.split(',');
                    let serveraeskey = serverkeydecrypt(data[1])//解密出服务器aeskey
					let serverkey = AesDecrypt(data[0],serveraeskey)//用服务器aeskey解密服务器rsa公钥
                    let getserverjson = JSON.parse(serverkey);//解密出data第一部分的内容，包含服务器rsa公钥
					let jmaeskey = serverkeyencrypt(getserverjson.data,'yUCpeutYLg11RwFu')//用获取到的服务器rsa公钥加密AESkey
					var urlserverrsa1 = encodeURIComponent(getserverjson.data)//url加密服务器rsa公钥
					var urlserverrsa2 = encodeURIComponent(urlserverrsa1)
                    var urljmaeskey1 = encodeURIComponent(jmaeskey)
					var urljmaeskey2 = encodeURIComponent(urljmaeskey1)
					let t = timestampMs();
					let time1 = AesEncrypt(`${t}6622572626`,'yUCpeutYLg11RwFu');
					let urltime1 = encodeURIComponent(encodeURIComponent(time1))
					let urltime2 = encodeURIComponent(encodeURIComponent(urltime1))
					let urlclientkey1 = encodeURIComponent(clientkey)
					let urlclientkey2 = encodeURIComponent(urlclientkey1)
					let md5pass = MD5(`${jygd[1]}`); //MD5加密密码大写
					let jmmd5pass = AesEncrypt(md5pass,'yUCpeutYLg11RwFu')
					let urljmmd5pass1 = encodeURIComponent(jmmd5pass)
					let urljmmd5pass2 = encodeURIComponent(urljmmd5pass1)
					let jmuser = AesEncrypt(`${jygd[0]}`,'yUCpeutYLg11RwFu')
					let urljmuser1 = encodeURIComponent(jmuser)
					let urljmuser2 = encodeURIComponent(urljmuser1)
					let signdata = `wZeKy8G8dbJYgD06vtTgdA===uGOuRotUfSSPdCbUtjb8sQ==&5HHk2cJhjzMvDcu/B5kpGg===KpXZshVgZ0c49gYcubZ5Cg==&XDwTDvv1PY2amPINQGWuMA===${urljmmd5pass1}&e4fsMNonbizjyhEvY/q00w===02FI+9Gn9Ur4tUBCoxcoKg==&wHeo7s49nvTacX2ewH5S+w===T6WarOSE6UG4QCfjDc0PCQ==&ZnvrP+6IyuG29fb+AHGx3A===bFgt8u6JxT7n9Fq6+0HtbN1Vy8V/haNuZTOPBtLzI8k=&Mjg+T001qTW6f959htWTfA==${urltime1}&PebxqIi7YKhNT91eg1Kbqw===/cfnLaSDOiBqXfAI8OcckA==&UMPA5UPQq9S4yFFt6BLSCA===toKPsOZPtr/pDY/jT+3WsQ==&aeskey=${urljmaeskey1}&clientkey=${urlclientkey1}&ptLix3p+b9lkoxVBN5Kcdw===6REGKn9GFbaIc+sT561q0AktJBV8oApRS3PQdCZgXish47K1yzrQLlQTq8CZiHiA&nj9PIsw7URBZX23dwlyi+w==${urljmuser1}&s0OUQNQpaJeq7IpsUxvllA===id3rOfJk0n0Pck4kntbOCA==&isencrypt=1&wBIbaRwOqZj2H/3PAkmITw===JprA988BFmBL/26Fcm09iw==&serverkey=${urlserverrsa1}&dlUm9icrisli8P1XXzF9NA===id3rOfJk0n0Pck4kntbOCA==&key=1e20957112ed5c5c3we73ee6fa631b9w`
					let md5sign = MD5(`${signdata}`)
					logindata = `e4fsMNonbizjyhEvY%252Fq00w%253D%253D=02FI%252B9Gn9Ur4tUBCoxcoKg%253D%253D&wBIbaRwOqZj2H%252F3PAkmITw%253D%253D=JprA988BFmBL%252F26Fcm09iw%253D%253D&5HHk2cJhjzMvDcu%252FB5kpGg%253D%253D=KpXZshVgZ0c49gYcubZ5Cg%253D%253D&serverkey=${urlserverrsa2}&s0OUQNQpaJeq7IpsUxvllA%253D%253D=id3rOfJk0n0Pck4kntbOCA%253D%253D&sign=${md5sign}&XDwTDvv1PY2amPINQGWuMA%253D%253D=${urljmmd5pass2}&UMPA5UPQq9S4yFFt6BLSCA%253D%253D=toKPsOZPtr%252FpDY%252FjT%252B3WsQ%253D%253D&Mjg%252BT001qTW6f959htWTfA%253D%253D=${urltime2}&isencrypt=1&clientkey=${urlclientkey2}&nj9PIsw7URBZX23dwlyi%252Bw%253D%253D=${urljmuser2}&PebxqIi7YKhNT91eg1Kbqw%253D%253D=%252FcfnLaSDOiBqXfAI8OcckA%253D%253D&wZeKy8G8dbJYgD06vtTgdA%253D%253D=uGOuRotUfSSPdCbUtjb8sQ%253D%253D&dlUm9icrisli8P1XXzF9NA%253D%253D=id3rOfJk0n0Pck4kntbOCA%253D%253D&ptLix3p%252Bb9lkoxVBN5Kcdw%253D%253D=6REGKn9GFbaIc%252BsT561q0AktJBV8oApRS3PQdCZgXish47K1yzrQLlQTq8CZiHiA&aeskey=${urljmaeskey2}&ZnvrP%252B6IyuG29fb%252BAHGx3A%253D%253D=bFgt8u6JxT7n9Fq6%252B0HtbN1Vy8V%252FhaNuZTOPBtLzI8k%253D&wHeo7s49nvTacX2ewH5S%252Bw%253D%253D=T6WarOSE6UG4QCfjDc0PCQ%253D%253D`

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
 * 登录
 */
function login(timeout = 3 * 1000) {
	return new Promise((resolve) => {
		let url = {
			url: `https://m.gdoil.cn/gd/user/userLogin`,
			headers: { 
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Accept": "*/*",
                "User-Agent": "ijygd_android_",
                "Content-Type": "application/x-www-form-urlencoded",
                "Host": 'm.gdoil.cn',
                "Accept-Language": 'zh-Hans-CN;q=1'
            },
            body: logindata,
		}

		if (debug) {
			log(`\n【debug】=============== 这是 登录 请求 url ===============`);
			log(JSON.stringify(url));
		}

		$.post(url, async (error, response, data) => {
			try {
				if (debug) {
					log(`\n\n【debug】===============这是 登录 返回data==============`);
					log(data)
				}

                data = data.split(',');
                let loginaeskey = serverkeydecrypt(data[1])//返回aeskey用于解密
				let loginalldata = AesDecrypt(data[0],loginaeskey)
				let logindatajson = JSON.parse(loginalldata);
                if (logindatajson.accode == null && logindatajson.msg == '用户名或者密码错误') {

                    log('获取信息失败，无法登录')
					msg += `\n获取信息失败，无法登录`

                } else if(logindatajson.msg == '用户名或者密码错误') {  

                    log(`【登录失败】用户名或者密码错误 `)
                    msg += `\n【登陆失败】用户名或者密码错误`

                } else if(logindatajson.msg == '登录成功!') {

                    accode = logindatajson.accode
                    log(`\n账号[${logindatajson.data.nickname}]登录成功，对应手机号：${logindatajson.data.phone}`)
					msg += `\n【登陆成功】用户名：${logindatajson.data.nickname}`
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
    if (jygd) {
        if (jygd.indexOf("\n") != -1) {
            jygd.split("\n").forEach((item) => {
                jygdArr.push(item);
            });
        } else {
            jygdArr.push(jygd);
        }
    } else {
        log(`\n 【${$.name}】：未填写变量 jygd`)
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

// ===========================================其他设置============================================= \\
function serverkeydecrypt(str) {
    let pem = '-----BEGIN PRIVATE KEY-----MIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCdQrHZtaSnt+WQh42kszAjdID3bXtmji30beSBHhzHafZQDE3s9nvRDrAWH3Mer/c0nx12QYBUK/Suzt5sGh2WSlcHF5Mj04aBm3HfHUYktXD6deo1e3nWlckcdoZcUUwBlg9/L29xaF6dD1hD5awHFMiQfZOO9h1dyOVMqn5ieSk2nJeOECDlUCNaeYnTqSKQA5MYa6yuBSC03EOy70SkAPwcT9mv7PJS86NbMa89XbGvvYlGPilQAvwN/XtCP63je6OygsHLhw91kH8+u7y4mAZJmPt07wGQFwG7nL5zhiL1uPTs7AwZIwwWe5kKRZlpDZxM5vCh072kQx3+uXxDAgMBAAECggEAPqhUNGorMKgUz4Ey7mx2wampuOvmPvZnWPxwDwHwdYPCoCJG6iNLMgCoKChftdpmpJDBLFzsxJy+4OeLt4awQzFbe3fpKF0fOoS02jDPwdCJM0HID4cjBFypxK1021OI9RjVE9fSj10GVY3HnUXlRO0C/I8MO+nTyYpB0kocER+VXUoCp4exudp8Fn3ss3Kfj9F2+enuFs9VmyhSlfMZSww+ZwnggQBBHCqKC3QMM8Zj85ZJh6hW6q4TZwMTBmNQRhiO0djTABbADHcyHe3PMZEO8ZABiybfGZSH9wNP/hlSr+b3sXJJ7l4zeoC5vnsaJxcwPbnT8/vs6B5swyWwAQKBgQDNYyDOe23Bi2IVEaER6ajleBGILo1O2+o5a5txK146a/gaiEAtJQ+BhpsB0AZ7g9Cv88oiNltgRTEPB665ktPObiLNQ/Wpl31mHyNe84qnwA3zbh4EInH/aA2Q3L641KPmW4jfP3L7pYD8JUG1TvSrYdqWd9R49F62lYVxMUffnQKBgQDEA31ayH5cMuiB4gCYDraj+LhAIqTgUsH/VxPTLIfK3VBRY6qUl7hmevojhir4Wp+ZAkgjAPcxAz3dwlKUan8aCGXPHTinpTJxxtNqIDZJXn9m6PsXrvRv9LUImbyyyISU+4FD3qFENb/ZHKLKA5UUmEjBPDBpbKyMWeyHdCo1XwKBgDJ1iSjRcCydttIgS6cf9cuyjPQdI8BdDRVgV4cdNYA66HB0SvgMY9vZmxl95ynPP6UKyv1Ox3JGbYAYzhdveDP+IPS3HpK00i0Vt1XrlYQTDhphUmSHpeQuxy5w3TaBn2bH1D+s0e37Qk4wRQ1rQXcdiltvQzcYKnDHGUqu5c6NAoGAArKhmQxFYPN6a782juE09lDICGnxpvy8ms0SAsgMHmipYFVk1aK48QAkTTTdhomIxMxZPdIXlN8cjN7N0CkfEram4BDg5L3LUfGQm1dSJ/RbAImYWx0XVCskCrhC9pr36C0F/G8l/RBYUZ6pRuqBtMTby30OlYTfYxchwEODCTUCgYB+DG+iaZh8gffE6Qph8MbwcmswGRjvKXb03/EKk1BP2FVkGZ5paVUmf6z+h7s1AyotgBki5hsYUwJVmgQ35GwkPqlkoy8bnv5t/Z9Is/9fQr7nqO/aj5BYNS++hXCzBbULa5TEcphhRfg7mMh6AXsaJ3cp7mz6CZZF/c2bc2rgZQ==-----END PRIVATE KEY-----'
    let krsa = new NodeRSA(pem);
	krsa.setOptions({ encryptionScheme: 'pkcs1' });
	let decryptdata = krsa.decrypt(str, 'utf8');
	return decryptdata
}

function serverkeyencrypt(s1,s2) {
    let public = `-----BEGIN PUBLIC KEY-----${s1}-----END PUBLIC KEY-----`
    let jmrsa = new NodeRSA(public);
	jmrsa.setOptions({ encryptionScheme: 'pkcs1' });
	let encryptdata = jmrsa.encrypt(s2,'base64','utf8');
	return encryptdata
}


function AesEncrypt(data,key) {

    var cipherChunks = [];
    var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
    cipher.setAutoPadding(true);
    cipherChunks.push(cipher.update(data, 'utf8', 'base64'));
    cipherChunks.push(cipher.final('base64'));
    return cipherChunks.join('');
}


function AesDecrypt(data,key){

    var cipherChunks = [];
    var decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
    decipher.setAutoPadding(true);
    cipherChunks.push(decipher.update(data, 'base64', 'utf8'));
    cipherChunks.push(decipher.final('utf8'));
    return cipherChunks.join('');
}


function MD5(str) {
  let md5 = crypto.createHash('md5');
  return md5.update(str).digest('hex').toUpperCase();
};


/**
 * 随机数生成
 */
function randomString(e) {
	e = e || 32;
	var t = "QWERTYUIOPASDFGHJKLZXCVBNM1234567890",
		a = t.length,
		n = "";
	for (i = 0; i < e; i++)
		n += t.charAt(Math.floor(Math.random() * a));
	return n
}

/**
 * 随机整数生成
 */
function randomInt(min, max) {
	return Math.round(Math.random() * (max - min) + min)
}

/**
 * 获取毫秒时间戳
 */
function timestampMs(){
	return new Date().getTime();
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
