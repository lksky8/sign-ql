/**
 原作者：临渊
 日期：9-20
 作者：https://github.com/lksky8/sign-ql
 小程序：统一快乐星球
 入口：活动->种番茄
 功能：除了助力都能完成
 抓包：api.xiaoyisz.com/qiehuang/ga/public/api/login  这个登录包里 body 部分的 全部
 变量：tybody='body@xxxx '  多个账号用 @ 或者 换行 分割 
 定时一天三次，八个小时一次收取冒险奖励
 cron: 10 12,18 * * *

 [task_local]
 #统一茄皇
 10 12,18 * * *  https://raw.githubusercontent.com/lksky8/sign-ql/main/tyqh.js, tag=统一茄皇, enabled=true
 [rewrite_local]
 http://api.xiaoyisz.com/qiehuang/ga/public/api/login url script-request-header https://raw.githubusercontent.com/lksky8/sign-ql/main/tyqh.js
 [MITM]
 hostname = api.xiaoyisz.com

 6-14 更新了AU获取方式，理论上不会过期了
 6-18 更新了收取植物、种新的植物和推送加上昵称，方便辨认（可能）
 6-22 修复了上报挑战失败、洒阳光失败，更新了种植进度（免得老有人说脚本坏了）
 6-24 优化日志，更新了随机UA，可以自己抓 user-agent 填到变量 UA 里面，也可以不填直接改脚本里 uaNum 的数字
 6-26 移除了开始冒险，加到助力脚本，现在四个号可以两个小时冒险一次
 6-28 新增偷取好友阳光（出自jujuju大佬）
 9-19 修复数据，去掉了脚本检测更新功能
 */

 const $ = new Env("统一茄皇-修复版");
 const crypto = require('crypto');
 const notify = $.isNode() ? require("./sendNotify") : "";
 const { log } = console;
 const Notify = 1; //0为关闭通知，1为打开通知,默认为1
 const uaNum = 21; //随机UA，从0-22随便选一个填上去
 //////////////////////
 let tyau = "";
 let tybody = ($.isNode() ? process.env.tybody : $.getdata("tybody")) || "";
 let UA = ($.isNode() ? process.env.UA : $.getdata("UA")) || "";
 let UAArr = [];
 let tybodyArr = [];
 let newAuArr = [];
 let tyPlantId = "";
 let plantIdArr = [];
 let auback = 0;
 let data = "";
 let msg = "";
 let taskType = 0;
 let taskBack = [];
 let taskTypeArr = [];
 let taskId = "";
 let taskIdArr = [];
 let challengeId = "";
 let adventureId = "";
 let name = "";
 let id = "";
 let idArr = [];
 let progress = 0.0;
 let plantStage = 0;
 let plantStatus = "";
 let helpTaskId = "";
 let helpTaskIdArr = [];
 let giveSunshineBack = 0;
 let stealFull = false;
 
 const User_Agents = [
   "Mozilla/5.0 (Linux; Android 10; ONEPLUS A5010 Build/QKQ1.191014.012; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
   "Mozilla/5.0 (iPhone; CPU iPhone OS 14_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
   "Mozilla/5.0 (Linux; Android 9; Mi Note 3 Build/PKQ1.181007.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/045131 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 10; GM1910 Build/QKQ1.190716.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 9; 16T Build/PKQ1.190616.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
   "Mozilla/5.0 (iPhone; CPU iPhone OS 13_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
   "Mozilla/5.0 (iPhone; CPU iPhone OS 13_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
   "Mozilla/5.0 (iPhone; CPU iPhone OS 14_2 like Mac OS X) AppleWebKit/532.0 (KHTML, like Gecko) CriOS/43.0.823.0 Mobile/65M532 Safari/532.0",
   "Mozilla/5.0 (iPod; U; CPU iPhone OS 3_1 like Mac OS X; rw-RW) AppleWebKit/531.9.3 (KHTML, like Gecko) Version/4.0.5 Mobile/8B118 Safari/6531.9.3",
   "Mozilla/5.0 (Linux; Android 9; MI 6 Build/PKQ1.190118.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 11; Redmi K30 5G Build/RKQ1.200826.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045511 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 10; ONEPLUS A6000 Build/QKQ1.190716.003; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045224 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 9; MHA-AL00 Build/HUAWEIMHA-AL00; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 8.0.0; HTC U-3w Build/OPR6.170623.013; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 10; LYA-AL00 Build/HUAWEILYA-AL00L; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 8.1.0; MI 8 Build/OPM1.171019.026; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/045131 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 10; Redmi K20 Pro Premium Edition Build/QKQ1.190825.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045227 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 8.1.0; 16 X Build/OPM1.171019.026; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/66.0.3359.126 MQQBrowser/6.2 TBS/044942 Mobile Safari/537.36",
   "Mozilla/5.0 (Linux; Android 10; M2006J10C Build/QP1A.190711.020; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.120 MQQBrowser/6.2 TBS/045230 Mobile Safari/537.36",
   "Mozilla/5.0 (iPhone; CPU iPhone OS 13_7 like Mac OS X) AppleWebKit/532.0 (KHTML, like Gecko) FxiOS/18.2n0520.0 Mobile/50C216 Safari/532.0",
   "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.28(0x18001c29) NetType/WIFI",
   "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36 MicroMessenger/7.0.9.501 NetType/WIFI MiniProgramEnv/Windows WindowsWechat"
 ];
 let ua = User_Agents[uaNum];
 
 !(async () => {
   if (typeof $request !== "undefined") {
     await GetRewrite();
   } else {
     if (!(await Envs())) return;
     else {
       log(
         `\n\n=============================================    \n脚本执行 - 北京时间(UTC+8)：${new Date(
           new Date().getTime() +
             new Date().getTimezoneOffset() * 60 * 1000 +
             8 * 60 * 60 * 1000
         ).toLocaleString()} \n=============================================\n`
       );

       log(
         `\n=================== 共找到 ${tybodyArr.length} 个账号 ===================`
       );
       log('★★★★★低调使用，别再挂到咸鱼上卖10块钱了，这种行为很愚蠢(눈_눈)★★★★★')
       for (let index = 0; index < tybodyArr.length; index++) {
         ua = User_Agents[uaNum + index];
 
         if (UA) {
           if (index >= UAArr.length) {
             let i = UAArr.length + randomInt(0, 2);
             ua = User_Agents[uaNum + i];
           } else ua = UAArr[index];
         }
 
         tybody = tybodyArr[index];
         let num = index + 1;
 
         log(`\n========= 开始【第 ${num} 个账号】=========\n`);
 
         msg += `\n第${num}个账号运行结果：`;

         
         log("【开始获取AU】");
         await refreshAu();
         await $.wait(2 * 1000);
         newAuArr[index] = tyau;
 
         log("【开始查询任务】");
         await getTask();
         await $.wait(2 * 1000);
         helpTaskIdArr[index] = helpTaskId;
 
         if (auback != 1) {
           for (let i = 0; i < 10; i++) {
             if (taskBack[i]) {
               if (i == 0) {
                 log(`\n助力任务还未完成，建议执行互助\n`);
               } else
                 log(`【第${i + 1}个任务未完成，开始执行第${i + 1}个任务】`);
               await report(i);
               if (i == 2) {
                 await report(i);
                 await report(i);
                 await report(i);
                 await report(i);
               }
               await $.wait(2 * 1000);
               await getDrawPriz(i);
               await $.wait(2 * 1000);
             }
           }
 
           log("【开始收取阳光】");
           await getSunshine();
           await $.wait(2 * 1000);
 
           log("【开始进行挑战】");
           await startCallenge();
           await $.wait(2 * 1000);
 
           log("【开始查询冒险奖励】");
           await queryAdventure();
           await $.wait(2 * 1000);
 
           log("【开始获取植物详情】");
           await getPlant(index);
           await $.wait(2 * 1000);
           plantIdArr[index] = tyPlantId;
 
           log("【开始洒阳光】");
           do {
             await giveSunshine();
             await $.wait(2 * 1000);
           } while (giveSunshineBack == 1);
 
           log("【开始获取植物详情】");
           await getPlant(index);
           await $.wait(2 * 1000);
           plantIdArr[index] = tyPlantId;
 
           log("【开始偷好友阳光】");
           const stealAll = await stealFriendSunshine();
           msg += `\n共偷取好友阳光${stealAll}g`;
 
           log("【开始查询信息】");
           await getUserInfo();
           await $.wait(2 * 1000);
 
           idArr[index] = id;
         }
       }
       await SendMsg(msg);
     }
   }
 })()
   .catch((e) => log(e))
   .finally(() => $.done());
 
 /**
  * 获取AU
  */
 function refreshAu(timeout = 2 * 1000) {
   let url = {
     url: `http://api.xiaoyisz.com/qiehuang/ga/public/api/login`,
     headers: {
       Host: "api.xiaoyisz.com",
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
     body: `${tybody}`,
   };
   return new Promise((resolve) => {
     $.post(
       url,
       async (error, response, data) => {
         try {

           let result = JSON.parse(data);
           if (result.code == 0) {
             log(`获取AU成功`);
             tyau = result.data;
           } else if (result.code == 500) {
             log(
               `获取AU失败，请检查你的变量是否正确，如正确更换到环境变量或者配置文件重试`
             );
             auback = 1;
           } else {
             log(`获取AU失败，原因是：${result.message}`);
           }
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 偷朋友阳光
  */
 async function stealFriendSunshine(timeout = 2 * 1000) {
   //--0 先获取好友列表
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/friend/list?'+sign()+`&page=1&size=50`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
   };
   return new Promise(async (resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           if (result.code == 904) {
             refreshAu();
           } else if (result.code === 0) {
             const {
               data: { content },
             } = result;
             if (content.length > 0) {
               //--1 过滤可偷好友列表
               const stealList = content.filter((it) => it.stealAble);
               log("可偷好友列表为", stealList.length);
               if (stealList.length > 0) {
                 //--2 偷 然后汇总偷取的阳光
                 const stealNums = await stealList.reduce(async (pre, curt) => {
                   // 这里是关键，需要 await 前一个 task 执行的结果
                   // 实际上每个 reduce 每个循环执行都相当于 new Promise
                   // 但第二次执行可以拿到上一次执行的结果，也就是上一个 Promise
                   // 每次执行只要 await 上一个 Promise，即可实现依次执行
                   const prev = await pre;
                   if (stealFull) {
                     console.log("最多偷取10人，不再偷取");
                     return prev;
                   } else {
                     const next = await stealSunshine(curt.userId);
                     await $.wait(2 * 1000);
                     return prev + next;
                   }
                 }, 0);
                 console.log("偷取的数据", stealNums);
 
                 resolve(stealNums);
               } else resolve(0);
             } else {
               log(`没有好友，退出`);
               resolve(0);
             }
           } else {
             log(`遇到错误，原因是：${result.message}`);
             resolve(0);
           }
         } catch (e) {
           log(e);
         } finally {
           resolve(0);
         }
       },
       timeout
     );
   });
 }
 /**
  * 偷好友阳光
  */
 function stealSunshine(userId, timeout = 2 * 1000) {
   return new Promise((resolve) => {
     let url = {
       url:
         'http://api.xiaoyisz.com/qiehuang/ga/user/daily/steal?'+sign()+'&friendUserId='+userId,
       headers: {
         Host: "api.xiaoyisz.com",
         authorization: `${tyau}`,
         "user-agent": `${ua}`,
         "Content-Type": "application/json",
       },
     };
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           if (result.code == 904) {
             refreshAu();
           } else if (result.code === 0) {
             const { data: stealData } = result;
             if (stealData > 0) {
               log(`偷到好友阳光 ${stealData}g`);
               return resolve(stealData);
             } else return resolve(0);
           } else {
             log(`遇到错误，原因是：${JSON.stringify(result)}`);
             stealFull = true;
             resolve(0);
           }
         } catch (e) {
           log(e);
           stealFull = true;
           resolve(0);
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 上报任务
  */
 function report(num) {
   let url = {
     url: `http://api.xiaoyisz.com/qiehuang/ga/user/task/report?`+sign()+`&taskType=${taskTypeArr[num]}&attachId=${timestampMs()}&taskId=${taskIdArr[num]}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(url, async (error, response, data) => {
       try {
         let result = JSON.parse(data);
         if (result.code == 904) {
           refreshAu();
         }
         if (result.code == 902) {
           auback = 1;
           log(`AU失效，请重抓`);
           msg += `\nAU失效，请重抓`;
         } else if (result.data.status === 1) {
           log(`上报任务成功`);
         } else if (result.data.status == -2 || result.data.status == 2) {
           log(`上报任务失败，可能是已经完成`);
         } else {
           log(`上报任务失败，原因是：${result.message}`);
         }
       } catch (e) {
         log(e);
       } finally {
         resolve();
       }
     });
   });
 }
 
 /**
  * 领取奖励
  */
 function getDrawPriz(num) {
   let url = {
     url: `http://api.xiaoyisz.com/qiehuang/ga/user/task/drawPrize?`+sign()+`&taskId=${taskIdArr[num]}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(url, async (error, response, data) => {
       try {
         let result = JSON.parse(data);
         if (result.code == 904) {
           refreshAu();
         }
         if (result.code == 902) {
           auback = 1;
           log(`AU失效，请重抓`);
           msg += `\nAU失效，请重抓`;
         } else if (result.code === 1000) {
           log(`任务不是待领取状态`);
         } else if (result.code == 0) {
           let back = eval(result.data);
           log(`[${back.name}]任务领取奖励成功`);
         } else {
           log(`任务领取奖励失败，原因是：${result.message}`);
         }
       } catch (e) {
         log(e);
       } finally {
         resolve();
       }
     });
   });
 }
 
 /**
  * 获取任务
  */
 function getTask(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/task/list?'+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result);
           if (result.code == 901 || result.code == 902 || result.code == 903) {
             auback = 1;
             log(`AU错误，可能是获取失败，请更换到环境变量或配置文件重试`);
             msg += `\nAU错误，可能是获取失败，请更换到环境变量或配置文件重试`;
           }
           if (auback != 1 && result.code == 0) {
             log(`获取任务列表成功`);
             for (let i = 0; i < 10; i++) {
               if (i == 0) {
                 helpTaskId = back.data[i].taskId;
               }
               taskType = back.data[i].taskType;
               taskTypeArr[i] = taskType;
               taskId = back.data[i].taskId;
               taskIdArr[i] = taskId;
               if (back.data[i].completeTimes != back.data[i].retryTimes) {
                 taskBack[i] = 1;
               }
             }
           }
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 获取植物详情
  */
 function getPlant(num) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/plant/info?'+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(url, async (error, response, data) => {
       try {
         let result = JSON.parse(data);
         let back = eval(result);
         if (result.code == 904) {
           refreshAu();
         }
         if (result.data.stage == -1) {
           await $.wait(2 * 1000);
           getNewPlant();
         }
         if (result.code == 0) {
           log(`获取植物详情成功`);
           tyPlantId = result.data.plantId;
           progress =
             +result.data.currentSunshineNum / result.data.needSunshineNum;
           progress = progress * 100;
           progress = progress.toFixed(2);
           plantStage = +result.data.stage;
         } else log(`获取植物详情失败`);
       } catch (e) {
         log(e);
       } finally {
         resolve();
       }
     });
   });
 }
 
 /**
  * 开始挑战
  */
 function startCallenge(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/challenge/start?'+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           if (result.code == 904) {
             refreshAu();
           }
           if (auback != 1 && result.code == 0) {
             challengeId = result.data;
             reportCallenge();
             $.wait(2 * 1000);
           } else if (result.code == 1000) {
             log(`开始挑战失败，次数不足`);
           }
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 上报挑战
  */
 function reportCallenge(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/challenge/report?'+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
     body: `{"battleId":${challengeId},"result":1,"costMillisecond":${randomInt(
       6500,
       12000
     )}}`,
   };
   return new Promise((resolve) => {
     $.post(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (auback != 1 && result.code == 0) {
             log(`挑战成功`);
             startCallenge();
           } else log("挑战次数不足");
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 开始冒险
  */
 function startAdventure(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/adventure/start?'+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             log("冒险开始成功");
           } else if (result.code == 1000) {
             log(`冒险开始失败，可能是上报异常或者当前已有冒险`);
           } else log(`${result.message}`);
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 查询冒险
  */
 function queryAdventure(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/adventure/info?'+sign()+'&userId=-1&type=2',
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             adventureId = result.data.adventureId;
             if (timestampS() >= result.data.endTime) {
               reportAdventure();
             } else {
               let sleepTime = +result.data.endTime - timestampS();
               if (sleepTime <= 60) {
                 log(`距离冒险结束小于一分钟，等待${sleepTime}秒后收取冒险奖励`);
                 await sleep(sleepTime * 1000);
                 reportAdventure();
               } else
                 log(
                   `距离冒险结束还有：${parseInt(
                     sleepTime / 3600
                   )}小时${parseInt((sleepTime % 3600) / 60)}分钟${parseInt(
                     sleepTime % 60
                   )}秒，大于一分钟，不进行等待`
                 );
             }
           } else log("查询上一次冒险失败，可能是未进行");
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 上报冒险
  */
 function reportAdventure(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/adventure/drawPrize?'+sign()+`&adventureId=${adventureId}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             log(`冒险收取成功`);
           } else if (result.code == 500) {
             log(`当前无可收取的冒险`);
           } else if (result.code == 1000) {
             log(`冒险已收取`);
           } else log("冒险未到时间");
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 洒阳光
  */
 function giveSunshine(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/plant/batchgiveSunshine?'+sign()+`&plantId=${tyPlantId}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.message == "已达到收获阶段") {
             log("【开始收取植物】");
             $.wait(2 * 1000);
             getHarvest();
           } else if (result.message == "plantId错误") {
             log(`plantId错误，可能是运行的bug，不用管`);
           } else if (result.message == "只能给自己批量洒阳光") {
             log("只能给自己批量洒阳光");
           } else if (result.message == "阳光不足") {
             log("阳光不足");
             giveSunshineBack = 0;
           } else if (result.message != "阳光不足") {
             log("洒阳光成功");
             if (back.currentSunshineNum == back.needSunshineNum) {
               $.wait(3 * 1000);
               upgrade();
             }
             giveSunshineBack = 1;
           }
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 浇水
  */
 function upgrade(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/plant/upgrade?'+sign()+`&plantId=${tyPlantId}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             log("浇水升级成功");
           }
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 查询番茄余额
  */
 function getTomato(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/info?'+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             if (plantStage == 0) {
               plantStatus = "发育期";
             } else if (plantStage == 1) {
               plantStatus = "幼苗期";
             } else if (plantStage == 2) {
               plantStatus = "开花期";
             } else if (plantStage == 3) {
               plantStatus = "结果期";
             }
             log(
               `查询成功，账号[${name}]番茄余额为：${back.tomatoNum}，植物状态为：${plantStatus}，进度：${progress}%`
             );
             msg += `\n账号[${name}]番茄余额为：${back.tomatoNum}，植物状态为：${plantStatus}，进度：${progress}%`;
           }
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 收取阳光
  */
 function getSunshine(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/daily/pickup?'+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             log("收取阳光成功");
           } else if (result.code == 1000) {
             log("收取阳光失败，无可收取的阳光");
           } else log(`收取失败，原因是：${result.message}`);
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 收植物
  */
 function getHarvest(timeout = 2 * 1000) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/plant/harvest?'+sign()+`&plantId=${tyPlantId}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             log(`植物奖励收取成功，获得${back.infos[0].num}个番茄`);
             getNewPlant();
           } else if (result.code == 1000) {
             log(`植物奖励已收取`);
           } else log(`植物奖励收取失败，原因是：${result.message}`);
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 种植物
  */
 function getNewPlant(timeout = 2 * 1000) {
   let url = {
     url: `http://api.xiaoyisz.com/qiehuang/ga/plant/start?`+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             log(`种新的植物成功`);
             await $.wait(2 * 1000);
             getPlant();
             await $.wait(2 * 1000);
             giveSunshine();
           } else if (result.code == 1000) {
             log(`种失败，原因是：已种植`);
           } else log(`种新的植物失败，原因是：${result.message}`);
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 获取信息
  */
 function getUserInfo(timeout = 2 * 1000) {
   let url = {
     url: `http://api.xiaoyisz.com/qiehuang/ga/user/info?`+sign(),
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${tyau}`,
       "user-agent": `${ua}`,
       "Content-Type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(
       url,
       async (error, response, data) => {
         try {
           let result = JSON.parse(data);
           let back = eval(result.data);
           if (result.code == 904) {
             refreshAu();
           }
           if (result.code == 0) {
             name = back.nickName;
             id = back.id;
             await $.wait(2 * 1000);
             getTomato();
           } else log(`获取信息失败，原因是：${result.message}`);
         } catch (e) {
           log(e);
         } finally {
           resolve();
         }
       },
       timeout
     );
   });
 }
 
 /**
  * 互助 （num1助力num2）
  */
 function doHelp(num1, num2) {
   let url = {
     url: 'http://api.xiaoyisz.com/qiehuang/ga/user/task/report?'+sign()+`&taskType=${taskTypeArr[0]}&attachId=${idArr[num2]}&taskId=${helpTaskIdArr[num1]}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${newAuArr[num1]}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(url, async (error, response, data) => {
       try {
         let result = JSON.parse(data);
         if (result.data.status == 1) {
           log(`去助力[${result.data.nickName}]成功`);
         } else if (result.data.status == 3) {
           log(`助力失败，可能是已助力过`);
         } else if (result.data.status == 2) {
           log(`助力失败，该用户被助力次数已达上限`);
         } else {
           log(`助力失败，原因是：${result.message}`);
         }
       } catch (e) {
         log(e);
       } finally {
         resolve();
       }
     });
   });
 }
 
 /**
  * 互助洒阳光 （num1助力num2）
  */
 function doHelpGiveSunshine(num1, num2) {
   let url = {
     url: 'https://api.xiaoyisz.com/qiehuang/ga/plant/giveSunshine?'+sign()+`plantId=${plantIdArr[num2]}`,
     headers: {
       Host: "api.xiaoyisz.com",
       authorization: `${newAuArr[num1]}`,
       "user-agent": `${ua}`,
       "content-type": "application/json",
     },
   };
   return new Promise((resolve) => {
     $.get(url, async (error, response, data) => {
       try {
         let result = JSON.parse(data);
         if (result.code == 0) {
           log(`助力洒阳光成功`);
         } else if (result.code == 1000) {
           log(`助力洒阳光失败，今日已达上限`);
         } else {
           log(`助力洒阳光失败，原因是：${result.message}`);
         }
       } catch (e) {
         log(e);
       } finally {
         resolve();
       }
     });
   });
 }
 
 // ============================================重写============================================ \\
 async function GetRewrite() {
   if ($request.url.indexOf("qiehuang/ga/public/api/login") > -1) {
     const ck = $request.body;
     if (tybody) {
       if (tybody.indexOf(ck) == -1) {
         tybody = tybody + "@" + ck;
         let tyhz = tyhz + "@" + ck;
         $.setdata(tybody, "tybody");
         $.setdata(tybody, "tyhz");
         List = tybody.split("@");
         $.msg(
           $.name +
             ` 获取第${tybody.length}个 ck 成功: ${ck} ,不用请自行关闭重写!`
         );
       }
     } else {
       $.setdata(ck, "tybody");
       $.msg($.name + ` 获取第1个 ck 成功: ${ck} ,不用请自行关闭重写!`);
     }
   }
 }
 
 // ============================================变量检查============================================ \\
 async function Envs() {
   if (UA) {
     if (UA.indexOf("@") != -1) {
       UA.split("@").forEach((item) => {
         UAArr.push(item);
       });
     } else if (UA.indexOf("\n") != -1) {
       UA.split("\n").forEach((item) => {
         UAArr.push(item);
       });
     } else {
       UAArr.push(UA);
     }
   }
   if (tybody) {
     if (tybody.indexOf("@") != -1) {
       tybody.split("@").forEach((item) => {
         tybodyArr.push(item);
       });
     } else if (tybody.indexOf("\n") != -1) {
       tybody.split("\n").forEach((item) => {
         tybodyArr.push(item);
       });
     } else {
       tybodyArr.push(tybody);
     }
   } else {
     log(`\n 【${$.name}】：未填写变量 tybody`);
     return;
   }
 
   return true;
 }
 
 // ============================================发送消息============================================ \\
 async function SendMsg(message) {
   if (!message) return;
 
   if (Notify > 0) {
     if ($.isNode()) {
       var notify = require("./sendNotify");
       await notify.sendNotify($.name, message);
     } else {
       $.msg(message);
     }
   } else {
     log(message);
   }
 }
 
 
 /**
  * 随机整数生成
  */
 function randomInt(min, max) {
   return Math.round(Math.random() * (max - min) + min);
 }

 var cryptoPassFunc = function(password) {
   const md5 = crypto.createHash('md5');
   return md5.update(password).digest('hex').toUpperCase();
 };

 function h(a,b){const c=g();return h=function(d,e){d=d-0x175;let f=c[d];if(h['qsACAY']===undefined){var i=function(m){const n='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';let o='',p='',q=o+i;for(let r=0x0,s,t,u=0x0;t=m['charAt'](u++);~t&&(s=r%0x4?s*0x40+t:t,r++%0x4)?o+=q['charCodeAt'](u+0xa)-0xa!==0x0?String['fromCharCode'](0xff&s>>(-0x2*r&0x6)):r:0x0){t=n['indexOf'](t);}for(let v=0x0,w=o['length'];v<w;v++){p+='%'+('00'+o['charCodeAt'](v)['toString'](0x10))['slice'](-0x2);}return decodeURIComponent(p);};h['mYtgQV']=i,a=arguments,h['qsACAY']=!![];}const j=c[0x0],k=d+j,l=a[k];if(!l){const m=function(n){this['gLCZDc']=n,this['BUyofT']=[0x1,0x0,0x0],this['NOvhKX']=function(){return'newState';},this['gQegax']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['HZFqqv']='[\x27|\x22].+[\x27|\x22];?\x20*}';};m['prototype']['XszqBd']=function(){const n=new RegExp(this['gQegax']+this['HZFqqv']),o=n['test'](this['NOvhKX']['toString']())?--this['BUyofT'][0x1]:--this['BUyofT'][0x0];return this['qapbVw'](o);},m['prototype']['qapbVw']=function(n){if(!Boolean(~n))return n;return this['rymeOd'](this['gLCZDc']);},m['prototype']['rymeOd']=function(n){for(let o=0x0,p=this['BUyofT']['length'];o<p;o++){this['BUyofT']['push'](Math['round'](Math['random']())),p=this['BUyofT']['length'];}return n(this['BUyofT'][0x0]);},new m(h)['XszqBd'](),f=h['mYtgQV'](f),a[k]=f;}else f=l;return f;},h(a,b);}(function(i,j){const ag={i:0x183,j:0x187,k:0x1fd,l:0x1c8,m:0x192,n:0x194,o:0x1f9},O=h,k=i();while(!![]){try{const l=parseInt(O(ag.i))/0x1+parseInt(O(0x1b3))/0x2+parseInt(O(ag.j))/0x3*(-parseInt(O(0x1ed))/0x4)+-parseInt(O(ag.k))/0x5+parseInt(O(ag.l))/0x6*(parseInt(O(ag.m))/0x7)+-parseInt(O(ag.n))/0x8*(-parseInt(O(0x1c1))/0x9)+-parseInt(O(ag.o))/0xa;if(l===j)break;else k['push'](k['shift']());}catch(m){k['push'](k['shift']());}}}(g,0x36b8b));const f=(function(){const ap={i:0x1d0},ao={i:0x182},aj={i:0x198},P=h,i={'MSsee':function(k,l){return k===l;},'CcWgX':'zXkDY','fCQzV':function(k,l){return k!==l;},'JGEzT':P(ap.i)};let j=!![];return function(k,l){const ak={i:0x1ce},R=P,m={'jzHnK':function(n,o){const Q=h;return i[Q(aj.i)](n,o);},'RwWFN':i[R(0x1fb)]};if(i['fCQzV'](i[R(0x1bc)],R(ao.i))){const n=j?function(){const S=R;if(m[S(ak.i)](m[S(0x1d7)],m[S(0x1d7)])){if(l){const o=l[S(0x1b1)](k,arguments);return l=null,o;}}else{const q=l[S(0x1b1)](m,arguments);return n=null,q;}}:function(){};return j=![],n;}else{const p=o?function(){if(p){const C=y['apply'](z,arguments);return A=null,C;}}:function(){};return t=![],p;}};}()),e=f(this,function(){const aq={i:0x1a0,j:0x1b9,k:0x1ae},T=h,i={'eXsOn':T(aq.i)+'+$'};return e[T(aq.j)]()['search'](i['eXsOn'])[T(0x1b9)]()[T(aq.k)+'r'](e)[T(0x1f7)](i[T(0x18f)]);});e();function g(){const br=['ogfSAxrpza','AfvkzK1QDZjjnq','revjwLu','DxjLpq','tvnZzwu','zMzhALC','s1vMq1a','DhjHy2u','surgzw0','qxfqz3u','tvzisxy','DgrJCwW','kcGOlISPkYKRkq','A09Zv0i','Aw5WDxq','y2HHAw4','Dwrgy0C','rNbWzuu','tuT1zwm','sNvYz0y','C2v0sw50zxj2yq','zxHJzxb0Aw9U','AxHWCLi','D2fYBG','wgnNuvG','D0fZENu','y29UC3rYDwn0BW','rKrzjNnPz25HDa','twjfqvK','yxbWBhK','q0Xovue','ndmXodr1wvjIvwO','C3rYAw5N','uePPExy','q09eAdvNndbkyq','EM1ICxi','EMf2svy','Dg9tDhjPBMC','mwqZwwSXq0GMBG','r1rxrxC','sKDfELq','wvHcsgq','CuXtvu8','DfPpwuK','CMv0DxjUicHMDq','mZK3mJC3mw9Av25dDG','zgvIDq','EKvvBwq','ChjVDg90ExbL','swzxDtb4D1HSvW','xcTCkYaQkd86wW','Bg9N','mtHlA1vjBMq','zM5Xuw8','E30Uy29UC3rYDq','veLiD0G','AePMtKG','vKr2rhG','ANPiBKS','vwvgvuW','Cu9YDLm','Dhnfv1m','zsKGE30','DgvZDa','DhzHy3O','uhHVugS','qM1SzKi','uNDxrK4','A1HnDxm','q0vgD2m','EMfjtM8','CM4GDgHPCYiPka','zxbwq2K','zwnYzxq9qtrYsa','AMHRwM4','qxnqtuO','EuDiCvC','qMjPvMW','vLDgtLm','wMnPD1jWu2Lgra','BgvUz3rO','uwn1seu','zNDHD0W','v0zes2u','teLnrLG','z0DVuLe','sNDiy2O','DgfIBgu','BMHVv1a','mZm3nZK2r250BK1v','zLbOExe','s016wLK','s2TLDw8','s29eDu8','qwz5A0C','uwDJugW','ys16qs1AxYrDwW','y2fSBa','C3rHDgvpyMPLyW','C2vHCMnO','zxjYB3i','mJu4nZaYmhzRtfzJuG','t2D3zKG','q2nxz1G','CvnlyLe','ndq2mte1q25mA0zl','uw9cs2u','wMP0zeW','u1PsvuK','mhfWBZzHmZbOwa','qxfur2q','we1ct0q','Aw5MBW','mc05ys16qs1AxW','zKzQAey','uLLYuu0','q21TEKu','AhL0AuW','A0vYAeW','veXIBgC','EKzqAwi','CMXkwLe','BMn0Aw9UkcKG','y3rVCIGICMv0Dq','ywn0Aw9U','z2Lls0C','mJa1nJa1z09WDNrm','yMLUza','z3fRsum3rfDUmG','x19WCM90B19F','ou1dChLiua','qLvOt2W','D2HPBguGkhrYDq','wsz0Aw1LC3rHBq','rKztBvq','zhrUshi','Cuz3CgC','jM5VBMnLptznna','zvHZt24','z2DLCG','uhHquLi','mZy1odu1Dvvjwuns','y29UC29Szq'];g=function(){return br;};return g();}const d=(function(){const aA={i:0x17f,j:0x1ca,k:0x180,l:0x1ab,m:0x19b,n:0x17a},az={i:0x1d5,j:0x1cf,k:0x193,l:0x193,m:0x19c,n:0x17b,o:0x1e2,p:0x1f3,q:0x1ae,r:0x184},U=h,i={'PxoPk':function(k,l){return k(l);},'hpqyR':function(k,l){return k+l;},'JurgF':function(k,l){return k+l;},'xpmYM':'return\x20(fu'+U(aA.i),'UeFUL':U(aA.j)+U(aA.k)+U(0x1db)+'\x20)','TLblg':function(k){return k();},'IDFem':U(0x1c7),'Wvthi':U(aA.l),'kErhL':'info','MAAoP':U(0x1f8),'VDvDx':U(0x1a9),'VWFNS':'table','XcgQX':U(aA.m),'QgcPl':function(k,l){return k<l;},'UsWxL':function(k,l){return k===l;},'eTzPB':U(aA.n)};let j=!![];return function(k,l){const V=U;if(i['UsWxL']('AeIFD',i['eTzPB'])){let n;try{const q=i[V(az.i)](u,i['hpqyR'](i[V(0x1a7)](i['xpmYM'],i[V(az.j)]),');'));n=i[V(0x17c)](q);}catch(r){n=w;}const o=n[V(az.k)]=n[V(az.l)]||{},p=[i[V(az.m)],i['Wvthi'],i[V(az.n)],i['MAAoP'],i[V(0x1cd)],i[V(az.o)],i[V(0x1ac)]];for(let s=0x0;i[V(az.p)](s,p['length']);s++){const t=B[V(az.q)+'r'][V(0x1c4)]['bind'](C),u=p[s],v=o[u]||t;t[V(0x186)]=D[V(az.r)](E),t[V(0x1b9)]=v[V(0x1b9)][V(az.r)](v),o[u]=t;}}else{const n=j?function(){const W=V;if(l){const o=l[W(0x1b1)](k,arguments);return l=null,o;}}:function(){};return j=![],n;}};}());(function(){const aE={i:0x1be,j:0x1c6,k:0x1f4,l:0x1f1,m:0x200,n:0x179},X=h,i={'qLSUO':'function\x20*'+'\x5c(\x20*\x5c)','CmmzE':function(j,k){return j(k);},'RYrQM':'init','KoDuO':function(j,k){return j+k;},'fcQcn':X(0x1a3),'SZRUI':X(0x1a2),'gGoRQ':function(j){return j();}};d(this,function(){const Y=X,j=new RegExp(i[Y(aE.i)]),k=new RegExp(Y(aE.j)+Y(aE.k)+Y(0x176)+'$]*)','i'),l=i[Y(0x179)](c,i[Y(0x178)]);!j[Y(0x1d3)](i[Y(aE.l)](l,i['fcQcn']))||!k[Y(0x1d3)](l+i[Y(aE.m)])?i[Y(aE.n)](l,'0'):i[Y(0x1e9)](c);})();}());const b=(function(){const aK={i:0x1a6},aI={i:0x1cb,j:0x1b1},Z=h,i={'fnqQo':function(k,l){return k(l);},'tZOYI':'qFJqU','MKuec':function(k,l){return k!==l;},'GTWEw':Z(0x1c3)};let j=!![];return function(k,l){const a0=Z;if(i[a0(aK.i)]('zEUmd',i[a0(0x1bb)]))i[a0(0x1c9)](j,'0');else{const n=j?function(){const a1=a0;if(l){if(a1(aI.i)!==i[a1(0x1bf)]){const o=l[a1(aI.j)](k,arguments);return l=null,o;}else k=l;}}:function(){};return j=![],n;}};}()),a=b(this,function(){const aO={i:0x180,j:0x1c7,k:0x1f8,l:0x1eb,m:0x19b,n:0x1ef,o:0x1c0,p:0x193,q:0x1e6,r:0x1a9,s:0x19a,t:0x1c4,u:0x184,v:0x1b9},a2=h,i={'yGHqW':function(m,n){return m(n);},'KMzZY':function(m,n){return m+n;},'AUAtA':a2(0x1ca)+a2(aO.i)+'rn\x20this\x22)('+'\x20)','dkzZh':a2(aO.j),'EESAF':'warn','ffGjW':a2(0x175),'fwawL':a2(aO.k),'JwHcj':a2(aO.l),'KUfCP':a2(aO.m)};let j;try{const m=i[a2(0x1e0)](Function,i[a2(aO.n)](i[a2(0x1ef)](a2(aO.o)+a2(0x17f),i['AUAtA']),');'));j=m();}catch(n){j=window;}const k=j[a2(aO.p)]=j[a2(0x193)]||{},l=[i['dkzZh'],i['EESAF'],i[a2(0x199)],i[a2(aO.q)],a2(aO.r),i[a2(0x1ea)],i[a2(aO.s)]];for(let o=0x0;o<l['length'];o++){const p=b['constructo'+'r'][a2(aO.t)][a2(aO.u)](b),q=l[o],r=k[q]||p;p['__proto__']=b[a2(aO.u)](b),p[a2(aO.v)]=r[a2(0x1b9)]['bind'](r),k[q]=p;}});(function(){const aX={i:0x1ca,j:0x180,k:0x1e8,l:0x1a8},aW={i:0x1ec,j:0x1aa,k:0x1a5,l:0x1b2,m:0x18d,n:0x1b5,o:0x1b1},a3=h,i={'XYkOv':a3(0x1c2),'nhoWP':a3(0x190),'ixprR':function(l,m){return l===m;},'SBADn':'MFQKs','FppeE':a3(0x1b0),'CLNUA':function(l,m){return l(m);},'qFwpg':function(l,m){return l+m;},'qSKbQ':a3(aX.i)+a3(aX.j)+a3(0x1db)+'\x20)','wAszu':function(l,m){return l!==m;},'tKrAp':'ZRehX','cHEdO':a3(aX.k)},j=function(){const a4=a3,l={'ceZcL':i['XYkOv'],'PJiyv':i[a4(aW.i)]};if(i[a4(aW.j)](i['SBADn'],i[a4(aW.k)])){const aT={i:0x1b1},n=o?function(){const a5=a4;if(n){const C=y[a5(aT.i)](z,arguments);return A=null,C;}}:function(){};return t=![],n;}else{let n;try{n=i[a4(aW.l)](Function,i['qFwpg'](i[a4(aW.m)](a4(0x1c0)+a4(0x17f),i[a4(0x1fc)]),');'))();}catch(o){i[a4(0x1ad)](i['tKrAp'],i['cHEdO'])?n=window:function(){return![];}[a4(0x1ae)+'r'](l['ceZcL']+l[a4(aW.n)])[a4(aW.o)](a4(0x1f6)+'t');}return n;}},k=j();k[a3(aX.l)+'l'](c,0xfa0);}()),a();function sign(){const b0={i:0x1a1,j:0x1c5,k:0x201,l:0x195,m:0x1ba,n:0x1e3,o:0x18a,p:0x18e,q:0x1af,r:0x197},a6=h,i={'WFDKe':function(l){return l();},'kOsWB':function(l,m){return l(m);}};let j=i[a6(0x1e7)](timestampMs),k=i[a6(b0.i)](cryptoPassFunc,'clientKey='+a6(b0.j)+a6(0x185)+a6(b0.k)+'X6&clientS'+a6(0x1dd)+a6(b0.l)+a6(0x1b6)+a6(b0.m)+'once=6M43d'+a6(b0.n)+a6(b0.o)+'p='+j);return'timestamp='+j+(a6(b0.p)+'3dZciwRpSi'+a6(b0.q)+a6(b0.r))+k;}function c(i){const bq={i:0x189,j:0x1d2,k:0x1de,l:0x177,m:0x181,n:0x188,o:0x196,p:0x1d6,q:0x1e1,r:0x1ee},bp={i:0x1da,j:0x1dc,k:0x1fe,l:0x1ae,m:0x1b1,n:0x1f0,o:0x1a4,p:0x18b,q:0x1f5,r:0x1d8,s:0x18c,t:0x1b1},bn={i:0x180,j:0x1db,k:0x17d,l:0x1c0,m:0x1cc},a7=h,j={'epVCi':a7(bq.i)+a7(bq.j),'AfykG':'counter','BbiVl':function(l,m){return l+m;},'zaINo':function(l,m){return l!==m;},'tvacz':a7(bq.k),'YXBHd':a7(bq.l),'yUWgS':function(l,m){return l===m;},'QoBKe':a7(0x1b4),'Kkeuo':function(l,m){return l/m;},'udFcG':a7(0x1e4),'EPaEB':function(l,m){return l%m;},'FFSmT':function(l,m){return l+m;},'dtnHr':a7(0x1c2),'kXMus':a7(bq.m),'tsEWS':function(l,m){return l+m;},'QcuHE':a7(0x1f6)+'t','AqTGd':function(l,m){return l(m);},'BmlfB':function(l,m){return l+m;},'XqRcT':a7(0x1c0)+a7(0x17f),'fPhyq':'{}.constru'+'ctor(\x22retu'+'rn\x20this\x22)('+'\x20)','XMBOD':function(l,m){return l!==m;},'AqPgu':a7(bq.n),'DEIZU':a7(0x19f),'MVHIv':function(l,m){return l(m);}};function k(l){const bd={i:0x1da},aa=a7,m={'rlJZQ':function(n,o){const a8=h;return j[a8(0x1e1)](n,o);},'ZjtdL':function(n,o){const a9=h;return j[a9(bd.i)](n,o);},'zFPib':j[aa(0x1d4)]};if(j[aa(bp.i)](aa(0x177),j[aa(0x1bd)]))return function(o){}['constructo'+'r'](j[aa(bp.j)])[aa(0x1b1)](j[aa(0x1f2)]);else{if(j['yUWgS'](typeof l,j[aa(bp.k)]))return function(o){}[aa(bp.l)+'r'](j[aa(0x1dc)])[aa(bp.m)](j['AfykG']);else j[aa(bp.i)]((''+j[aa(bp.n)](l,l))[j[aa(bp.o)]],0x1)||j['EPaEB'](l,0x14)===0x0?function(){const bm={i:0x191,j:0x1b7},ac=aa,o={'zavIV':function(p,q){return p+q;},'AsPMJ':function(p,q){const ab=h;return m[ab(0x17e)](p,q);},'hJfNH':ac(0x1ca)+ac(bn.i)+ac(bn.j)+'\x20)','CKBbZ':function(p){return p();}};if(m[ac(0x1ff)]('jhkZn',m[ac(bn.k)])){const bk={i:0x1b8},q={'OgwfH':function(t,u){return t(u);},'PxPRR':function(t,u){const ad=ac;return o[ad(bk.i)](t,u);},'CEFwc':function(t,u){const ae=ac;return o[ae(0x1df)](t,u);},'ATKOy':ac(bn.l)+ac(0x17f),'zmbqr':o[ac(bn.m)]},r=function(){const af=ac;let v;try{v=q[af(0x1fa)](q,q[af(bm.i)](q[af(0x1d9)](q['ATKOy'],q[af(bm.j)]),');'))();}catch(w){v=s;}return v;},s=o['CKBbZ'](r);s[ac(0x1a8)+'l'](n,0xfa0);}else return!![];}[aa(0x1ae)+'r'](j[aa(bp.p)](j[aa(0x18c)],aa(0x190)))[aa(bp.q)](j[aa(bp.r)]):function(){return![];}[aa(0x1ae)+'r'](j[aa(0x1d1)](j[aa(bp.s)],aa(0x190)))[aa(bp.t)](j[aa(0x1e5)]);k(++l);}}try{if(j[a7(0x203)](j[a7(0x19d)],j[a7(bq.o)])){if(i)return k;else j[a7(0x19e)](k,0x0);}else{let m;try{m=j[a7(0x202)](m,j[a7(bq.p)](j[a7(bq.q)](j['XqRcT'],j[a7(bq.r)]),');'))();}catch(n){m=o;}return m;}}catch(m){}}
 /**
  * 获取秒时间戳
  */
 function timestampS() {
   return Date.parse(new Date()) / 1000;
 }

 function timestampMs(){
    return new Date().getTime();
 }

 
 /**
  * 修改配置文件
  */
 function modify() {
   fs.readFile("/ql/data/config/config.sh", "utf8", function (err, dataStr) {
     if (err) {
       return log("读取文件失败！" + err);
     } else {
       var result = dataStr.replace(
         /tyau="[\w-\s/+@]{0,1000}"/g,
         `tyau="${newAuArr[0]}@${newAuArr[1]}@${newAuArr[2]}"`
       );
       fs.writeFile("/ql/data/config/config.sh", result, "utf8", function (err) {
         if (err) {
           return log(err);
         }
       });
     }
   });
 }
 
 /**
  * 休眠
  */
 function sleep(timeout) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
 }


 function Env(t, e) {
   "undefined" != typeof process &&
     JSON.stringify(process.env).indexOf("GITHUB") > -1 &&
     process.exit(0);
   class s {
     constructor(t) {
       this.env = t;
     }
     send(t, e = "GET") {
       t = "string" == typeof t ? { url: t } : t;
       let s = this.get;
       return (
         "POST" === e && (s = this.post),
         new Promise((e, i) => {
           s.call(this, t, (t, s, r) => {
             t ? i(t) : e(s);
           });
         })
       );
     }
     get(t) {
       return this.send.call(this.env, t);
     }
     post(t) {
       return this.send.call(this.env, t, "POST");
     }
   }
   return new (class {
     constructor(t, e) {
       (this.name = t),
         (this.http = new s(this)),
         (this.data = null),
         (this.dataFile = "box.dat"),
         (this.logs = []),
         (this.isMute = !1),
         (this.isNeedRewrite = !1),
         (this.logSeparator = "\n"),
         (this.startTime = new Date().getTime()),
         Object.assign(this, e),
         this.log("", `🔔${this.name}, 开始!`);
     }
     isNode() {
       return "undefined" != typeof module && !!module.exports;
     }
     isQuanX() {
       return "undefined" != typeof $task;
     }
     isSurge() {
       return "undefined" != typeof $httpClient && "undefined" == typeof $loon;
     }
     isLoon() {
       return "undefined" != typeof $loon;
     }
     toObj(t, e = null) {
       try {
         return JSON.parse(t);
       } catch {
         return e;
       }
     }
     toStr(t, e = null) {
       try {
         return JSON.stringify(t);
       } catch {
         return e;
       }
     }
     getjson(t, e) {
       let s = e;
       const i = this.getdata(t);
       if (i)
         try {
           s = JSON.parse(this.getdata(t));
         } catch {}
       return s;
     }
     setjson(t, e) {
       try {
         return this.setdata(JSON.stringify(t), e);
       } catch {
         return !1;
       }
     }
     getScript(t) {
       return new Promise((e) => {
         this.get({ url: t }, (t, s, i) => e(i));
       });
     }
     runScript(t, e) {
       return new Promise((s) => {
         let i = this.getdata("@chavy_boxjs_userCfgs.httpapi");
         i = i ? i.replace(/\n/g, "").trim() : i;
         let r = this.getdata("@chavy_boxjs_userCfgs.httpapi_timeout");
         (r = r ? 1 * r : 20), (r = e && e.timeout ? e.timeout : r);
         const [o, h] = i.split("@"),
           n = {
             url: `http://${h}/v1/scripting/evaluate`,
             body: { script_text: t, mock_type: "cron", timeout: r },
             headers: { "X-Key": o, Accept: "*/*" },
           };
         this.post(n, (t, e, i) => s(i));
       }).catch((t) => this.logErr(t));
     }
     loaddata() {
       if (!this.isNode()) return {};
       {
         (this.fs = this.fs ? this.fs : require("fs")),
           (this.path = this.path ? this.path : require("path"));
         const t = this.path.resolve(this.dataFile),
           e = this.path.resolve(process.cwd(), this.dataFile),
           s = this.fs.existsSync(t),
           i = !s && this.fs.existsSync(e);
         if (!s && !i) return {};
         {
           const i = s ? t : e;
           try {
             return JSON.parse(this.fs.readFileSync(i));
           } catch (t) {
             return {};
           }
         }
       }
     }
     writedata() {
       if (this.isNode()) {
         (this.fs = this.fs ? this.fs : require("fs")),
           (this.path = this.path ? this.path : require("path"));
         const t = this.path.resolve(this.dataFile),
           e = this.path.resolve(process.cwd(), this.dataFile),
           s = this.fs.existsSync(t),
           i = !s && this.fs.existsSync(e),
           r = JSON.stringify(this.data);
         s
           ? this.fs.writeFileSync(t, r)
           : i
           ? this.fs.writeFileSync(e, r)
           : this.fs.writeFileSync(t, r);
       }
     }
     lodash_get(t, e, s) {
       const i = e.replace(/\[(\d+)\]/g, ".$1").split(".");
       let r = t;
       for (const t of i) if (((r = Object(r)[t]), void 0 === r)) return s;
       return r;
     }
     lodash_set(t, e, s) {
       return Object(t) !== t
         ? t
         : (Array.isArray(e) || (e = e.toString().match(/[^.[\]]+/g) || []),
           (e
             .slice(0, -1)
             .reduce(
               (t, s, i) =>
                 Object(t[s]) === t[s]
                   ? t[s]
                   : (t[s] = Math.abs(e[i + 1]) >> 0 == +e[i + 1] ? [] : {}),
               t
             )[e[e.length - 1]] = s),
           t);
     }
     getdata(t) {
       let e = this.getval(t);
       if (/^@/.test(t)) {
         const [, s, i] = /^@(.*?)\.(.*?)$/.exec(t),
           r = s ? this.getval(s) : "";
         if (r)
           try {
             const t = JSON.parse(r);
             e = t ? this.lodash_get(t, i, "") : e;
           } catch (t) {
             e = "";
           }
       }
       return e;
     }
     setdata(t, e) {
       let s = !1;
       if (/^@/.test(e)) {
         const [, i, r] = /^@(.*?)\.(.*?)$/.exec(e),
           o = this.getval(i),
           h = i ? ("null" === o ? null : o || "{}") : "{}";
         try {
           const e = JSON.parse(h);
           this.lodash_set(e, r, t), (s = this.setval(JSON.stringify(e), i));
         } catch (e) {
           const o = {};
           this.lodash_set(o, r, t), (s = this.setval(JSON.stringify(o), i));
         }
       } else s = this.setval(t, e);
       return s;
     }
     getval(t) {
       return this.isSurge() || this.isLoon()
         ? $persistentStore.read(t)
         : this.isQuanX()
         ? $prefs.valueForKey(t)
         : this.isNode()
         ? ((this.data = this.loaddata()), this.data[t])
         : (this.data && this.data[t]) || null;
     }
     setval(t, e) {
       return this.isSurge() || this.isLoon()
         ? $persistentStore.write(t, e)
         : this.isQuanX()
         ? $prefs.setValueForKey(t, e)
         : this.isNode()
         ? ((this.data = this.loaddata()),
           (this.data[e] = t),
           this.writedata(),
           !0)
         : (this.data && this.data[e]) || null;
     }
     initGotEnv(t) {
       (this.got = this.got ? this.got : require("got")),
         (this.cktough = this.cktough ? this.cktough : require("tough-cookie")),
         (this.ckjar = this.ckjar ? this.ckjar : new this.cktough.CookieJar()),
         t &&
           ((t.headers = t.headers ? t.headers : {}),
           void 0 === t.headers.Cookie &&
             void 0 === t.cookieJar &&
             (t.cookieJar = this.ckjar));
     }
     get(t, e = () => {}) {
       t.headers &&
         (delete t.headers["Content-Type"], delete t.headers["Content-Length"]),
         this.isSurge() || this.isLoon()
           ? (this.isSurge() &&
               this.isNeedRewrite &&
               ((t.headers = t.headers || {}),
               Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
             $httpClient.get(t, (t, s, i) => {
               !t && s && ((s.body = i), (s.statusCode = s.status)), e(t, s, i);
             }))
           : this.isQuanX()
           ? (this.isNeedRewrite &&
               ((t.opts = t.opts || {}), Object.assign(t.opts, { hints: !1 })),
             $task.fetch(t).then(
               (t) => {
                 const { statusCode: s, statusCode: i, headers: r, body: o } = t;
                 e(null, { status: s, statusCode: i, headers: r, body: o }, o);
               },
               (t) => e(t)
             ))
           : this.isNode() &&
             (this.initGotEnv(t),
             this.got(t)
               .on("redirect", (t, e) => {
                 try {
                   if (t.headers["set-cookie"]) {
                     const s = t.headers["set-cookie"]
                       .map(this.cktough.Cookie.parse)
                       .toString();
                     s && this.ckjar.setCookieSync(s, null),
                       (e.cookieJar = this.ckjar);
                   }
                 } catch (t) {
                   this.logErr(t);
                 }
               })
               .then(
                 (t) => {
                   const {
                     statusCode: s,
                     statusCode: i,
                     headers: r,
                     body: o,
                   } = t;
                   e(null, { status: s, statusCode: i, headers: r, body: o }, o);
                 },
                 (t) => {
                   const { message: s, response: i } = t;
                   e(s, i, i && i.body);
                 }
               ));
     }
     post(t, e = () => {}) {
       if (
         (t.body &&
           t.headers &&
           !t.headers["Content-Type"] &&
           (t.headers["Content-Type"] = "application/x-www-form-urlencoded"),
         t.headers && delete t.headers["Content-Length"],
         this.isSurge() || this.isLoon())
       )
         this.isSurge() &&
           this.isNeedRewrite &&
           ((t.headers = t.headers || {}),
           Object.assign(t.headers, { "X-Surge-Skip-Scripting": !1 })),
           $httpClient.post(t, (t, s, i) => {
             !t && s && ((s.body = i), (s.statusCode = s.status)), e(t, s, i);
           });
       else if (this.isQuanX())
         (t.method = "POST"),
           this.isNeedRewrite &&
             ((t.opts = t.opts || {}), Object.assign(t.opts, { hints: !1 })),
           $task.fetch(t).then(
             (t) => {
               const { statusCode: s, statusCode: i, headers: r, body: o } = t;
               e(null, { status: s, statusCode: i, headers: r, body: o }, o);
             },
             (t) => e(t)
           );
       else if (this.isNode()) {
         this.initGotEnv(t);
         const { url: s, ...i } = t;
         this.got.post(s, i).then(
           (t) => {
             const { statusCode: s, statusCode: i, headers: r, body: o } = t;
             e(null, { status: s, statusCode: i, headers: r, body: o }, o);
           },
           (t) => {
             const { message: s, response: i } = t;
             e(s, i, i && i.body);
           }
         );
       }
     }
     time(t, e = null) {
       const s = e ? new Date(e) : new Date();
       let i = {
         "M+": s.getMonth() + 1,
         "d+": s.getDate(),
         "H+": s.getHours(),
         "m+": s.getMinutes(),
         "s+": s.getSeconds(),
         "q+": Math.floor((s.getMonth() + 3) / 3),
         S: s.getMilliseconds(),
       };
       /(y+)/.test(t) &&
         (t = t.replace(
           RegExp.$1,
           (s.getFullYear() + "").substr(4 - RegExp.$1.length)
         ));
       for (let e in i)
         new RegExp("(" + e + ")").test(t) &&
           (t = t.replace(
             RegExp.$1,
             1 == RegExp.$1.length
               ? i[e]
               : ("00" + i[e]).substr(("" + i[e]).length)
           ));
       return t;
     }
     msg(e = t, s = "", i = "", r) {
       const o = (t) => {
         if (!t) return t;
         if ("string" == typeof t)
           return this.isLoon()
             ? t
             : this.isQuanX()
             ? { "open-url": t }
             : this.isSurge()
             ? { url: t }
             : void 0;
         if ("object" == typeof t) {
           if (this.isLoon()) {
             let e = t.openUrl || t.url || t["open-url"],
               s = t.mediaUrl || t["media-url"];
             return { openUrl: e, mediaUrl: s };
           }
           if (this.isQuanX()) {
             let e = t["open-url"] || t.url || t.openUrl,
               s = t["media-url"] || t.mediaUrl;
             return { "open-url": e, "media-url": s };
           }
           if (this.isSurge()) {
             let e = t.url || t.openUrl || t["open-url"];
             return { url: e };
           }
         }
       };
       if (
         (this.isMute ||
           (this.isSurge() || this.isLoon()
             ? $notification.post(e, s, i, o(r))
             : this.isQuanX() && $notify(e, s, i, o(r))),
         !this.isMuteLog)
       ) {
         let t = ["", "==============📣系统通知📣=============="];
         t.push(e),
           s && t.push(s),
           i && t.push(i),
           console.log(t.join("\n")),
           (this.logs = this.logs.concat(t));
       }
     }
     log(...t) {
       t.length > 0 && (this.logs = [...this.logs, ...t]),
         console.log(t.join(this.logSeparator));
     }
     logErr(t, e) {
       const s = !this.isSurge() && !this.isQuanX() && !this.isLoon();
       s
         ? this.log("", `❗️${this.name}, 错误!`, t.stack)
         : this.log("", `❗️${this.name}, 错误!`, t);
     }
     wait(t) {
       return new Promise((e) => setTimeout(e, t));
     }
     done(t = {}) {
       const e = new Date().getTime(),
         s = (e - this.startTime) / 1e3;
       this.log("", `🔔${this.name}, 结束! 🕛 ${s} 秒`),
         this.log(),
         (this.isSurge() || this.isQuanX() || this.isLoon()) && $done(t);
     }
   })(t, e);
 }
 
