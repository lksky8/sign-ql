"""
方舟健客app签到
作者：https://github.com/lksky8/sign-ql
日期：2025-7-15

使用方法：APP抓登录包获取refresh_token填入jktoken

支持多用户运行,多用户用&或者@隔开

则变量为
export jktoken="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9........&eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9........"

每日签到一次即可
cron: 0 5 * * *
const $ = new Env("方舟健客签到");
"""
import requests
import re
import os
import datetime
import hashlib
import json


if 'jktoken' in os.environ:
    jktoken = re.split("@|&",os.environ.get("jktoken"))
    print(f'查找到{len(jktoken)}个账号')
else:
    jktoken =['']
    print('无jktoken变量')


def md5_encrypt(text):
    md5_hash = hashlib.md5()
    md5_hash.update(text.encode('utf-8'))
    md5_result = md5_hash.hexdigest()
    return md5_result


def time13():
    now = datetime.datetime.now()
    timestamp_ms = int(now.timestamp() * 1000) + (now.microsecond // 1000)
    return timestamp_ms


def b():
    a = time13() - 1500000000000
    j = a % 999983
    j2 = a % 9973
    h = "6260"
    return str(j) + "#" + md5_encrypt(
        md5_encrypt("19874ee7-ea2c-4043-a24a-16a14816399c" + str(j) + "6260") + str(j2) + "6260") + "#" + str(
        j2) + "#" + "6260"


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


def JK_sign(new_token):
    headers = {'Authorization':'bearer ' + new_token,'User-Agent': 'Mozilla/5.0 (Linux; Android 10; MI 8 Build/QKQ1.190828.002; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/131.0.6778.135 Mobile Safari/537.36 jiankeMall/6.26.0(w1080*h2029)','X-JK-X': b(),'versionName': '6.26.0','X-JK-UDID': '19874ee7-ea2c-4043-a24a-16a14816399c'}
    dl = requests.put(url='https://acgi.jianke.com/v2/member/signConfig/sign',headers=headers)
    dl_json = dl.json()
    if dl.status_code == 200:
        print(f"本次签到获得：{dl_json['coinNum']}金币，今天是本周第{dl_json['cumulativeNum']}天签到")
        Log(f"\n本次签到获得：{dl_json['coinNum']}金币，今天是本周第{dl_json['cumulativeNum']}天签到")
    elif dl_json['message'] == '今日已签到':
        print('今天已经签到了')
        Log('\n今天已经签到了')
    else:
        print("出错了:", dl.text)



def main():
    z = 1
    for ck in jktoken:
        try:
            print(f'登录第{z}个账号')
            print('----------------------\n')
            access_token = refresh_token(ck)
            if access_token:
                print('刷新token成功')
                print('\n开始签到操作>>>>>>>>>>\n')
                JK_sign(access_token)
                print('\n----------------------')
            z = z + 1
        except Exception as e:
            print('未知错误:' + str(e))

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print('未知错误:' + str(e))
    try:
        send_notification_message(title='方舟健客')  # 发送通知
    except Exception as e:
        print('推送失败:' + str(e))
    