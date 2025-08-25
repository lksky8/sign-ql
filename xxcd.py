"""
星星充电签到
作者：https://github.com/lksky8/sign-ql
日期：2025-08-21

使用方法：打开app随便抓一个包，把头部'Authorization'内容填入 export startoken=""
另外可以再填入cityid可填可不填

支持多用户运行，多用户用&或者@隔开

export startoken="eyJ0eXAiOiJKV1QiLCJhbGciOiJIU1NiJ9..&eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1J9.."
export starcityid=""

每天运行一次即可
cron: 0 7 * * *
const $ = new Env("星星充电签到");
"""
import requests
import re
import os
import datetime
import hashlib
import time


if 'startoken' in os.environ:
    startoken = re.split("@|&",os.environ.get("startoken"))
    print(f'查找到{len(startoken)}个账号\n')
else:
    startoken =['']
    print('无startoken变量')



if 'starcityid' in os.environ:
    cityid = os.environ.get("starcityid")
    print(f'已填入cityid{cityid}')
else:
    cityid = '440000'
    print('没有填写cityid,系统默认使用440000')



def md5_encrypt(text):
    md5_hash = hashlib.md5()
    md5_hash.update(text.encode('utf-8'))
    md5_result = md5_hash.hexdigest()
    return md5_result

def time13():
    now = datetime.datetime.now()
    timestamp_ms = int(now.timestamp() * 1000) + (now.microsecond // 1000)
    return str(timestamp_ms)


def signature_task(id):
    return md5_encrypt('nonce=c4720525-d9fd-4db7-8420-736c0ef1c63b&taskId='+id+'&taskType=1&timestamp='+time13()+'&userId=')[0:18].upper()


def find_task_ids(data):
    this_week_task_id = None
    this_month_task_id = None
    for model in data:
        for task in model['taskList']:
            if task['taskName'] == '本周充电任务':
                this_week_task_id = task['taskId']
            elif task['taskName'] == '本月充电任务':
                this_month_task_id = task['taskId']
    return this_week_task_id, this_month_task_id


send_msg = ''
one_msg = ''


def Log(cont=''):
    global send_msg, one_msg
    if cont:
        one_msg += f'{cont}\n'
        send_msg += f'{cont}\n'


# 发送通知消息
def send_notification_message(title):
    try:
        from notify import send
        print("加载通知服务成功！")
        send(title, send_msg)
    except Exception as e:
        if e:
            print('发送通知消息失败！')


def sign(token):
    try:
        signature = md5_encrypt('nonce=2b4aa7d9-4137-4e51-94e3-7b7355bf202a&timestamp='+time13()+'&userId=')[0:18].upper()
        headers = {
            'Host': 'gateway.starcharge.com',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Referer': 'https://scm-app-h5.starcharge.com/',
            'appVersion': '7.40.0',
            'Origin': 'https://scm-app-h5.starcharge.com',
            'signature': signature,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Site': 'same-site',
            'referrer': 'web',
            'timestamp': time13(),
            'positCity': cityid,
            'Authorization': token,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept': 'application/json, text/plain, */*',
            'channel-id': '98',
            'Sec-Fetch-Mode': 'cors',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        data = "nonce=2b4aa7d9-4137-4e51-94e3-7b7355bf202a"
        response = requests.post(url='https://gateway.starcharge.com/apph5/webApiV2/starPoint/sign',headers=headers, data=data)
        response_json = response.json()
        if response_json['code'] == '200':
            print(f"签到成功：获得{response_json['data']['basePoint']}积分，已连续签到{response_json['data']['continuousDay']}天")
            Log(f"签到成功：获得{response_json['data']['basePoint']}积分，已连续签到{response_json['data']['continuousDay']}天")
            return True
        elif response_json['code'] == '402':
            print('用户数据获取失败，重新尝试获取数据')
            return False
        else:
            print("签到失败:", response.text)
            return False
    except requests.exceptions.RequestException as e:
        print("Failed to send POST request. Status Code:", response.status_code)
        print("出错了:", response.text)
        print(e)


def Get_list(token):
    try:
        signature = md5_encrypt('city=' + cityid + '&nonce=c4720525-d9fd-4db7-8420-736c0ef1c63b&timestamp=' + time13() + '&userId=')[0:18].upper()
        headers = {'Connection': 'keep-alive',
                   'Authorization': token,
                   'Accept': 'application/json, text/plain, */*',
                   'positCity': cityid,
                   'timestamp': time13(),
                   'signature': signature,
                   'User-Agent': 'Mozilla/5.0 (Linux; Android 12; 2112123AC Build/SKQ1.211230.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36',
                   'Accept-Encoding': 'gzip, deflate',
                   'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                   }
        response = requests.get("https://gateway.starcharge.com/apph5/webApiV2/userTask/model/list?city=" + cityid + "&nonce=c4720525-d9fd-4db7-8420-736c0ef1c63b",headers=headers)
        response_json = response.json()
        if response_json['code'] == '200':
            return response_json['data']
        elif response_json['code'] == '402':
            print('用户数据获取失败，重新尝试获取数据')
            return False
        else:
            print("获取任务列表:", response.text)
            return False
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)


def Do_task(id,token):
    try:
        headers = {'Connection': 'keep-alive',
                   'Authorization': token,
                   'Accept': 'application/json, text/plain, */*',
                   'positCity': cityid,
                   'timestamp': time13(),
                   'signature': signature_task(id),
                   'User-Agent': 'Mozilla/5.0 (Linux; Android 12; 2112123AC Build/SKQ1.211230.001; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/96.0.4664.104 Mobile Safari/537.36',
                   'Accept-Encoding': 'gzip, deflate',
                   'Accept-Language': 'zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7',
                   }
        response = requests.get("https://gateway.starcharge.com/apph5/webApiV2/userTask/get?nonce=c4720525-d9fd-4db7-8420-736c0ef1c63b&taskId="+id+"&taskType=1&timestamp="+time13()+"&userId=", headers=headers)
        response_json = response.json()
        # if response.status_code == 200:
        #     try:
        #         response_data = response.json()
        #         return response_data['text']
        #     except json.JSONDecodeError:
        #         print("Response Content:", response.text)
        # else:
        #     print("Failed to send POST request. Status Code:", response.status_code)
        #     print("Response Content:", response.text)
        if response_json['code'] == None:
            return response_json['text']
        elif response_json['code'] == '402':
            print('用户数据获取失败，重新尝试获取数据')
            return False
        elif response_json['code'] == '200' and response_json['text'] == None :
            return '任务已领取'
        else:
            print("做任务:", response.text)
            return False
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)


def Get_info(token):
    try:
        signature = md5_encrypt('city=' + cityid + '&nonce=0f597ec8-f0af-48e5-bc39-473c17c3b7ae&timestamp=' + time13() + '&userId=')[0:18].upper()
        headers = {
            'Host': 'gateway.starcharge.com',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Referer': 'https://scm-app-h5.starcharge.com/',
            'appVersion': '7.40.0',
            'Origin': 'https://scm-app-h5.starcharge.com',
            'signature': signature,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Site': 'same-site',
            'referrer': 'web',
            'timestamp': time13(),
            'positCity': cityid,
            'Authorization': token,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept': 'application/json, text/plain, */*',
            'channel-id': '98',
            'Sec-Fetch-Mode': 'cors',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        response = requests.get("https://gateway.starcharge.com/apph5/v2/webApiV2/star/point/user?city="+cityid+"&nonce=0f597ec8-f0af-48e5-bc39-473c17c3b7ae", headers=headers)
        response_json = response.json()
        if response_json['code'] == '200':
            print(f'用户({response_json["data"]["nickName"]})目前金币：{response_json["data"]["points"]}')
            Log(f'用户({response_json["data"]["nickName"]})目前金币：{response_json["data"]["points"]}\n')
            return True
        elif response_json['code'] == '402':
            print('用户数据获取失败，重新尝试获取数据')
            return False
        else:
            print('用户数据查询失败:' + response.text)
            return False
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)
    except Exception as e:
        print("出错了:", e)


def main():
    z = 1
    for ck in startoken:
        try:
            print(f'登录第{z}个账号')
            print('----------------------')
            print('\n开始签到操作>>>>>>>>>>\n')
            while True:
                if sign(ck):
                    break
                time.sleep(3)
            print('\n完成日常任务>>>>>>>>>>\n')
            while True:
                result = find_task_ids(Get_list(ck))
                if result:
                    this_week_id, this_month_id = result
                    print("本周充电任务:", Do_task(this_week_id,ck))
                    print("本月充电任务:", Do_task(this_month_id,ck))
                    break
                time.sleep(3)
            # this_week_id, this_month_id = find_task_ids(Get_list(ck))
            # print("本周充电任务:", Do_task(this_week_id,ck))
            # print("本月充电任务:", Do_task(this_month_id,ck))
            print('\n获取用户信息>>>>>>>>>>\n')
            while True:
                if Get_info(ck):
                    break
                time.sleep(3)
            print('\n----------------------')
            z = z + 1
        except Exception as e:
            print(e)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(e)
    try:
        send_notification_message(title='星星充电')  # 发送通知
    except Exception as e:
        print(e)
    
