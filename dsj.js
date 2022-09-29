/*

软件名：电视家自动领金币


抓包 app 过滤 服务器Host api.gaoqingdianshi.com

随便点一个进去,在请求头找 authorization userid deviceId 填变量中 多号 # 隔开

变量对应名称，把以下变量填入青龙配置文件
export DSJ_HEADERS='你抓包的authorization'
export DSJ_deviceId='你抓包的deviceId'
export DSJ_userid='你抓包的userid'

cron 0 5-23 * * *  建议一小时一次

*/ 


const $ = new Env('电视家');
const notify = $.isNode() ? require('./sendNotify') : '';
const walkstep = '20000'; //每日步数设置，可设置0-20000
const gametimes = "1999"; //游戏时长
const logs = 0 //响应日志开关,默认关闭
let sleeping = "",detail = ``,subTitle = ``;
const dianshijia_API = 'http://api.gaoqingdianshi.com/api'
let tokenArr = [],dsj_deviceId = [],dsj_userid = [],DSJ_headers='';
var task_xiaoman=0,H5Page_4=0,playTask=0,M005=0,ShortvideoPlay=0,task_mobile_visit_song=0,task_mobile_visit_album=0,task_mobile_upload_album=0,task_mobile_create_family=0
let tyq = process.env.tyq//是否填邀请，默认true
let ts = false//是否推送，默认true

if ($.isNode()) {
    Dsjheaders=process.env.DSJ_HEADERS? process.env.DSJ_HEADERS.split("#") : []
    DsjdeviceId=process.env.DSJ_deviceId? process.env.DSJ_deviceId.split("#") : []
    Dsjuserid=process.env.DSJ_userid? process.env.DSJ_userid.split("#") : []
    if(!tyq){
        tyq = true
    }else{
        tyq = false
    }
    if(!ts){
        ts = false
    }else{
        ts = true
    }
    
}

!(async () => {
  if (!Dsjheaders[0]) {
        $.msg($.name, '【提示】请先获取电视家一变量再试')
        return;
  } else {

    console.log(
`\n\n=============== 脚本执行 - 北京时间(UTC+8)：${new Date(
  new Date().getTime() +
  new Date().getTimezoneOffset() * 60 * 1000 +
  8 * 60 * 60 * 1000
).toLocaleString()} ===============\n`);
console.log(`----- 共 ${Dsjheaders.length} 个账号-----`)
if (new Date().getTimezoneOffset() / 60 != '-8' && $.time('HH') < '16') {
        time = new Date(new Date(new Date().toLocaleDateString()).getTime()) / 1000 - 28800
        console.log(time)
    } else if (new Date().getTimezoneOffset() / 60 != '-8' && $.time('HH') > '16') {
        time = new Date(new Date(new Date().toLocaleDateString()).getTime()) / 1000 + 16 * 60 * 60
    } else {
        time = new Date(new Date(new Date().toLocaleDateString()).getTime()) / 1000
    }
    if(!Dsjheaders || !Dsjuserid || Dsjheaders.length!= Dsjuserid.length ){
        $.msg($.name, '【提示】需要的变量是空的或者数量不匹配')
    }else{
    for (i = 0; i < Dsjheaders.length; i++) {
        //console.log(Dsjheaders[i])
            dsj_auth=Dsjheaders[i]
            dsj_userid=Dsjuserid[i]
            
            if(!dsj_deviceId[i]){
               dsj_deviceId = '0d366141cdaa0698'
            }
            
            DSJ_headers = JSON.parse(`{"uuid":"d4f975cfb577b483baa0c44704c853a2","userid":"${dsj_userid}","authorization":"${dsj_auth}","appid":"0990028e54b2329f2dfb4e5aeea6d625","deviceId":"${dsj_deviceId}","platform":"10","Host":"api.gaoqingdianshi.com"}`)
            
            $.index = i + 1;
            console.log(`\n----- 开始【第 ${$.index} 个账号】-----`)

            await dsj_rwzt();
            await signin()
            //await signinfo()
            await dsj_led()
            await run()
            await run_rw()
            await dsj_lqp()
            
            await tasks(); // 任务状态
            await wx_tasks()
            await getGametime(); // 游戏时长
            await dsj_getinfo()// 用户信息
            //await coinlist(); //总计
            await total(); // 金币状态
            //await cash(); // 现金状态
            //await cashlist(); // 现金列表
            
            
            
        
    }
    if(ts){if ($.isNode() ){await notify.sendNotify($.name, subTitle )}}
    }
  }})()

  .catch((e) => $.logErr(e))
  .finally(() => $.done())

async function run() {
    if ($.isNode() && new Date().getTimezoneOffset() == '0') {
        if ($.time('HH') > 11) {
            await sleep();
            await CarveUp();
        } else if ($.time('HH') > 3 && $.time('HH') < 5) {
            await getCUpcoin();
            await walk();
        } else if ($.time('HH') > 22) {
            await wakeup()
        }
    } else {
        if ($.time('HH') > 17) {
            await sleep();
            await CarveUp();
        } else if ($.time('HH') > 11 && $.time('HH') < 14) {
            await getCUpcoin();
            await walk();
        } else if ($.time('HH') > 6 && $.time('HH') < 9) {
            await wakeup()
        }
    }
}

async function run_rw(){
    //天天签到看视频任务8次
    if(task_xiaoman == 0){
        await dsj_ksp()//天天签到看视频任务8次
    }
    //浏览广告赚
    if(H5Page_4 == 0){
        await dsj_ggz()//浏览广告赚
            
    }
    //播放任务
    if(playTask == 0){
        await dsj_jrydz()//今日阅读赚
    }
    //手机版分享
    if(M005 == 0){
        await dsj_sjbfx()//手机分享
    }
    //访问点歌台
    if(task_mobile_visit_song == 0){
        await dsj_dgt()
    }
    //浏览电视相册
    if(task_mobile_visit_album == 0){
        await dsj_fwxc()//访问相册
    }
    //相册上电视task_mobile_upload_album
    if(task_mobile_upload_album == 0){
        await dsj_xcsds()//相册上电视
    }
    //开家庭号task_mobile_create_family
    if(task_mobile_create_family == 0){
        await dsj_kjth() //开家庭号
    }
    //刷短视频
    if(ShortvideoPlay == 0){
        await dsj_sdsp()//刷短视频
    }
    
}


//任务列表
function dsj_rwzt() {
  return new Promise((resolve) => {
let url = {
      url : `http://act.gaoqingdianshi.com/api/v5/task/get`,
     headers : DSJ_headers,
}
      $.get(url, async (err, resp, data) => {
      try {
         //console.log(data) 
     data = JSON.parse(data)
     
     if(data.errCode==0){
         console.log(`\n【任务状态】: \n`)
         //天天看视频任务8次
         if(data.data[0].dayCompCount==8){
             console.log(`${data.data[0].name}: 已完成`)
             task_xiaoman = 1
         }else{
             console.log(`${data.data[0].name}: 未完成`)
             task_xiaoman = 0
         }
         //浏览广告赚
          if(data.data[1].dayCompCount==5){
            console.log(`${data.data[1].name}: 已完成`)
            H5Page_4 = 1
          }else{
              console.log(`${data.data[1].name}: 未完成`)
            H5Page_4 = 0
          }
          
          //播放任务
          if(data.data[10].dayCompCount==9){
              console.log(`${data.data[10].name}: 已完成`)
              playTask = 1
          }else{
             console.log(`${data.data[10].name}: 未完成`)
              playTask = 0 
          }
          //手机版分享
          if(data.data[6].dayCompCount==1){
              console.log(`${data.data[6].name}: 已完成`)
              M005 =1
          }else{
              console.log(`${data.data[6].name}: 未完成`)
              M005 =0
          }
          //刷短视频
          if(data.data[11].dayCompCount==5){
              console.log(`${data.data[11].name}: 已完成`)
              ShortvideoPlay = 1
          }else{
              console.log(`${data.data[11].name}: 未完成`)
              ShortvideoPlay = 0
          }
          //访问点歌台
          if(data.data[12].dayCompCount==1){
              console.log(`${data.data[12].name}: 已完成`)
              task_mobile_visit_song = 1
          }else{
              console.log(`${data.data[12].name}: 未完成`)
              task_mobile_visit_song = 0
          }
          //浏览电视相册
          if(data.data[13].dayCompCount==1){
              console.log(`${data.data[13].name}: 已完成`)
              task_mobile_visit_album = 1
          }else{
              console.log(`${data.data[13].name}: 未完成`)
              task_mobile_visit_album = 0
          }
          //相册上电视task_mobile_upload_album
          if(data.data[14].dayCompCount==1){
              console.log(`${data.data[14].name}: 已完成`)
              task_mobile_upload_album = 1
          }else{
              console.log(`${data.data[14].name}: 未完成`)
              task_mobile_upload_album = 0
         }
          //开家庭号task_mobile_create_family
          if(data.data[15].dayCompCount==1){
              console.log(`${data.data[15].name}: 已完成`)
              task_mobile_create_family = 1
          }else{
              console.log(`${data.data[15].name}: 未完成`)
              task_mobile_create_family = 0
          }
          
          
     }else{
         //console.log(`${data.data[2].name}: 已完成`)
         console.log(data) 
     }

      

        } catch (e) {
        } finally {
          resolve()
        }
    })
  })
}

//签到
function signin() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v5/sign/signin?accelerate=0&ext=0&ticket=`,
            headers: DSJ_headers
        }, async(error, response, data) => {
            //console.log(data) 
            //{"errCode":4,"msg":"不能重复签到"}
            //if (logs) $.log(`${$.name}, 签到结果: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
                //signinres = `\n签到成功 `
                console.log( `\n【签到收益】: ${result.data.reward[0].count} 金币 `)
                /*var h = result.data.reward.length
                if (h > 1) {
                    dconsole.log( `\n【签到收益】` + signinres + `${result.data.reward[0].count}金币，奖励${result.data.reward[1].name} `)
                } else {
                    console.log( `\n【签到收益】` + signinres + `+${result.data.reward[0].count}金币 `)
                }*/
            } else if (result.errCode == 4) {
                console.log(`\n【签到结果】 重复签到 🔁 `)
            } else if (result.errCode == 6) {
                console.log(`\n【签到结果】 失败`)
                //detail = `\n原因: ${result.msg}`
                /*if ($.isNode()) {
                    await notify.sendNotify($.name, subTitle + '\n' + detail)
                }
                return*/
            }
            resolve()
        })
    })
}

function signinfo() {
  return new Promise((resolve, reject) => {
     $.get({ url: `${dianshijia_API}/v5/sign/get`, headers: DSJ_headers}, (error, response, data) => 
  {
      //console.log(data) 
   if(logs)$.log(`${$.name}, 签到信息: ${data}\n`)
     const result = JSON.parse(data)
     if (result.errCode == 0) {
     var d = `${result.data.currentDay}`
     for (i=0; i < result.data.recentDays.length;i++)      
        {
       if (d == result.data.recentDays[i].day)
          {detail += ` 连续签到${d}天\n`
       var j = result.data.recentDays[i].rewards.length
       if (j > 1){
aa=result.data.recentDays[i+1].rewards[1].rewardsType
bb=result.data.recentDays[i+1].rewards[2].rewardsType
cc=result.data.recentDays[i+1].rewards[3].rewardsType

if (aa==4){
money=result.data.recentDays[i+1].rewards[1].id
detail += `【奖励信息】今日:${result.data.recentDays[i+1].rewards[1].name}\n`

} else 
if (bb==4){
money=result.data.recentDays[i+1].rewards[2].id
detail += `【奖励信息】今日:${result.data.recentDays[i+1].rewards[2].name}\n`

} else
if (cc==4){
money=result.data.recentDays[i+1].rewards[3].id
detail += `【奖励信息】今日:${result.data.recentDays[i+1].rewards[3].name}\n`
}

                 } 
          else   if (j == 1) 
                 { 
                detail += `【奖励信息】今日: 无 ` 
                 }
        
               }               
           }  
     resolve()
        }
    })
  })
}  

///观看视频赚钱
function dsj_ksp() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v5/task/complete?code=task_xiaoman&comType=0`,
            headers: DSJ_headers
        }, async(error, response, data) => {
            //console.log(data) 
            //{"errCode":4,"msg":"不能重复签到"}
            //if (logs) $.log(`${$.name}, 签到结果: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
               console.log(`\n【看视频赚钱】:获得 ${result.data.getCoin} 金币`)  
            } else {
                console.log( `\n【看视频赚钱】: ${result.msg}`)
                //subTitle = `【看视频赚钱】 失败`
                /*detail = `原因: ${result.msg}`
                if ($.isNode()) {
                    await notify.sendNotify($.name, subTitle + '\n' + detail)
                }
                return*/
            }
            console.log(detail)
            resolve()
        })
    })
}
//列出气泡信息
function dsj_lqp() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/coin/info`,
            headers: DSJ_headers
        }, async(error, response, data) => {
            //console.log(data) 
            //{"errCode":4,"msg":"不能重复签到"}
            //if (logs) $.log(`${$.name}, 签到结果: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
                if(!result.data.tempCoin){
                    console.log(`\n【${$.name}】: 首页没有气泡了`)
                }else{
                  for(let a=0;a<result.data.tempCoin.length;a++){
                  await dsj_dqp(result.data.tempCoin[a].id) 
               }  
                }

            } else {
               //console.log(`\n【${$.name}】: ${result.msg}`
                //subTitle = `【看视频赚钱】 失败`
                /*detail = `原因: ${result.msg}`
                if ($.isNode()) {
                    await notify.sendNotify($.name, subTitle + '\n' + detail)
                }
                return*/
            }
            resolve()
        })
    })
}
 //点气泡
function dsj_dqp(code) {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/coin/temp/exchange?id=${code}`,
            headers: DSJ_headers
        }, async(error, response, data) => {
            //console.log(data) 
            let result = JSON.parse(data)
            console.log(`\n【${$.name}】: 点气泡成功`)
            resolve()
        })
    })
}
//浏览广告赚
function dsj_ggz() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v5/task/complete?code=H5Page_4&comType=0`,
            headers: DSJ_headers
        }, async(error, response, data) => {
            //console.log(data) 
            //{"errCode":4,"msg":"不能重复签到"}
            //if (logs) $.log(`${$.name}, 签到结果: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
                console.log(`\n【浏览广告赚】:获得 ${result.data.getCoin} 金币`)  
            } else {
               console.log(`\n【浏览广告赚】: ${result.msg}`)
            }
            resolve()
        })
    })
}
//播放任务
function dsj_jrydz() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v5/task/complete?code=playTask&comType=0`,
            headers: DSJ_headers
        }, async(error, response, data) => {
            //console.log(data) 
            //{"errCode":4,"msg":"不能重复签到"}
            //if (logs) $.log(`${$.name}, 签到结果: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
                console.log(`\n【播放任务】:获得 ${result.data.getCoin} 金币`)
            } else {
               console.log(`\n【播放任务】: ${result.msg}`)
            }
            resolve()
        })
    })
}
//手机版分享
function dsj_sjbfx() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/v5/task/complete?code=1M005&comType=0`,
            headers: DSJ_headers
        }, async(error, response, data) => {
            //console.log(data) 
            //{"errCode":4,"msg":"不能重复签到"}
            //if (logs) $.log(`${$.name}, 签到结果: ${data}\n`)
            let result = JSON.parse(data)
            if (result.errCode == 0) {
                console.log(`\n【手机版分享】:获得 ${result.data.getCoin} 金币`)
            } else {
               console.log(`\n【手机版分享】: ${result.msg}`)
            }
            resolve()
        })
    })
}
//游戏时长
function getGametime() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v4/task/complete?code=gameTime&time=${gametimes}`,
            headers: DSJ_headers,
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`游戏时长: ${data}\n`)
        })
        resolve()
    })
}
//瓜分百元
function getCUpcoin() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/taskext/getCoin?ext=0&code=carveUp`,
            headers: DSJ_headers
        }, (error, response, data) => {
            //console.log(data)
            if (logs) $.log(`【瓜分百万金币】: 获得 ${data} 金币`)
        })
        resolve()
    })
}
//睡觉任务
function sleep() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/taskext/getSleep?ext=1`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            try {
                if (logs) $.log(`睡觉任务: ${data}\n`)
                let sleepres = JSON.parse(data)
                if (sleepres.errCode == 0) {
                    sleeping = sleepres.data.name + '报名成功 🛌'
                } else if (sleepres.errCode == 4006) {
                    sleeping = '睡觉中😴'
                } else {
                    sleeping = ''
                }
                resolve()
            } catch (e) {
                $.msg($.name, `睡觉结果: 失败`, `说明: ${e}`)
            }
            console.log(`\n【睡觉任务】: ${sleeping}`)
            resolve()
        })
    })
}
//睡觉打卡
function wakeup() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/taskext/getCoin?code=sleep&coin=1910&ext=1`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`睡觉打卡: ${data}\n`)
        })
        resolve()
    })
}

function tasks(tkcode) {
    return new Promise(async(resolve, reject) => {
        let taskcode = ['1M002','SpWatchVideo', 'Mobilewatchvideo', 'MutilPlatformActive','MiniLoginIn','MiniWatchVideo','FirstDownLoginMobile','FirstDownLoginTv']
        for (code of taskcode) {
            await dotask(code)
        }
        resolve()
    })
}
//播放时长
function dotask(code) {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v4/task/complete?code=${code}`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            if(result.errCode == 0){
                console.log('\n【任务代码】：' + code + '，获得金币:' + result.data.getCoin)  
            }else{
              console.log('\n【任务代码】: '+code+ '，'+result.msg)
            }
        resolve()    
        })
    })
}

//走路任务
function walk() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/taskext/getWalk?step=${walkstep}`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`走路任务: ${data}\n`)
            let result = JSON.parse(data)
            if (result.data.unGetCoin > 10) {
                $.get({
                    url: `${dianshijia_API}/taskext/getCoin?code=walk&coin=${result.data.unGetCoin}&ext=1`,
                    headers: DSJ_headers
                }, (error, response, data) => {})
            }
            resolve()
        })
    })
}
//当前金币状态
function total() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/coin/info`,
            headers: DSJ_headers
        }, (error, response, data) => {
            let result = JSON.parse(data)
            console.log(`\n【当前金币状态】待兑换金币: ${result.data.coin}`)
            subTitle += `\n【当前金币状态】待兑换金币: ${result.data.coin}`
            try {
                if (result.data.tempCoin) {
                    for (i = 0; i < result.data.tempCoin.length; i++) {
                        coinid = result.data.tempCoin[i].id
                        $.get({
                            url: `http://api.gaoqingdianshi.com/api/coin/temp/exchange?id=` + coinid,
                            headers: DSJ_headers
                        }, (error, response, data))
                    }
                }
                resolve()
            } catch (e) {
                console.log('获取金币出错，检查脚本是否失效')
                resolve()
            }
        })
    })
}
//现金详情
function cash() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/cash/info`,
            headers: DSJ_headers
        }, (error, response, data) => {
            //if (logs) $.log(`现金: ${data}\n`)
            let cashresult = JSON.parse(data)
            if (cashresult.errCode == "0") {
               console.log(`\n【当前现金状态】总现金: ${cashresult.data.amount/100} , 提现额度: ${cashresult.data.withdrawalQuota/100}`) 
                subTitle += `\n【账号 ${i+1} 现金状态】总现金: ${cashresult.data.amount/100} , 提现额度: ${cashresult.data.withdrawalQuota/100}`
                //cashtotal = cashresult.data.totalWithdrawn / 100
                /*zh=i
                if ($.isNode()) {
                 notify.sendNotify($.name,'账号: '+i+'\n'+ subTitle + '\n')
                }
                return*/
                
            }
            resolve()
        })
    })
}
//现金列表
function cashlist() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/cash/detail`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            let result = JSON.parse(data)
            console.log(data)
            let totalcash = Number(),
                cashres = "";
            //console.log(`提现列表: ${data}`)
            if(result.errCode == 0){
                //console.log(`\n【现金列表】:获得 ${result.data.getCoin} 金币`)  
            }else{
              console.log(`\n【现金列表】: ${result.msg}`)  
            }
         resolve()   
        })
    })
}
/*function cashlist() {
    return new Promise((resolve, reject) => {
        $.get({
            url: `${dianshijia_API}/cash/detail`,
            headers: DSJ_headers
        }, (error, response, data) => {
            let result = JSON.parse(data)
            let totalcash = Number(),
                cashres = "";
            console.log(`提现列表: ${data}`)
            /*if (result.errCode == 0) {
                for (i = 0; i < result.data.length; i++) {
                    if (result.data[i].type == '2' && result.data[i].ctime >= time) {
                        cashres = `✅ 今日提现:` + result.data[i].amount / 100 + `元 `
                    }
                }
                if (cashres && cashtotal) {
                    detail += `【提现结果】` + cashres + `共计提现:` + cashtotal + `元\n`
                } else if (!cashres && cashtotal) {
                    detail += `【提现结果】今日未提现 共计提现:` + cashtotal + `元\n`
                }
            } else {
                console.log(`提现列表失败，可忽略: ${data}`)
            }
            resolve()
        })
    })
}*/
//总计
function coinlist() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            let url = {
                url: `${dianshijia_API}/coin/detail`,
                headers: DSJ_headers
            }
            $.get(url, (error, response, data) => {
                //console.log(`金币列表: ${data}`)
                let result = JSON.parse(data)
                let onlamount = 0,
                    vdamount = 0,
                    gamestime = 0,
                    todaysign = 0;
                try {
                    for (i = 0; i < result.data.length && result.data[i].ctime >= time; i++) {
                        if (result.data[i].from == "领取走路金币") {
                            detail += `【走路任务】✅ 获得金币` + result.data[i].amount + '\n'
                        }
                        if (result.data[i].from == "领取睡觉金币") {
                            detail += `【睡觉任务】✅ 获得金币` + result.data[i].amount + '\n'
                        }
                        if (result.data[i].from == "手机分享") {
                            detail += `【分享任务】✅ 获得金币` + result.data[i].amount + '\n'
                        }
                        if (result.data[i].from == "双端活跃") {
                            detail += `【双端活跃】✅ 获得金币` + result.data[i].amount + '\n'
                        }
                        if (result.data[i].from == "播放任务") {
                            detail += `【播放任务】✅ 获得金币` + result.data[i].amount + '\n'
                        }
                        if (result.data[i].from == "领取瓜分金币") {
                            detail += `【瓜分金币】✅ 获得金币` + result.data[i].amount + '\n'
                        }
                        if (result.data[i].from == "游戏时长奖励") {
                            gamestime += result.data[i].amount
                        }
                        if (result.data[i].from == "激励视频") {
                            vdamount += result.data[i].amount
                        }
                        if (result.data[i].from == "手机在线") {
                            onlamount += result.data[i].amount
                        }
                        if (result.data[i].from == "签到") {
                            todaysign += result.data[i].amount
                        }
                    }
                    if (todaysign) {
                        detail += `【每日签到】✅ 获得金币` + todaysign + '\n'
                    }
                    if (vdamount) {
                        detail += `【激励视频】✅ 获得金币` + vdamount + '\n'
                    }
                    if (onlamount) {
                        detail += `【手机在线】✅ 获得金币` + onlamount + '\n'
                    }
                    if (gamestime) {
                        detail += `【游戏时长】✅ 获得金币` + gamestime + '\n'
                    }
                    if (i > 0) {
                        detail += `【任务统计】共完成${i+1}次任务🌷`
                    }
                    $.msg($.name + `  ` + sleeping, subTitle, detail)
                    
                    
                } catch (e) {
                    console.log(`获取任务金币列表失败，错误代码${e}+ \n响应数据:${data}`)
                    //$.msg($.name + ` 获取金币详情失败 `, subTitle, detail)
                }
                /*if ($.isNode()) {
                    notify.sendNotify(`【${$.name}】账号 ${i} , ${subTitle} '\n' ${detail}`)
                }
                return*/
                resolve()
            })
        }, 1000)
    })
}
//访问点歌台
function dsj_dgt() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v5/task/complete?code=task_mobile_visit_song&comType=0`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            //console.log(`\n【今日阅读赚】: 成功`)
            if(result.errCode == 0){
                console.log(`\n【访问点歌台】:获得 ${result.data.getCoin} 金币`)  
            }else{
              console.log(`\n【访问点歌台】: ${result.msg}`)  
            }
            
        resolve()
        })
    })
}
//访问相册
function dsj_fwxc() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v5/task/complete?code=task_mobile_visit_album&comType=0`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            if(result.errCode == 0){
                console.log(`\n【访问相册】:获得 ${result.data.getCoin} 金币`)  
            }else{
              console.log(`\n【访问相册】: ${result.msg}`)  
            }
            
        resolve()    
        })
    })
}
//刷短视频
function dsj_sdsp() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v5/task/complete?code=ShortvideoPlay&comType=0`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            if(result.errCode == 0){
                console.log(`\n【刷短视频】:获得 ${result.data.getCoin} 金币`)  
            }else{
              console.log(`\n【刷短视频】: ${result.msg}`)  
            }
            
        resolve()
        })
    })
}
//用户信息
function dsj_getinfo() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v3/user/info`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            let result = JSON.parse(data)
            if(result.errCode == 0){
                nickname=result.data.nickname
                headImgUrl=result.data.headImgUrl
                if(tyq){dsj_info()}
            }else{
              console.log(`\n【电视家提示】: ${result.msg}`)  
            }
            
        resolve()    
        })
    })
}
function dsj_info() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/activity/invite/bind?ename=${nickname}&eavatar=${headImgUrl}&uid=${dsj_userid}&inviteCode=1103517`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            if(result.errCode == 0){
                
            }else{
              //console.log(`\n【电视家提示】: ${result.msg}`)  
            }
            
        resolve()    
        })
    })
}
//瓜分百万金币
function CarveUp() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v2/taskext/getCarveUp?ext=1`,
            headers: DSJ_headers,
        }
        $.get(url, (error, response, data) => {
            if (logs) $.log(`瓜分百万金币: ${data}`)
            const result = JSON.parse(data)
            if (result.errCode == 0) {
                detail += `【金币瓜分】✅ 报名成功\n`
            }
            resolve()
        })
    })
}
//微信小程序
function wx_tasks(tkcode) {
    return new Promise(async(resolve, reject) => {
        let taskcode = ['1M002','SpWatchVideo', 'Mobilewatchvideo', 'MutilPlatformActive','MiniLoginIn','MiniWatchVideo','FirstDownLoginMobile','FirstDownLoginTv']
        for (code of taskcode) {
            await wx_dotask(code)
        }
        resolve()
    })
}
//小程序任务
function wx_dotask(code) {
    return new Promise((resolve, reject) => {
        let url = {
            url: `https://api.dianshihome.com/api/v4/task/complete?code=${code}&comType=1`,
            headers: JSON.parse(`{"userid":"${dsj_userid}","authorization":"${tokenArr[i]}","appid":"3c3065a6f979f9b2b49e98ea1d02f313","Host":"api.dianshihome.com","content-type":"application/x-www-form-urlencoded","Referer":"https://servicewechat.com/wx9e8718eb2360dfb8/109/page-frame.html"}`)
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            if(result.errCode == 0){
                console.log('\n【微信任务代码】：' + code + '，获得金币:' + result.data.getCoin)  
            }else{
              console.log('\n【微信任务代码】: '+code+'，'+result.msg)
            }
         resolve()   
        })
    })
}
//相册上电视
function dsj_xcsds() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v5/task/complete?code=task_mobile_upload_album&comType=0`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            if(result.errCode == 0){
                console.log(`\n【相册上电视】:获得 ${result.data.getCoin} 金币`)  
            }else{
              console.log(`\n【相册上电视】: ${result.msg}`)  
            }
            
        resolve()    
        })
    })
}
//开家庭号
function dsj_kjth() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `${dianshijia_API}/v5/task/complete?code=task_mobile_create_family&comType=0`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
            let result = JSON.parse(data)
            if(result.errCode == 0){
                console.log(`\n【开家庭号】:获得 ${result.data.getCoin} 金币`)  
            }else{
              console.log(`\n【开家庭号】: ${result.msg}`)  
            }
            
        resolve()    
        })
    })
}
//领明天额度
function dsj_led() {
    return new Promise((resolve, reject) => {
        let url = {
            url: `http://api.gaoqingdianshi.com/api/sign/chooseAdditionalReward?rewardId=45`,
            headers: DSJ_headers
        }
        $.get(url, (error, response, data) => {
            //console.log(data)
        resolve()    
        })
    })
}



function Env(t,e){class s{constructor(t){this.env=t}send(t,e="GET"){t="string"==typeof t?{url:t}:t;let s=this.get;return"POST"===e&&(s=this.post),new Promise((e,i)=>{s.call(this,t,(t,s,r)=>{t?i(t):e(s)})})}get(t){return this.send.call(this.env,t)}post(t){return this.send.call(this.env,t,"POST")}}return new class{constructor(t,e){this.name=t,this.http=new s(this),this.data=null,this.dataFile="box.dat",this.logs=[],this.isMute=!1,this.isNeedRewrite=!1,this.logSeparator="\n",this.startTime=(new Date).getTime(),Object.assign(this,e),this.log("",`🔔${this.name}, 开始!`)}isNode(){return"undefined"!=typeof module&&!!module.exports}isQuanX(){return"undefined"!=typeof $task}isSurge(){return"undefined"!=typeof $httpClient&&"undefined"==typeof $loon}isLoon(){return"undefined"!=typeof $loon}toObj(t,e=null){try{return JSON.parse(t)}catch{return e}}toStr(t,e=null){try{return JSON.stringify(t)}catch{return e}}getjson(t,e){let s=e;const i=this.getdata(t);if(i)try{s=JSON.parse(this.getdata(t))}catch{}return s}setjson(t,e){try{return this.setdata(JSON.stringify(t),e)}catch{return!1}}getScript(t){return new Promise(e=>{this.get({url:t},(t,s,i)=>e(i))})}runScript(t,e){return new Promise(s=>{let i=this.getdata("@chavy_boxjs_userCfgs.httpapi");i=i?i.replace(/\n/g,"").trim():i;let r=this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");r=r?1*r:20,r=e&&e.timeout?e.timeout:r;const[o,h]=i.split("@"),n={url:`http://${h}/v1/scripting/evaluate`,body:{script_text:t,mock_type:"cron",timeout:r},headers:{"X-Key":o,Accept:"*/*"}};this.post(n,(t,e,i)=>s(i))}).catch(t=>this.logErr(t))}loaddata(){if(!this.isNode())return{};{this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e);if(!s&&!i)return{};{const i=s?t:e;try{return JSON.parse(this.fs.readFileSync(i))}catch(t){return{}}}}}writedata(){if(this.isNode()){this.fs=this.fs?this.fs:require("fs"),this.path=this.path?this.path:require("path");const t=this.path.resolve(this.dataFile),e=this.path.resolve(process.cwd(),this.dataFile),s=this.fs.existsSync(t),i=!s&&this.fs.existsSync(e),r=JSON.stringify(this.data);s?this.fs.writeFileSync(t,r):i?this.fs.writeFileSync(e,r):this.fs.writeFileSync(t,r)}}lodash_get(t,e,s){const i=e.replace(/\[(\d+)\]/g,".$1").split(".");let r=t;for(const t of i)if(r=Object(r)[t],void 0===r)return s;return r}lodash_set(t,e,s){return Object(t)!==t?t:(Array.isArray(e)||(e=e.toString().match(/[^.[\]]+/g)||[]),e.slice(0,-1).reduce((t,s,i)=>Object(t[s])===t[s]?t[s]:t[s]=Math.abs(e[i+1])>>0==+e[i+1]?[]:{},t)[e[e.length-1]]=s,t)}getdata(t){let e=this.getval(t);if(/^@/.test(t)){const[,s,i]=/^@(.*?)\.(.*?)$/.exec(t),r=s?this.getval(s):"";if(r)try{const t=JSON.parse(r);e=t?this.lodash_get(t,i,""):e}catch(t){e=""}}return e}setdata(t,e){let s=!1;if(/^@/.test(e)){const[,i,r]=/^@(.*?)\.(.*?)$/.exec(e),o=this.getval(i),h=i?"null"===o?null:o||"{}":"{}";try{const e=JSON.parse(h);this.lodash_set(e,r,t),s=this.setval(JSON.stringify(e),i)}catch(e){const o={};this.lodash_set(o,r,t),s=this.setval(JSON.stringify(o),i)}}else s=this.setval(t,e);return s}getval(t){return this.isSurge()||this.isLoon()?$persistentStore.read(t):this.isQuanX()?$prefs.valueForKey(t):this.isNode()?(this.data=this.loaddata(),this.data[t]):this.data&&this.data[t]||null}setval(t,e){return this.isSurge()||this.isLoon()?$persistentStore.write(t,e):this.isQuanX()?$prefs.setValueForKey(t,e):this.isNode()?(this.data=this.loaddata(),this.data[e]=t,this.writedata(),!0):this.data&&this.data[e]||null}initGotEnv(t){this.got=this.got?this.got:require("got"),this.cktough=this.cktough?this.cktough:require("tough-cookie"),this.ckjar=this.ckjar?this.ckjar:new this.cktough.CookieJar,t&&(t.headers=t.headers?t.headers:{},void 0===t.headers.Cookie&&void 0===t.cookieJar&&(t.cookieJar=this.ckjar))}get(t,e=(()=>{})){t.headers&&(delete t.headers["Content-Type"],delete t.headers["Content-Length"]),this.isSurge()||this.isLoon()?(this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.get(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)})):this.isQuanX()?(this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t))):this.isNode()&&(this.initGotEnv(t),this.got(t).on("redirect",(t,e)=>{try{if(t.headers["set-cookie"]){const s=t.headers["set-cookie"].map(this.cktough.Cookie.parse).toString();s&&this.ckjar.setCookieSync(s,null),e.cookieJar=this.ckjar}}catch(t){this.logErr(t)}}).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)}))}post(t,e=(()=>{})){if(t.body&&t.headers&&!t.headers["Content-Type"]&&(t.headers["Content-Type"]="application/x-www-form-urlencoded"),t.headers&&delete t.headers["Content-Length"],this.isSurge()||this.isLoon())this.isSurge()&&this.isNeedRewrite&&(t.headers=t.headers||{},Object.assign(t.headers,{"X-Surge-Skip-Scripting":!1})),$httpClient.post(t,(t,s,i)=>{!t&&s&&(s.body=i,s.statusCode=s.status),e(t,s,i)});else if(this.isQuanX())t.method="POST",this.isNeedRewrite&&(t.opts=t.opts||{},Object.assign(t.opts,{hints:!1})),$task.fetch(t).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>e(t));else if(this.isNode()){this.initGotEnv(t);const{url:s,...i}=t;this.got.post(s,i).then(t=>{const{statusCode:s,statusCode:i,headers:r,body:o}=t;e(null,{status:s,statusCode:i,headers:r,body:o},o)},t=>{const{message:s,response:i}=t;e(s,i,i&&i.body)})}}time(t,e=null){const s=e?new Date(e):new Date;let i={"M+":s.getMonth()+1,"d+":s.getDate(),"H+":s.getHours(),"m+":s.getMinutes(),"s+":s.getSeconds(),"q+":Math.floor((s.getMonth()+3)/3),S:s.getMilliseconds()};/(y+)/.test(t)&&(t=t.replace(RegExp.$1,(s.getFullYear()+"").substr(4-RegExp.$1.length)));for(let e in i)new RegExp("("+e+")").test(t)&&(t=t.replace(RegExp.$1,1==RegExp.$1.length?i[e]:("00"+i[e]).substr((""+i[e]).length)));return t}msg(e=t,s="",i="",r){const o=t=>{if(!t)return t;if("string"==typeof t)return this.isLoon()?t:this.isQuanX()?{"open-url":t}:this.isSurge()?{url:t}:void 0;if("object"==typeof t){if(this.isLoon()){let e=t.openUrl||t.url||t["open-url"],s=t.mediaUrl||t["media-url"];return{openUrl:e,mediaUrl:s}}if(this.isQuanX()){let e=t["open-url"]||t.url||t.openUrl,s=t["media-url"]||t.mediaUrl;return{"open-url":e,"media-url":s}}if(this.isSurge()){let e=t.url||t.openUrl||t["open-url"];return{url:e}}}};if(this.isMute||(this.isSurge()||this.isLoon()?$notification.post(e,s,i,o(r)):this.isQuanX()&&$notify(e,s,i,o(r))),!this.isMuteLog){let t=["","==============📣系统通知📣=============="];t.push(e),s&&t.push(s),i&&t.push(i),console.log(t.join("\n")),this.logs=this.logs.concat(t)}}log(...t){t.length>0&&(this.logs=[...this.logs,...t]),console.log(t.join(this.logSeparator))}logErr(t,e){const s=!this.isSurge()&&!this.isQuanX()&&!this.isLoon();s?this.log("",`❗️${this.name}, 错误!`,t.stack):this.log("",`❗️${this.name}, 错误!`,t)}wait(t){return new Promise(e=>setTimeout(e,t))}done(t={}){const e=(new Date).getTime(),s=(e-this.startTime)/1e3;this.log("",`🔔${this.name}, 结束! 🕛 ${s} 秒`),this.log(),(this.isSurge()||this.isQuanX()||this.isLoon())&&$done(t)}}(t,e)};