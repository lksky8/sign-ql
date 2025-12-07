"""
方舟健客app签到
作者：https://github.com/lksky8/sign-ql
日期：2025-12-5

使用方法：APP抓登录包获取refresh_token填入jktoken

支持多用户运行,多用户用&或者@隔开

则变量为
export jktoken="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9........&eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9........"

每日签到一次即可
cron: 0 5 * * *
const $ = new Env("方舟健客签到");
"""
import time
import requests
import re
import os
import datetime
import hashlib

#推送开关，开启为True，关闭为False
push_message = True


def md5_encrypt(text):
    md5_hash = hashlib.md5()
    md5_hash.update(text.encode('utf-8'))
    md5_result = md5_hash.hexdigest()
    return md5_result

def time13():
    now = datetime.datetime.now()
    timestamp_ms = int(now.timestamp() * 1000) + (now.microsecond // 1000)
    return timestamp_ms


def get_jkx():
    a = time13() - 1500000000000
    j = a % 999983
    j2 = a % 9973
    h = "6470"
    md5_1 = md5_encrypt(f"39CC231D-C1F9-48DC-93DA-4CA0EA53C141{j}{h}")
    md5_2 = md5_encrypt(f"{md5_1}{j2}{h}")
    return f'{j}#{md5_2}#{j2}#{h}'


api_headers = {
    'Host': 'acgi.jianke.com',
    'Accept': 'application/json, text/plain, */*',
    'Sec-Fetch-Site': 'same-site',
    'Accept-Language': 'zh-CN,zh-Hans;q=0.9',
    'platform': 'APP',
    'Sec-Fetch-Mode': 'cors',
    'Origin': 'https://app-hybrid.jianke.com',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 jiankeMall/6.47.0 JiankeMall/6.47.0',
    'Referer': 'https://app-hybrid.jianke.com/',
    'Content-Type': 'application/json;charset=utf-8',
    'Sec-Fetch-Dest': 'empty',
}

api_headers2 = {
    'Host': 'fe-acgi.jianke.com',
    'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 jiankeMall/6.47.0',
    'versionName': '6.47.0',
    'X-JK-UDID': '39CC231D-C1F9-48DC-93DA-4CA0EA53C141',
    'versionCode': '6470',
    'X-JK-X': get_jkx(),
    'platform': 'APP',
    'Accept-Language': 'zh-Hans-CN;q=1',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
}

send_msg = ''
one_msg = ''

def Log(cont=''):
    global send_msg, one_msg
    if cont:
        one_msg += f'{cont}\n'
        send_msg += f'{cont}\n'



def send_notification_message(title):
    try:
        from notify import send
        print("加载通知服务成功！")
        send(title, send_msg)
    except Exception as e:
        if e:
            print('发送通知消息失败！')



def refresh_token(token):
    headers = {'Content-Type': 'application/json; charset=utf-8','User-Agent': 'Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.135 Mobile Safari/537.36 jiankeMall/6.26.0(w1080*h2029)','Host': 'acgi.jianke.com','organizationCode': 'app.jianke'}
    data = {'refreshToken': token }
    response = requests.post('https://acgi.jianke.com/passport/account/refreshToken', json=data, headers=headers)
    if '授权失败' in response.text:
        print('账号刷新token已失效，请重新获取')
        Log('账号刷新token已失效，请重新获取')
        return False
    else:
        response_json = response.json()
        if response_json['token_type'] == 'bearer':
            print("账号token刷新成功，新的access_token已填入:\n" + response_json['access_token'])
            return response_json['access_token']
        else:
            print("Failed to send POST request. Status Code:", response.status_code)
            print("出错了:", response.text)


def do_sign(new_token,user_name):
    # headers = api_headers2.copy()
    # headers['Authorization'] = f'bearer {new_token}'
    headers = {'Authorization':'bearer ' + new_token,'User-Agent': 'Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.135 Mobile Safari/537.36 jiankeMall/6.26.0(w1080*h2029)','X-JK-X': get_jkx(),'versionName': '6.47.0','X-JK-UDID': '39CC231D-C1F9-48DC-93DA-4CA0EA53C141'}
    dl = requests.put('https://acgi.jianke.com/v2/member/signConfig/sign', headers=headers)
    dl_json = dl.json()
    if dl.status_code == 200:
        print(f"[{user_name}] 本次签到获得：{dl_json['coinNum']}金币，今天是本周第{dl_json['cumulativeNum']}天签到")
        Log(f"\n{user_name}] 本次签到获得：{dl_json['coinNum']}金币，今天是本周第{dl_json['cumulativeNum']}天签到")
    elif dl_json['message'] == '今日已签到':
        print(f'[{user_name}] 今天已经签到了')
        Log(f'\n[{user_name}] 今天已经签到了')
    else:
        print("出错了:", dl.text)

def today_question(new_token,task_id,user_name):
    headers = api_headers.copy()
    headers['Authorization'] = f'bearer {new_token}'
    response = requests.get('https://acgi.jianke.com/support/coin/task/daily-tasks/today-question', headers=headers)
    response_json = response.json()
    if response_json['code'] == '0' and response_json['message'] == 'success':
        print(f'[{user_name}]【每日一答】 任务获取成功')
        question_id = response_json['data']['id']
        rightChoice = response_json['data']['rightChoice']
        json_data = {
            'id': str(task_id),
            'questionItem': {
                'id': question_id,
                'rightChoice': rightChoice,
                'userChoice': rightChoice,
                'roundNum': 1,
            },
        }
        response = requests.post('https://acgi.jianke.com/support/coin/task/complete', headers=headers, json=json_data)
        response_json = response.json()
        if response_json['code'] == '0' and response_json['message'] == 'success':
            print(f'[{user_name}]【每日一答】 任务完成')
            Log(f'[{user_name}]【每日一答】 任务完成')
        else:
            print(f'[{user_name}]【每日一答】 {response_json["message"]}')
            Log(f'[{user_name}]【每日一答】 {response_json["message"]}')
    else:
        print(f'[{user_name}]【每日一答】 任务获取失败')
        Log(f'[{user_name}]【每日一答】 任务获取失败')
        print(response.text)

def get_today_tasks(new_token, user_name):
    headers = api_headers.copy()
    headers['Authorization'] = f'bearer {new_token}'
    response = requests.get('https://acgi.jianke.com/support/coin/task/daily-tasks', headers=headers)
    if response.status_code == 200:
        response_json = response.json()
        task_list = []
        for item in response_json['data']:
            task_id = item['id']
            task_name = item['taskName']
            task_list.append({'task_id': task_id, 'task_name': task_name})
        return task_list
    else:
        print(f'{user_name} 获取任务数据失败')
        print(response.text)
        return None

def do_task(new_token,user_name, task_id, task_name):
    headers = api_headers.copy()
    headers['Authorization'] = f'bearer {new_token}'
    json_data = {
        'id': str(task_id)
    }
    response = requests.post('https://acgi.jianke.com/support/coin/task/complete', headers=headers, json=json_data)
    response_json = response.json()
    if response_json['code'] == '0' and response_json['message'] == 'success':
        print(f'[{user_name}]【{task_name}】 任务完成')
        Log(f'[{user_name}]【{task_name}】 任务完成')
    else:
        print(f'[{user_name}]【{task_name}】 {response_json["message"]}')
        Log(f'[{user_name}]【{task_name}】 {response_json["message"]}')

def task_receive(new_token, user_name, task_id,task_name):
    headers = api_headers.copy()
    headers['Authorization'] = f'bearer {new_token}'
    json_data = {
        'id': task_id,
    }
    response = requests.post('https://acgi.jianke.com/support/coin/task/receive', headers=headers, json=json_data)
    response_json = response.json()
    if response_json['code'] == '0' and response_json['message'] == 'success':
        print(f'[{user_name}]【{task_name}】 任务奖励：领取成功')
    elif response_json['message'] == '奖励领取失败':
        print(f'[{user_name}]【{task_name}】 任务奖励：领取失败')
        Log(f'[{user_name}]【{task_name}】 任务奖励：领取失败')
    else:
        print('奖励领取失败')
        print(response.text)

def get_coin(new_token, user_name):
    headers = api_headers.copy()
    headers['Authorization'] = f'bearer {new_token}'
    response = requests.get('https://acgi.jianke.com/v1/coin/balance', headers=headers)
    if response.status_code == 200:
        response_json = response.json()
        print(f'[{user_name}] 当前健康币：{response_json["balance"]}')
        Log(f'[{user_name}] 当前健康币：{response_json["balance"]}')
    else:
        print('获取金币数失败')
        print(response.text)

def get_userinfo(new_token):
    headers = api_headers2.copy()
    headers['Authorization'] = f'bearer {new_token}'
    response = requests.get('https://fe-acgi.jianke.com/v5/userCenter', headers=headers)
    response_json = response.json()
    if response_json['statusCode'] == 200:
        return response_json['data']['memberInfo']['nickName']
    else:
        print('获取用户信息失败')
        print(response.text)
        return None


if __name__ == '__main__':
    if 'jktoken' in os.environ:
        jktoken = re.split("@|&", os.environ.get("jktoken"))
        print(f'查找到{len(jktoken)}个账号')
    else:
        jktoken = []
        print('未填写 jktoken 变量')

    if jktoken:
        try:
            z = 1
            for ck in jktoken:
                print(f'登录第{z}个账号')
                print('----------------------\n')
                access_token = refresh_token(ck)
                if access_token:
                    user_nickname = get_userinfo(access_token)
                    print(f'[{user_nickname}] 刷新token成功')
                    print('\n开始签到操作>>>>>>>>>>\n')
                    do_sign(access_token, user_nickname)
                    print('\n开始执行任务>>>>>>>>>>\n')
                    task_data = get_today_tasks(access_token, user_nickname)
                    if task_data:
                        for task in task_data:
                            task_id = task['task_id']
                            task_name = task['task_name']
                            # print(f'[{user_nickname}] 开始执行任务：{task_name}')
                            if task_name == '每日一答':
                                today_question(access_token, task_id, user_nickname)
                                time.sleep(1)
                                task_receive(access_token, user_nickname, task_id, task_name)
                                time.sleep(2)
                                continue
                            if task_name == '下单返币':
                                continue
                            if task_name == '打开健客医生App':
                                continue
                            do_task(access_token, user_nickname, task_id, task_name)
                            time.sleep(1)
                            task_receive(access_token, user_nickname, task_id, task_name)
                            time.sleep(3)
                    get_coin(access_token, user_nickname)
                    print('\n----------------------')
                z = z + 1
        except Exception as e:
            print('未知错误:' + str(e))
    if push_message:
        try:
            send_notification_message(title='方舟健客')  # 发送通知
        except Exception as e:
            print('推送失败:' + str(e))
    