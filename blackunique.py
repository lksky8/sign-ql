"""
全球购骑士特权
功能：签到赚钱、完成任务赚钱、兑换现金
作者：https://github.com/lksky8/sign-ql
最后更新日期：2026-3-28
食用方法：抓包url https://market.chuxingyouhui.com/xxxxx 请求头token eyJhbGciOiJIUzUxMiJ9.
支持多用户运行
多用户用&或者@隔开
变量格式：
export blackToken="eyJhbGciOiJIUzUxMiJ9....@blackToken=eyJhbGciOiJIUzUxMiJ9...."
每个小时运行一次
cron: 0 * * * *
"""

import time
import requests
import os
import re
from urllib.parse import quote

api_headers = {
    'User-Agent': 'ZZCIOS/black/2.42.0/iPhone X (CDMA) (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MUID/3M4R7AE3su3HkHp46hkRjaW4K4AeMP254zf97zyW2AWZnDZ9cPY+1fWbSlJ21cIz',
    'Accept': 'application/json, text/plain, */*',
    'Accept-Language': 'zh-cn',
    'token': '',
    'Content-Type': 'application/json;charset=utf-8',
    'Origin': 'https://m.black-unique.com',
    'Referer': 'https://m.black-unique.com/',
}

def feel_app_geetest3(gt, challenge):
    """获取 geetest3 验证码"""
    headers = {
        'Content-Type': 'application/json',
    }

    json_data = {
        'gt': gt,
        'challenge': challenge,
    }

    response = requests.post('http://192.168.2.117:4399/api/captcha/feel_app_geetest3', headers=headers, json=json_data)
    response_json = response.json()
    if response_json['result']:
        print('验证成功')
        return response_json['validate']
    else:
        print(f'验证失败：{response_json["msg"]}')
        return None

def url_encode(data):
    return quote(data, safe='')

def gen_unique(token):
    headers = api_headers.copy()
    headers['token'] = token
    try:
        response = requests.post('https://market.chuxingyouhui.com/promo-bargain-api/activity/risk/api/v1_0/register', headers=headers, json={'clientType': 2})
        response_json = response.json()
        if response_json['code'] == 200:
            unique = response_json['data']['unique']
            challenge = response_json['data']['challenge']
            validate = feel_app_geetest3(response_json['data']['gt'], challenge)
            if validate:
                json_data = {
                    'appId': '1194494896220667904',
                    'unique': unique,
                    'challenge': challenge,
                    'seccode': f'{validate}|jordan',
                    'validate': validate,
                }
                requests.post('https://market.chuxingyouhui.com/promo-bargain-api/activity/risk/api/v1_0/validate', headers=headers, json=json_data)
                return unique
            else:
                return None
        else:
            return None
    except Exception as e:
        print(f'生成解决风控uuid失败：{e}')
        return None

def check_day_sign(token):
    headers = api_headers.copy()
    headers['token'] = token
    try:
        response = requests.get('https://market.chuxingyouhui.com/promo-bargain-api/activity/weekSign/api/v1_0/calendar?appId=1194494896220667904', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['data']['signStatus'] == 1:
            print('签到赚钱：已签到')
            return True
        else:
            print('签到赚钱：未签到')
            return False
    except Exception as e:
        print(f'签到失败：{e}')
        return False

def day_sign(token):
    headers = api_headers.copy()
    headers['token'] = token
    requests.get('https://market.chuxingyouhui.com/promo-bargain-api/activity/mqq/api/eventTracking', headers=headers)
    try:
        risk_uuid = gen_unique(token)
        if risk_uuid:
            headers['risk-uuid'] = risk_uuid
            reqBody = '{}'
            headers['request-body'] = url_encode(reqBody)
            response = requests.post('https://market.chuxingyouhui.com/promo-bargain-api/activity/weekSign/api/v1_0/sign?appId=1194494896220667904', headers=headers, data=reqBody)
            response_json = response.json()
            if response_json['code'] == 200:
                print(f'签到成功：获得 {response_json["data"]["reward"]} 勋章')
            else:
                print(f'签到失败：{response_json["msg"]}')
        else:
            print('风控未通过')
    except Exception as e:
        print(f'签到出现错误：{e}')

def list_user_task(token):
    headers = api_headers.copy()
    headers['token'] = token
    reqBody = '{"activityType": 13}'
    headers['request-body'] = url_encode(reqBody)
    try:
        response = requests.post('https://market.chuxingyouhui.com/promo-bargain-api/activity/task/api/list_user_task', headers=headers, data=reqBody)
        response_json = response.json()
        if response_json['code'] == 200:
            task_list = []
            for task in response_json['data']:
                if task['taskTitle'] == '购买商品':
                    continue
                if task['totalTimes'] == task['finishedTimes']:
                    continue
                task_list.append({
                    'userTaskId': task['userTaskId'],
                    'taskId': task['taskId'],
                    'taskType': task['taskType'],
                    'taskTitle': task['taskTitle'],
                    'taskReward': task['rewardScore'],
                    'totalTimes': task['totalTimes'],
                    'finishedTimes': task['finishedTimes'],
                })
                print(f'任务 [{task["taskTitle"]}]，完成 {task["finishedTimes"]} / {task["totalTimes"]} 次，奖励 {int(task["rewardScore"])} 勋章')
            return task_list
        else:
            print(f'获取任务列表失败：{response_json["msg"]}')
            return None
    except Exception as e:
        print(f'获取任务列表出现错误：{e}')
        return None

def doTask(token, task):
    headers = api_headers.copy()
    headers['token'] = token
    reqBody = '{"activityType":13,"taskType":"taskType_str","userTaskId":"userTaskId_str"}'.replace('taskType_str', task['taskType']).replace('userTaskId_str', task['userTaskId'])
    headers['request-body'] = url_encode(reqBody)
    try:
        response = requests.post('https://market.chuxingyouhui.com/promo-bargain-api/activity/task/api/doTask', headers=headers, data=reqBody)
        response_json = response.json()
        if response_json['code'] == 200:
            print(f'任务 [{response_json["data"]["taskTitle"]}] 完成，奖励 {int(response_json["data"]["rewardScore"])} 勋章')
        else:
            print(f'任务 [{response_json["data"]["taskTitle"]}] 完成失败：{response_json["msg"]}')
    except Exception as e:
        print(f'任务 [{task["taskTitle"]}] 完成出现错误：{e}')

def check_info(token):
    headers = api_headers.copy()
    headers['token'] = token
    try:
        response = requests.get( 'https://market.chuxingyouhui.com/promo-bargain-api/activity/mqq/api/indexTopInfo?appId=1194494896220667904', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200:
            score = int(response_json["data"]["score"])
            print(f'【勋章余额】：{score} ≈ {float(score / 10000)} 元')
        else:
            print(f'获取勋章余额失败：{response_json["msg"]}')
    except Exception as e:
        print(f'获取勋章余额出现错误：{e}')


if __name__ == '__main__':
    try:
        if 'blackToken' in os.environ:
            blackToken = re.split("@|&", os.environ.get("blackToken"))
            print(f'查找到{len(blackToken)}个账号\n')
        else:
            blackToken = None
            print('无blackToken变量')

        if blackToken:
            z = 1
            for Token in blackToken:
                print(f'登录第{z}个账号')
                print('-' * 50)
                isSign = check_day_sign(Token)
                if not isSign:
                    print('由于签到接口有极验验证，涉及到利益问题不提供过验证功能，会解决的同学可以自己实现')
                    # day_sign(Token)
                print('\n')
                all_task_list = list_user_task(Token)
                if all_task_list:
                    for all_task in all_task_list:
                        if all_task['taskTitle'] == '看视频':
                            continue
                        doTask(Token, all_task)
                        time.sleep(3)
                print('\n')
                check_info(Token)
                z += 1
                print('\n')
    except Exception as e:
        print(e)
