"""
PP停车签到

作者：https://github.com/lksky8/sign-ql
最后更新日期：2025-9-22
食用方法：变量输入export pp_token=账号1#token1&账号2#token2
支持多用户运行
多用户用&或者@隔开
例如账号1：13800000000#eyJhbGciOiJIUzI1NiJ9.eyj 账号2： 139000000000#eyJhbGciOiJIUzI1NiJ9.eyj
则变量为
export pp_token="13800000000#eyJhbGciOiJIUzI1NiJ9.eyj&13900000000#eyJhbGciOiJIUzI1NiJ9.eyj"
每天运行两次否则token会过期

cron: 0 40 0,12 * * *
"""
import requests
import base64
from urllib.parse import quote
import json
import hashlib
import time
import os
import re

KEY_ENCRYPT = "2363ECDFC54A5AF12477D3D45333A19F"  # key1 用于加密
KEY_DECRYPT = "466d67cf8f9810707404fae5ed172b8e"  # key2 用于解密
WX_ENCRYPT = "riegh^ee:w0fok5je5eeS{eecaes1nep"

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
    'Host': 'api.660pp.com',
    'accept': '*/*',
    'content-type': 'application/x-www-form-urlencoded',
    'rest_api_type': '1',
    'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Parking/4.3.2 (iOS 16.6.1; iPhone15,2; Build/1312) NetType/WIFI',
    'accept-language': 'zh_CN',
}



wx_headers = {
    'Host': 'user-api.4pyun.com',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541022) XWEB/16467',
    'xweb_xhr': '1',
    'content-type': 'application/x-www-form-urlencoded',
    'accept': '*/*',
    'sec-fetch-site': 'cross-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': 'https://servicewechat.com/wxa204074068ad40ef/879/page-frame.html',
    'accept-language': 'zh-CN,zh;q=0.9',
    'priority': 'u=1, i',
}

def transform(bytes_data: bytearray, key: str) -> bytearray:
    len_key = len(key)
    len_b = len(bytes_data)
    for i in range(len_b):
        index = (len_b - i) % len_key
        key_byte = ord(key[index])
        in_byte = bytes_data[i]
        flipped = in_byte ^ 0xFF
        bytes_data[i] = key_byte ^ flipped
    return bytes_data

def encrypt(arg: str, key: str) -> str:
    """加密，对应提供的 encrypt 方法"""
    bytes_data = bytearray(arg.encode('utf-8'))
    transformed = transform(bytes_data, key)
    return base64.b64encode(transformed).decode('utf-8')

def decrypt(arg: str) -> str:
    """解密，对应提供的 decrypt 方法"""
    bytes_data = bytearray(base64.b64decode(arg))
    transformed = transform(bytes_data, KEY_DECRYPT)
    return transformed.decode('utf-8')

def save_or_update_phone_data(phone_key, new_data, file_path='PPark_data.json'):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}

    if phone_key in existing_data:
        existing_data[phone_key].update(new_data)  # 合并新旧数据
        print(f"[{phone_key}] 数据已更新！")
    else:
        existing_data[phone_key] = new_data  # 新增数据
        print(f"[{phone_key}] 新增数据！")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=4)

def get_user_ids_and_tokens(file_path='PPark_data.json'):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            phone_data = json.load(f)
        results = []
        for phone_key, data in phone_data.items():
            token = data.get('refresh_token')
            if token:
                results.append({
                    'phone_key': phone_key,
                    'refresh_token': token,
                    'user_name': data.get('user_name'),
                    'user_id': data.get('user_id')
                })
        return results
    except FileNotFoundError:
        print(f"文件 {file_path} 不存在！")
        return []
    except json.JSONDecodeError:
        print(f"文件 {file_path} 格式错误！")
        return []

def get_userdata(u):
    user_phone = u.split('#')[0]
    user_token = u.split('#')[1]

    try:
        with open('PPark_data.json', 'r', encoding='utf-8') as f:
            cache_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        cache_data = {}

    if user_phone not in cache_data:
        print(f'[{user_phone}] 不存在于缓存中，尝试初始化数据')
        init_refresh_token(user_phone,user_token)
    else:
        print(f'[{user_phone}] 已存在于缓存中，直接读取数据')
        refresh_token(user_phone,user_token,cache_data[user_phone]['refresh_token'])
        old_user_token = cache_data[user_phone]['init_token']
        if old_user_token != user_token:
            print(f'[{user_phone}] token已更新，尝试刷新')
            init_refresh_token(user_phone,user_token)
        

def md5_encrypt(s: str):
    return hashlib.md5(s.encode('utf-8')).hexdigest()


def get_user_info(phone: str, token: str):
    headers = wx_headers.copy()
    headers['authorization'] = f'Bearer {token}'
    try:
        response = requests.get('https://user-api.4pyun.com/rest/2.0/user/whoami',headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == '1001':
            print(f"[{response_json['payload']['nickname']}] 获取用户信息：成功")
            return response_json['payload']['nickname'], response_json['payload']['identity']
        else:
            print(f"[{phone}] 获取用户信息：失败：{response_json}")
            return None
    except requests.RequestException as e:
        print(f"[{phone}] 获取用户信息_请求异常：{e}")
    except json.JSONDecodeError:
        print(f"[{phone}] 获取用户信息_响应不是有效的JSON格式")
    except Exception as e:
        print(f"[{phone}] 获取用户信息_其他异常：{e}")

def refresh_token(mobile: str, i_token: str, r_token: str):
    headers = api_headers.copy()
    headers['rest_api_token'] = r_token
    try:
        response = requests.put('https://api.660pp.com/rest/1.6/user/token', headers=headers)
        response_json = response.json()
        # print(response_json)
        if response_json['code'] == '1001':
            result = json.loads(decrypt(response_json['result']))
            print(f"[{mobile}] 刷新token成功")
            save_or_update_phone_data(mobile,{'init_token': i_token,'refresh_token': result['token']})
        elif response_json['code'] == '401':
            print(f"[{mobile}] 刷新token失败：token已失效")
            Log(f"[{mobile}] 刷新token失败：token已失效")
        else:
            print(f"[{mobile}] 刷新token失败：{response_json}")
    except requests.RequestException as e:
        print(f"[{mobile}] 刷新token_请求异常：{e}")
    except json.JSONDecodeError:
        print(f"[{mobile}] 刷新token_响应不是有效的JSON格式")
    except Exception as e:
        print(f"[{mobile}] 刷新token_其他异常：{e}")


def init_refresh_token(mobile: str, token: str):
    headers = api_headers.copy()
    headers['rest_api_token'] = token
    try:
        response = requests.put('https://api.660pp.com/rest/1.6/user/token', headers=headers)
        response_json = response.json()
        # print(response_json)
        if response_json['code'] == '1001':
            result = json.loads(decrypt(response_json['result']))
            user_name, user_id = get_user_info(mobile, token)
            save_or_update_phone_data(mobile,{'user_name': user_name, 'user_id': user_id, 'init_token': token, 'refresh_token': result['token']})
            print(f"[{mobile}] 刷新token成功")
        elif response_json['code'] == '401':
            print(f"[{mobile}] 刷新token失败：token已失效")
            Log(f"[{mobile}] 刷新token失败：token已失效")
        else:
            print(f"[{mobile}] 刷新token失败：{response_json}")
    except requests.RequestException as e:
        print(f"[{mobile}] 刷新token_请求异常：{e}")
    except json.JSONDecodeError:
        print(f"[{mobile}] 刷新token_响应不是有效的JSON格式")
    except Exception as e:
        print(f"[{mobile}] 刷新token_其他异常：{e}")

def day_sign(nickname: str, token: str):
    headers = api_headers.copy()
    headers['rest_api_token'] = token
    try:
        response = requests.get('https://api.660pp.com/rest/1.6/reward/bonus?yc7OyqO6qQ%3D%3D=rL7JhL/NrriG2tPZ2aegog%3D%3D', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == '1001':
            result = json.loads(decrypt(response_json['result']))
            message = result['message'].replace('\r\n', '')
            if '签到获得' in result['message'] or '已连续签到'in result['message']:
                print(f"[{nickname}] 签到成功：{message} 已累计获得：{result['combo']} 积分")
                Log(f"[{nickname}] 签到成功：{message} 已累计获得：{result['combo']} 积分")
            elif message == '您已签到成功' :
                print(f"[{nickname}] 签到失败：已签到")
                Log(f"[{nickname}] 已签到")
            else:
                print(f"[{nickname}] 签到失败：{message}")
                Log(f"[{nickname}] 签到失败：{message}")
        else:
            print(f"[{nickname}] 获取签到数据失败：{response_json}")
    except requests.RequestException as e:
        print(f"[{nickname}] 签到_请求异常：{e}")
    except json.JSONDecodeError:
        print(f"[{nickname}] 签到_响应不是有效的JSON格式")
    except Exception as e:
        print(f"[{nickname}] 签到_其他异常：{e}")

def get_task(nickname: str, token: str):
    headers = wx_headers.copy()
    headers['authorization'] = f'Bearer {token}'
    try:
        response = requests.get('https://user-api.4pyun.com/rest/2.0/bonus/reward/task/list?%2B9Hnx%2FPy=7bL7p%2FqgoK77uPOi%2B8WjqP%2Fw', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == '1001':
            video_task = [task for task in response_json['payload']['row'] if task['name'] == '看视频得积分'][0]
            referer_url = video_task['referer_url']
            print(f'[{nickname}] 获取视频任务数据成功')
            return referer_url.split('&voucher=')[1]
        else:
            print(f"[{nickname}] 获取任务_失败：{response_json}")
            Log(f"[{nickname}] 获取视频任务数据失败：{response_json}")
            return None
    except requests.RequestException as e:
        print(f"[{nickname}] 获取任务_请求异常：{e}")
    except json.JSONDecodeError:
        print(f"[{nickname}] 获取任务_响应不是有效的JSON格式")
    except Exception as e:
        print(f"[{nickname}] 获取任务_其他异常：{e}")

def complete_task(nickname: str, token: str, task_id: str):
    headers = wx_headers.copy()
    headers['authorization'] = f'Bearer {token}'
    headers['content-type'] = 'application/json;charset=utf-8'
    try:
        data = '{"app_id":"wxa204074068ad40ef","purpose":"reward:motivate:advertising","voucher":"voucher_data"}'.replace('voucher_data', task_id)
        encrypt_data = encrypt(data,WX_ENCRYPT)
        response = requests.post('https://user-api.4pyun.com/rest/2.0/bonus/reward/task/complete', headers=headers, data=encrypt_data)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == '1001':
            print(f"[{nickname}] 看视频：任务完成")
            headers['content-type'] = 'application/x-www-form-urlencoded'
            response = requests.get('https://user-api.4pyun.com/rest/2.0/bonus/reward/acquire?%2B9Hnx%2FPy=7bL7p%2FqgoK77uPOi%2B8WjqP%2Fw&6u%2FT5%2Ffp8w%3D%3D=%2Fv%2Fp%2Fej%2BvsH17qPs9L7xqvir%2FqDo7sjk8fTx', headers=headers)
            response.raise_for_status()
            response_json = response.json()
            if response_json['code'] == '1001':
                print(f"[{nickname}] 看视频：任务奖励已领取，{response_json['payload']['message']}")
                Log(f"[{nickname}] 看视频：任务奖励已领取，{response_json['payload']['message']}")
            elif response_json['message'] == '已达积分领取次数上限':
                print(f"[{nickname}] 看视频：积分已领取")
            else:
                print(f"[{nickname}] 看视频：{response_json['message']}")
                Log(f"[{nickname}] 看视频：{response_json['message']}")
        else:
            print(f"[{nickname}] 看视频任务失败：{response_json}")
            Log(f"[{nickname}] 看视频任务失败：{response_json}")
    except requests.RequestException as e:
        print(f"[{nickname}] 看视频任务_请求异常：{e}")
    except json.JSONDecodeError:
        print(f"[{nickname}] 看视频任务_响应不是有效的JSON格式")
    except Exception as e:
        print(f"[{nickname}] 看视频任务_其他异常：{e}")

def reward_balance(nickname: str, token: str, user_id: str):
    headers = wx_headers.copy()
    headers['authorization'] = f'Bearer {token}'
    try:
        response = requests.get(f'https://user-api.4pyun.com/rest/2.0/reward/balance?rP7%2Fz%2BPx7u8%3D={quote(encrypt(user_id,WX_ENCRYPT))}&7%2BnE5cfz8g%3D%3D={quote(encrypt(user_id,WX_ENCRYPT))}&%2Fbb%2F6P7j4erz=pw%3D%3D', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == '1001':
            print(f"[{nickname}] 积分余额：{response_json['payload']['balance']}")
            Log(f"[{nickname}] 积分余额：{response_json['payload']['balance']}")
        else:
            print(f"[{nickname}] 获取积分余额_失败：{response_json}")
            Log(f"[{nickname}] 获取积分余额_失败：{response_json}")
    except requests.RequestException as e:
        print(f"[{nickname}] 获取积分余额_请求异常：{e}")
    except json.JSONDecodeError:
        print(f"[{nickname}] 获取积分余额_响应不是有效的JSON格式")
    except Exception as e:
        print(f"[{nickname}] 获取积分余额_其他异常：{e}")

if __name__ == '__main__':
    if 'pp_token' in os.environ:
        pp_token = re.split("@|&", os.environ.get("pp_token"))
        print(f'查找到{len(pp_token)}个账号')
    else:
        pp_token = []
        print('请填入pp_token变量')
        Log('请填入pp_token变量')

    try:
        if pp_token:
            for pp_token_item in pp_token:
                get_userdata(pp_token_item)
            user_data = get_user_ids_and_tokens()
            if user_data:
                print(f"配置缓存中读取到{len(user_data)}个账号")
                print('*' * 50)
                z = 1
                for item in user_data:
                    print('-' * 50)
                    print(f'登录第{z}个账号>>>>>>')
                    phone_key = item.get('phone_key')
                    new_token = item.get('refresh_token')
                    user_name = item.get('user_name')
                    user_id = item.get('user_id')
                    if new_token:
                        day_sign(user_name,new_token)
                        for _ in range(2):
                            voucher = get_task(user_name, new_token)
                            if voucher:
                                complete_task(user_name, new_token, voucher)
                            time.sleep(5)
                        reward_balance(user_name,new_token,user_id)
                        time.sleep(3)
                    Log('-'*30)
                    z += 1
            else:
                print("未读取到用户数据，程序退出")
                exit(0)
    except Exception as e:
        print(f'程序异常：{e}')
    try:
        send_notification_message(title='PP停车')  # 发送通知
    except Exception as e:
        print('推送失败:' + str(e))
