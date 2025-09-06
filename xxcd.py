"""
星星充电签到
作者：https://github.com/lksky8/sign-ql
日期：2025-09-01

使用方法：打开app随便抓一个包，把头部'Authorization'内容填入 export startoken=""
另外可以再填入cityid(抓包获取), export starcityid=""可填可不填

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
    print(f'已填入cityid:{cityid}')
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
        timestamp = time13()
        signature = md5_encrypt(f'nonce=2b4aa7d9-4137-4e51-94e3-7b7355bf202a&timestamp={timestamp}&userId=')[0:18].upper()
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
            'timestamp': timestamp,
            'positCity': cityid,
            'Authorization': token,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept': 'application/json, text/plain, */*',
            'channel-id': '98',
            'Sec-Fetch-Mode': 'cors',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        data = {
            'nonce': '2b4aa7d9-4137-4e51-94e3-7b7355bf202a',
            'timestamp': timestamp,
            'userId': '',
        }
        response = requests.post('https://gateway.starcharge.com/apph5/webApiV2/starPoint/sign',headers=headers, data=data)
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
    except Exception as e:
        print("签到出错了:", e)


def Get_list(token):
    try:
        timestamp = time13()
        signature = md5_encrypt(f'city={cityid}&nonce=1b93f289-32ee-4616-a860-5aef04c6c048&timestamp={timestamp}&userId=')[0:18].upper()
        headers = {
            'Host': 'gateway.starcharge.com',
            'Accept': 'application/json, text/plain, */*',
            'memberAdType': '0-0',
            'Authorization': token,
            'timestamp': timestamp,
            'appVersion': '7.40.0',
            'channel-id': '98',
            'referrer': 'web',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'signature': signature,
            'positCity': cityid,
            'Origin': 'https://scm-app-h5.starcharge.com',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Referer': 'https://scm-app-h5.starcharge.com/',
        }
        response = requests.get(f'https://gateway.starcharge.com/apph5/webApiV2/userTask/model/list?city={cityid}&nonce=1b93f289-32ee-4616-a860-5aef04c6c048',headers=headers)
        response_json = response.json()
        if response_json['code'] == '200':
            return response_json['data']
        else:
            print("获取任务列表失败:", response.text)
            return False
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)
    except Exception as e:
        print("获取任务列表出错了:", e)


def Do_task(task_id,token):
    try:
        timestamp = time13()
        signature = md5_encrypt(f'nonce=4f63ecd8-e342-4e33-94a4-81bdfd040235&taskId={task_id}&taskType=1&timestamp={timestamp}&userId=')[0:18].upper()
        headers = {
            'Host': 'gateway.starcharge.com',
            'Accept': 'application/json, text/plain, */*',
            'memberAdType': '0-0',
            'Authorization': token,
            'timestamp': timestamp,
            'appVersion': '7.40.0',
            'channel-id': '98',
            'referrer': 'web',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'signature': signature,
            'positCity': cityid,
            'Origin': 'https://scm-app-h5.starcharge.com',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Referer': 'https://scm-app-h5.starcharge.com/',
        }
        response = requests.get(f'https://gateway.starcharge.com/apph5/webApiV2/userTask/get?taskId={task_id}&taskType=1&nonce=4f63ecd8-e342-4e33-94a4-81bdfd040235', headers=headers)
        response_json = response.json()
        if response_json['code'] == None:
            return response_json['text']
        elif response_json['code'] == '200' and response_json['text'] == None :
            return '任务已领取'
        else:
            print("做任务:", response.text)
            return False
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)


def Get_info(token):
    try:
        timestamp = time13()
        signature = md5_encrypt(f'city={cityid}&nonce=b7e92ec1-813f-4ec2-ab8a-e91289604733&timestamp={timestamp}&userId=')[0:18].upper()
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
            'timestamp': timestamp,
            'positCity': cityid,
            'Authorization': token,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept': 'application/json, text/plain, */*',
            'channel-id': '98',
            'Sec-Fetch-Mode': 'cors',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        response = requests.get(f'https://gateway.starcharge.com/apph5/v2/webApiV2/star/point/user?city={cityid}&nonce=b7e92ec1-813f-4ec2-ab8a-e91289604733', headers=headers)
        response_json = response.json()
        if response_json['code'] == '200':
            print(f'用户({response_json["data"]["nickName"]})目前金币：{response_json["data"]["points"]}')
            Log(f'用户({response_json["data"]["nickName"]})目前金币：{response_json["data"]["points"]}\n')
        else:
            print('用户数据查询失败:' + response.text)
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)
    except Exception as e:
        print("查询用户数据出错了:", e)

def Get_user_info(token):
    try:
        timestamp = time13()
        signature = md5_encrypt(f'cityCode={cityid}&nonce=b6efee74-2ad5-43b3-bf3f-2435613c7c9d&timestamp={timestamp}&userId=')[0:18].upper()
        headers = {
            'Host': 'gateway.starcharge.com',
            'Accept': 'application/json, text/plain, */*',
            'Authorization': token,
            'timestamp': timestamp,
            'Sec-Fetch-Site': 'same-site',
            'appVersion': '7.40.0',
            'channel-id': '98',
            'referrer': 'web',
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'signature': signature,
            'Sec-Fetch-Mode': 'cors',
            'Origin': 'https://scm-app-h5.starcharge.com',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Referer': 'https://scm-app-h5.starcharge.com/',
            'positCity': cityid,
            'Sec-Fetch-Dest': 'empty',
        }
        response = requests.get(f'https://gateway.starcharge.com/apph5/webApiV2/user/getUserBaseInfo?cityCode={cityid}&nonce=b6efee74-2ad5-43b3-bf3f-2435613c7c9d', headers=headers)
        response_data = response.json()
        if response_data['code'] == '200':
            if response_data['data']['appVipType'] == 1:
                print(f'用户({response_data["data"]["nickName"]})已开通VIP，到期日：{response_data["data"]["appVipExpiration"]}')
                vip_sign(token)
                check_vip_sign(token)
            else:
                print(f'用户({response_data["data"]["nickName"]}) 未开通VIP')
        else:
            print('查询是否VIP失败:' + response.text)
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)
    except Exception as e:
        print("查询是否VIP出错了:", e)


def vip_sign(token):
    try:
        timestamp = time13()
        signature = md5_encrypt('nonce=8f396424-3729-4f50-bf67-bfb8fe38b9c5&timestamp='+timestamp+'&userId=')[0:18].upper()
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
            'timestamp': timestamp,
            'positCity': '440600',
            'Authorization': token,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept': 'application/json, text/plain, */*',
            'channel-id': '98',
            'Sec-Fetch-Mode': 'cors',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
        data = {
            'nonce': '8f396424-3729-4f50-bf67-bfb8fe38b9c5',
            'timestamp': timestamp,
            'userId': '',
        }
        response = requests.post('https://gateway.starcharge.com/apph5/webApiV2/member/v5/home/sign',headers=headers, data=data).json()
        if response['code'] == '200':
            print(f"VIP任务：签到成功")
        else:
            print("VIP任务：签到失败" + response['text'])
    except requests.exceptions.RequestException as e:
        print("An error occurred:", e)
    except Exception as e:
        print("出错了:", e)

def check_vip_sign(token):
    try:
        timestamp = time13()
        signature = md5_encrypt(f'cycleType=1&nonce=2d3d2147-dbce-42b4-8fa9-9268b4fa580f&timestamp={timestamp}&userId=')[0:18].upper()
        headers = {
            'Host': 'gateway.starcharge.com',
            'memberAdType': '0-0',
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148',
            'Referer': 'https://app-taro.starcharge.com/',
            'appVersion': '7.40.0',
            'Origin': 'https://app-taro.starcharge.com',
            'signature': signature,
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Site': 'same-site',
            'referrer': 'web',
            'timestamp': timestamp,
            'positCity': '440600',
            'Authorization': token,
            'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
            'Accept': '*/*',
            'Content-Type': 'application/x-www-form-urlencoded',
            'channel-id': '98',
            'Sec-Fetch-Mode': 'cors',
        }
        response = requests.get(f'https://gateway.starcharge.com/apph5/webApiV2/member/v5/home/sign/records?cycleType=1&nonce=2d3d2147-dbce-42b4-8fa9-9268b4fa580f&timestamp={timestamp}&userId=',headers=headers).json()
        if response['code'] == '200':
            print(f"VIP任务：已连续签到{response['data']['continuousDays']}天")
        else:
            print("VIP任务查询失败" + response)
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
            this_week_id, this_month_id = find_task_ids(Get_list(ck))
            print("本周充电任务:", Do_task(this_week_id,ck))
            print("本月充电任务:", Do_task(this_month_id,ck))
            print('\n获取用户信息>>>>>>>>>>\n')
            Get_info(ck)
            Get_user_info(ck)
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
    
