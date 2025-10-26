"""
捷停车签到

作者：https://github.com/lksky8/sign-ql
最后更新日期：2025-10-26
食用方法：打开捷停车app抓请求url=https://sytgate.jslife.com.cn/core-gateway/user/login/verify/token里面的deviceId和token(一般在请求参数里面)在环境变量输入export jtc_token=账号1#deviceId#token1&账号2#deviceId#token2
支持多用户运行
多用户用&或者@隔开
例如账号1：账号1#C5A59624-6666-4682-9876-F8184F3D2CF0#eyJhbGciOiJIUzI1NiJ9.... 账号2#C5A59624-5555-1234-9E41-F8184F3D2CF0#eyJhbGciOiJIUzI1NiJ9....
则变量为
export jtc_token="账号1#C5A59624-6666-4682-9876-F8184F3D2CF0#eyJhbGciOiJIUzI1NiJ9....&账号2#C5A59624-5555-1234-9E41-F8184F3D2CF0#eyJhbGciOiJIUzI1NiJ9...."

cron: 12 2 * * *
"""
import requests
import time
import hashlib
import os
import re
import uuid
import json
import random


def generate_nonce():
    """生成符合要求的UUID格式字符串"""
    return str(uuid.uuid4()).upper()


if 'jtc_token' in os.environ:
    jtc_token = re.split("@|&",os.environ.get("jtc_token"))
    print(f'查找到{len(jtc_token)}个账号\n')
else:
    jtc_token = []
    print('无jtc_token变量\n')


send_msg = ''
one_msg = ''

def Log(cont=''):
    global send_msg, one_msg
    if cont:
        one_msg += f'\n{cont}'
        send_msg += f'\n{cont}'



def send_notification_message(title):
    try:
        from notify import send
        print("加载通知服务成功！")
        send(title, send_msg)
    except Exception as e:
        if e:
            print('发送通知消息失败！')

api_headers = {
    'Host': 'sytgate.jslife.com.cn',
    'Content-Type': 'application/json;charset=utf-8',
    'applicationVersion': '60406',
    'Accept': '*/*',
    'User-Agent': 'JTC/6.4.6 (iPhone; iOS 15.8.3; Scale/3.00)',
    'Accept-Language': 'zh-Hans-CN;q=1',
}

longitude = f'113.07{random.randint(100, 999)}'
latitude = f'22.888624{random.randint(100, 999)}'

def md5_encrypt(text):
    return hashlib.md5(text.encode('utf-8')).hexdigest().upper()


def refresh_token(user_phone,user_deviceid,user_token):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()  # 生成nonce
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&deviceId={user_deviceid}&nonce={nonce}&osType=iOS&signType=MD5&timestamp={timestamp}&token={user_token}&Uvn76f3KgH9jlO9pCxZA12Swr5TeYQ8d')
    json_data = {
        'deviceId': user_deviceid,
        'osType': 'iOS',
        'signType': 'MD5',
        'applictionType': 'APP',
        'applictionVersion': '60406',
        'token': user_token,
        'timestamp': timestamp,
        'sign': sign,
        'nonce': nonce
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/core-gateway/user/login/verify/token',headers=api_headers,json=json_data)
        response_json = response.json()
        if response_json['resultCode'] == '0' and response_json['message'] == '成功':
            print(f'[{user_phone}] 刷新token成功')
            return {'new_token': response_json['obj']['token'], 'new_user_id': response_json['obj']['userId']}
        elif response_json['resultCode'] == '10011' and response_json['message'] == '用户已在其他平台登录':
            print(f'[{user_phone}] 刷新token失败：请重新获取token')
        elif response_json['resultCode'] == '3126' and response_json['message'] == 'token已过期':
            print(f'[{user_phone}] 刷新token失败：token已过期，请重新获取')
            return None
        else:
            print(f'[{user_phone}] 刷新token失败：{response_json}')
            return None
    except requests.exceptions.RequestException as e:
        print(f'刷新token发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'刷新token发生解析错误: {str(e)}')
    except Exception as e:
        print(f'刷新token发生未知错误: {str(e)}')

def get_coin(token,user_id,user_mobile):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()  # 生成nonce
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&nonce={nonce}&reqSource=APP_JTC&signType=MD5&timestamp={timestamp}&token={token}&userId={user_id}&Uvn76f3KgH9jlO9pCxZA12Swr5TeYQ8d')
    json_data = {
        'userId': user_id,
        'signType': 'MD5',
        'reqSource': 'APP_JTC',
        'applictionType': 'APP',
        'applictionVersion': '60406',
        'token': token,
        'timestamp': timestamp,
        'sign': sign,
        'nonce': nonce,
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/base-gateway/integral/v2/balance/query', headers=api_headers, json=json_data)
        response_json = response.json()
        if response_json['code'] == '0' and response_json['success']:
            print(f'[{user_mobile}] 积分：{response_json["data"]["accountAmt"]}，可抵扣：{response_json["data"]["deductAmount"]}元')
            Log(f'[{user_mobile}] 积分：{response_json["data"]["accountAmt"]}，可抵扣：{response_json["data"]["deductAmount"]}元')
        else:
            print(f'[{user_mobile}] 查询积分失败：{response_json["message"]}')
            Log(f'[{user_mobile}] 查询积分失败：{response_json["message"]}')
    except requests.exceptions.RequestException as e:
        print(f'查询用户积分发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'查询用户积分发生解析错误: {str(e)}')
    except Exception as e:
        print(f'查询用户积分发生未知错误: {str(e)}')

def get_userinfo(token,user_id):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()  # 生成nonce
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&nonce={nonce}&reqSource=APP_JTC&signType=MD5&timestamp={timestamp}&token={token}&userId={user_id}&Uvn76f3KgH9jlO9pCxZA12Swr5TeYQ8d')
    json_data = {
        'userId': user_id,
        'signType': 'MD5',
        'sign': sign,
        'charset': 'UTF-8',
        'reqSource': 'APP_JTC',
        'applictionType': 'APP',
        'version': 'V1.0',
        'token': token,
        'timestamp': timestamp,
        'applictionVersion': '60406',
        'nonce': nonce,
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/base-gateway/member/queryUserBenefitInfo',headers=api_headers, json=json_data)
        response_json = response.json()
        if response_json['code'] == '0' and response_json['success']:
            if response_json['data']['mobile'] is None:
                return None
            else:
                return response_json['data']['mobile']
        else:
            print(f'查询用户信息失败：{response_json["message"]}')
            return  None
    except requests.exceptions.RequestException as e:
        print(f'查询用户信息发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'查询用户信息发生解析错误: {str(e)}')
    except Exception as e:
        print(f'查询用户信息发生未知错误: {str(e)}')


def do_userinfo(user_id,user_mobile):
    timestamp = str(int(time.time() * 1000))
    json_data = {
        'userId': user_id,
        'openId': '',
        'gender': 'MALE',
        'birthday': '2000-01-01',
        'province': '广东省',
        'city': '广州市',
        'platformType': 'APP_JTC',
    }
    try:
        response = requests.post(f'https://sytgate.jslife.com.cn/core-gateway/user/update/extend-info?t={timestamp}',headers=api_headers, json=json_data)
        response_json = response.json()
        if response_json['resultCode'] == '0':
            print(f'[{user_mobile}] 更新用户信息成功：{user_id}')
            if response_json['obj']:
                print(f'[{user_mobile}] 个人信息已完善并获得30停车币')

    except requests.exceptions.RequestException as e:
        print(f'更新用户信息发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'更新用户信息发生解析错误: {str(e)}')
    except Exception as e:
        print(f'更新用户信息发生未知错误: {str(e)}')

def query_task(user_token, user_id, user_mobile):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&nonce={nonce}&reqSource=APP_JTC&signType=MD5&timestamp={timestamp}&token={user_token}&userId={user_id}&Uvn76f3KgH9jlO9pCxZA12Swr5TeYQ8d')
    json_data = {
        'osType': 'IOS',
        'signType': 'MD5',
        'userId': user_id,
        'nonce': nonce,
        'applictionType': 'APP',
        'reqVersion': 'V2.0',
        'applictionVersion': '60406',
        'token': user_token,
        'timestamp': timestamp,
        'sign': sign,
        'platformType': 'APP',
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/base-gateway/integral/v2/task/query',headers=api_headers, json=json_data)
        response_json = response.json()
        if response_json['code'] == '0' and response_json['success']:
            daily_tasks = [item for item in response_json['data'] if item["taskType"] == "每日任务"]
            task_list = daily_tasks[0]['taskList']
            all_tasks = []
            for task_item in task_list:
                task_id = task_item['taskNo']
                task_name = task_item['showTitle']
                all_tasks.append({
                    'task_id': task_id,
                    'task_name': task_name
                })
            print(f'[{user_mobile}] 查询任务成功: 已获取到 {len(task_list)} 个任务')
            return all_tasks
        else:
            print(f'查询任务失败：{response_json["message"]}')
            return None
    except requests.exceptions.RequestException as e:
        print(f'查询任务发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'查询任务发生解析错误: {str(e)}')
    except Exception as e:
        print(f'查询任务发生未知错误: {str(e)}')

def do_task(token,user_id,task_id,task_name,user_mobile):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&nonce={nonce}&osType=IOS&platformType=APP&receiveTag=false&reqSource=APP_JTC&signType=MD5&taskNo={task_id}&timestamp={timestamp}&token={token}&userId={user_id}&Uvn76f3KgH9jlO9pCxZA12Swr5TeYQ8d')
    json_data = {
        'nonce': nonce,
        'taskNo': task_id,
        'reqSource': 'APP_JTC',
        'receiveTag': 'false',
        'applictionVersion': '60406',
        'timestamp': timestamp,
        'osType': 'IOS',
        'userId': user_id,
        'applictionType': 'APP',
        'token': token,
        'platformType': 'APP',
        'signType': 'MD5',
        'sign': sign,
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/base-gateway/integral/v2/task/complete',headers=api_headers, json=json_data)
        response_json = response.json()
        if response_json['code'] == '0' and response_json['success']:
            print(f'[{user_mobile}]【{task_name}】 任务成功，获得 {response_json["data"]["integralValue"]} 停车币')
        elif response_json['code'] == '1' or response_json['code'] == 'INTER006':
            print(f'[{user_mobile}]【{task_name}】 任务失败: {response_json["message"]}')
        else:
            print(f'[{user_mobile}]【{task_name}】 任务未知错误')
            print(response_json)
    except requests.exceptions.RequestException as e:
        print(f'完成任务发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'完成任务发生解析错误: {str(e)}')
    except Exception as e:
        print(f'完成任务发生未知错误: {str(e)}')


def task_report(deviceId,user_id,token,user_mobile):
    timestamp = str(int(time.time() * 1000))
    event = '{"referrer":"PersonalCenterPage","pageEventName":"PointsTaskPage"}'
    nonce = generate_nonce()
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&dataSourceType=原生&deviceId={deviceId}&eventName=MoreTaskClick&eventProperty={event}&eventType=activity&latitude={latitude}&longitude={longitude}&netType=NET_WIFI&nonce={nonce}&opSystem=iOS&opSystemVersion=14.6&phoneModel=iPhone10,3&productName=捷停车APP&productVersion=6.4.6&screenResolution=375*812&serviceProviders=未知&signType=MD5&timestamp={timestamp}&token={token}&userId={user_id}&GaT92Kf6cbDc1Pea9S720GJnL56A14x3R')
    json_data = {
        'dataSourceType': '原生',
        'eventType': 'activity',
        'opSystem': 'iOS',
        'deviceId': deviceId,
        'opSystemVersion': '14.6',
        'phoneModel': 'iPhone10,3',
        'latitude': latitude,
        'eventName': 'MoreTaskClick',
        'netType': 'NET_WIFI',
        'signType': 'MD5',
        'nonce': nonce,
        'sign': sign,
        'token': token,
        'timestamp': timestamp,
        'eventProperty': {
            'referrer': 'PersonalCenterPage',
            'pageEventName': 'PointsTaskPage',
        },
        'longitude': longitude,
        'serviceProviders': '未知',
        'applictionVersion': '60406',
        'screenResolution': '375*812',
        'productName': '捷停车APP',
        'applictionType': 'APP',
        'productVersion': '6.4.6',
        'userId': user_id,
    }

    response = requests.post('https://sytgate.jslife.com.cn/data-report-gateway/syt-data-report/receive',headers=api_headers,json=json_data)
    if response.json()['resultCode'] == '0' and response.json()['success'] :
        print(f'[{user_mobile}] 任务数据上报成功')
    else:
        print(f'[{user_mobile}] 任务数据上报失败')

def task_report2(deviceId,user_id,user_token,task_name,user_mobile):
    nonce = generate_nonce()
    timestamp = str(int(time.time() * 1000))
    event = json.dumps({"referrer":"PersonalCenterPage","pageEventName":"PointsTaskPage","TaskName":task_name}, separators=(',', ':'))
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&dataSourceType=原生&deviceId={deviceId}&eventName=ShowGoToFinish&eventProperty={event}&eventType=activity&latitude={latitude}&longitude={longitude}&netType=NET_WIFI&nonce={nonce}&opSystem=iOS&opSystemVersion=14.6&phoneModel=iPhone10,3&productName=捷停车APP&productVersion=6.4.6&screenResolution=375*812&serviceProviders=未知&signType=MD5&timestamp={timestamp}&token={user_token}&userId={user_id}&GaT92Kf6cbDc1Pea9S720GJnL56A14x3R')

    json_data = {
        'dataSourceType': '原生',
        'eventType': 'activity',
        'opSystem': 'iOS',
        'deviceId': deviceId,
        'opSystemVersion': '14.6',
        'phoneModel': 'iPhone10,3',
        'latitude': latitude,
        'eventName': 'ShowGoToFinish',
        'netType': 'NET_WIFI',
        'signType': 'MD5',
        'nonce': nonce,
        'sign': sign,
        'token': user_token,
        'timestamp': timestamp,
        'eventProperty': {
            'referrer': 'PointsDetailPage',
            'pageEventName': 'PointsTaskPage',
            'TaskName': task_name,
        },
        'longitude': longitude,
        'serviceProviders': '未知',
        'applictionVersion': '60408',
        'screenResolution': '375*812',
        'productName': '捷停车APP',
        'applictionType': 'APP',
        'productVersion': '6.4.8',
        'userId': user_id,
    }
    response = requests.post('https://sytgate.jslife.com.cn/data-report-gateway/syt-data-report/receive',headers=api_headers,json=json_data)
    if response.json()['resultCode'] == '0' and response.json()['success'] :
        print(f'[{user_mobile}] 数据上报成功')
    else:
        print(f'[{user_mobile}] 数据上报失败')


def find_report(deviceId,user_id,token,user_mobile):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()
    event = json.dumps({"referrer":"PointsTaskPage","pageEventName":"FindPreferentialPage"}, separators=(',', ':'))
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&dataSourceType=原生&deviceId={deviceId}&eventName=ShowGoToClaim&eventProperty={event}&eventType=activity&latitude={latitude}&longitude={longitude}&netType=NET_WIFI&nonce={nonce}&opSystem=iOS&opSystemVersion=14.6&phoneModel=iPhone10,3&productName=捷停车APP&productVersion=6.4.6&screenResolution=375*812&serviceProviders=未知&signType=MD5&timestamp={timestamp}&token={token}&userId={user_id}&GaT92Kf6cbDc1Pea9S720GJnL56A14x3R')
    json_data = {
        'dataSourceType': '原生',
        'eventType': 'activity',
        'opSystem': 'iOS',
        'deviceId': deviceId,
        'opSystemVersion': '14.6',
        'phoneModel': 'iPhone10,3',
        'latitude': latitude,
        'eventName': 'ShowGoToClaim',
        'netType': 'NET_WIFI',
        'signType': 'MD5',
        'nonce': nonce,
        'sign': sign,
        'token': token,
        'timestamp': timestamp,
        'eventProperty': {
            'referrer': 'PointsTaskPage',
            'pageEventName': 'FindPreferentialPage',
        },
        'longitude': longitude,
        'serviceProviders': '未知',
        'applictionVersion': '60406',
        'screenResolution': '375*812',
        'productName': '捷停车APP',
        'applictionType': 'APP',
        'productVersion': '6.4.6',
        'userId': user_id,
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/data-report-gateway/syt-data-report/receive',headers=api_headers,json=json_data)
        if response.json()['resultCode'] == '0' and response.json()['success'] :
            print(f'[{user_mobile}]【去找优惠】任务数据上报成功')
        else:
            print(f'{[user_mobile]}【去找优惠】任务数据上报失败')
    except requests.exceptions.RequestException as e:
        print(f'【去找优惠】任务数据上报发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'【去找优惠】任务数据上报发生解析错误: {str(e)}')
    except Exception as e:
        print(f'【去找优惠】任务数据上报发生未知错误: {str(e)}')



def query_day_sign(token, userid,user_mobile):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&nonce={nonce}&signType=MD5&timestamp={timestamp}&token={token}&userId={userid}&Uvn76f3KgH9jlO9pCxZA12Swr5TeYQ8d')
    json_data = {
        'userId': userid,
        'signType': 'MD5',
        'applictionType': 'APP',
        'applictionVersion': '60406',
        'token': token,
        'timestamp': timestamp,
        'sign': sign,
        'nonce': nonce,
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/base-gateway/integral/v2/sign-in-task/query', headers=api_headers,json=json_data)
        response_json = response.json()
        if response_json['code'] == '0' and response_json['success']:
            # print(f'[{user_mobile}] 每日签到查询成功')
            if not response_json['data']['todaySingInTag']:
                print(f'[{user_mobile}] 每日签到未完成')
                task_receive(token,userid,response_json['data']['taskNo'],'每日签到',user_mobile)
            else:
                print(f'[{user_mobile}] 每日签到已完成')
                Log(f'[{user_mobile}] 每日签到已完成')
        else:
            print(f'[{user_mobile}] 每日签到查询失败：{response_json["message"]}')
    except requests.exceptions.RequestException as e:
        print(f'查询每日签到发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'查询每日签到发生解析错误: {str(e)}')
    except Exception as e:
        print(f'查询每日签到发生未知错误: {str(e)}')

def task_receive(token,userid,task_id,task_name,user_mobile):
    timestamp = str(int(time.time() * 1000))
    nonce = generate_nonce()
    sign = md5_encrypt(f'applictionType=APP&applictionVersion=60406&nonce={nonce}&osType=IOS&platformType=APP&reqSource=APP_JTC&signType=MD5&taskNo={task_id}&timestamp={timestamp}&token={token}&userId={userid}&Uvn76f3KgH9jlO9pCxZA12Swr5TeYQ8d')
    json_data = {
        'nonce': nonce,
        'taskNo': task_id,
        'reqSource': 'APP_JTC',
        'applictionVersion': '60406',
        'timestamp': timestamp,
        'osType': 'IOS',
        'userId': userid,
        'applictionType': 'APP',
        'token': token,
        'platformType': 'APP',
        'signType': 'MD5',
        'sign': sign,
    }
    try:
        response = requests.post('https://sytgate.jslife.com.cn/base-gateway/integral/v2/task/receive', headers=api_headers, json=json_data)
        response_json = response.json()
        if response_json['code'] == '0' and response_json['success']:
            print(f'[{user_mobile}]【{task_name}】 获得 {response_json["data"]} 停车币')
            Log(f'[{user_mobile}]【{task_name}】 获得 {response_json["data"]} 停车币')
        else:
            print(f'[{user_mobile}]【{task_name}】 领取任务奖励失败：{response_json["message"]}')
    except requests.exceptions.RequestException as e:
        print(f'领取任务奖励发生网络错误: {str(e)}')
    except (ValueError, KeyError, TypeError) as e:
        print(f'领取任务奖励发生解析错误: {str(e)}')
    except Exception as e:
        print(f'领取任务奖励发生未知错误: {str(e)}')



if __name__ == '__main__':
    try:
        if jtc_token:
            z = 1
            for item in jtc_token:
                print('-' * 50)
                print(f'登录第{z}个账号>>>>>>')
                phone = item.split('#')[0]
                device_id = item.split('#')[1]
                token = item.split('#')[2]
                user_data = refresh_token(phone, device_id, token)
                if user_data:
                    new_userid = user_data['new_user_id']
                    new_token = user_data['new_token']
                    query_day_sign(new_token, new_userid, phone)
                    print('-' * 50)
                    task_report(device_id, new_userid, new_token, phone)
                    tasks = query_task(new_token, new_userid, phone)
                    if tasks:
                        for task in tasks:
                            task_report2(device_id, new_userid, new_token, task['task_name'], phone)
                            if task['task_name'] == '看视频':
                                print(f'[{phone}]【看视频】跳过任务')
                                # 破解不了直接跳过
                                continue
                            if task['task_name'] == '去找优惠':
                                find_report(device_id, new_userid, new_token, phone)
                                time.sleep(5)
                            do_task(new_token, new_userid, task['task_id'], task['task_name'], phone)
                            time.sleep(3)
                            task_receive(new_token, new_userid, task['task_id'], task['task_name'], phone)
                            time.sleep(2)
                    # do_userinfo(userid, user_phone)
                    print('-' * 50)
                    get_coin(new_token, new_userid, phone)
                    print('*' * 50)
                    Log('\n')
                else:
                    print(f'第{z}个账号用户信息获取失败')
                    Log(f'第{z}个账号用户信息获取失败')
                z += 1
        else:
            print('请先填入jtc_token变量')
            Log('请先填入jtc_token变量')
    except Exception as e:
        print(f'发生错误: {str(e)}')
    try:
        send_notification_message(title='捷停车')  # 发送通知
    except Exception as e:
        print('推送失败:' + str(e))
