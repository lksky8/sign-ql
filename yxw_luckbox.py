'''
作者：https://github.com/lksky8/sign-ql/
日期：2025-8-20
软件：游侠网-开宝箱
功能：每隔三小时自动开宝箱领取50金币
定时：0,5 */3 * * *
'''

import json
import requests
import time

send_msg = ''
one_msg = ''

def log(cont=''):
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


def get_user_ids_and_tokens(file_path='youxia_data.json'):
    try:
        # 1. 读取JSON文件
        with open(file_path, 'r', encoding='utf-8') as f:
            phone_data = json.load(f)

        # 2. 遍历每个手机号
        results = []
        for phone_key, data in phone_data.items():
            user_name = data.get('nickname')
            user_token = data.get('token')
            api3AliSSO_cookie = data.get('api3AliSSO')

            if user_name and user_token:  # 确保userId和token存在
                results.append({
                    'phone_key': phone_key,
                    'user_name': user_name,
                    'api3AliSSO': api3AliSSO_cookie
                })
                # print(f"手机号: {phone_key}, userId: {user_id}, token: {token}")

        return results

    except FileNotFoundError:
        print(f"文件 {file_path} 不存在！")
        return []
    except json.JSONDecodeError:
        print(f"文件 {file_path} 格式错误！")
        return []


def do_sign(phone, user_name, ck):
    headers = {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ali213app"
    }
    cookies = {
        "api3AliSSO": ck
    }
    try:
        response = requests.get("https://api3.ali213.net/feedearn/luckybox?action=get", headers=headers,cookies=cookies)
        response.raise_for_status()
        response_json = response.json()
        if response_json['logined']:
            print(f"账号 [{phone}][{user_name}] 登录成功，CK有效")
            print(f"账号 [{phone}][{user_name}] {response_json['data']['msg']}")
            if response_json['data']['status'] == 1 and response_json['data']['msg'] == '领取成功':
                print(f"账号 [{phone}][{user_name}] 获得{response_json['data']['coins']}金币")
        else:
            print(f"账号 [{phone}][{user_name}] 登录失败，CK无效")
            log(f"账号 [{phone}][{user_name}] 登录失败，CK无效")
    except requests.exceptions.RequestException as e:
        print(f"请求失败: {e}")
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
    except Exception as e:
        print(f"其他错误: {e}")


if __name__ == '__main__':
    user_data = get_user_ids_and_tokens()
    if not user_data:
        print("未读取到用户数据，程序退出")
        exit(0)
    else:
        print(f"读取到{len(user_data)}个账号")

    for item in user_data:
        phone = item['phone_key']
        user_name = item['user_name']
        ck = item['api3AliSSO']
        do_sign(phone, user_name, ck)
        time.sleep(1)
        print("-" * 50)

    try:
        send_notification_message(title='游侠网开宝箱')  # 发送通知
    except Exception as e:
        print('推送失败:' + str(e))