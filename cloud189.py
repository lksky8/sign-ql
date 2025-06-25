"""
天翼云盘签到

打开天翼云盘APP抓请求url=api.cloud.189.cn/guns/getPageBanners.action里面accessToken(一般在请求头里)填到变量cloud189_token里面即可

支持多用户运行

多用户用&或者@隔开
例如账号1：10086 账号2： 1008611
则变量为
export cloud189_token="10086&1008611"

cron: 50 1,18 * * *
const $ = new Env("天翼云盘签到");
"""
import requests
import time
import hmac
import hashlib
import base64
import os
from Crypto.PublicKey import RSA
from Crypto.Cipher import AES
from Crypto.Util.Padding import pad, unpad
from Crypto.Cipher import PKCS1_v1_5
import re
from urllib.parse import unquote
from datetime import datetime, timedelta

if 'cloud189_token' in os.environ:
    cloud189_token = re.split("@|&",os.environ.get("cloud189_token"))
    print(f'查找到{len(cloud189_token)}个账号')
else:
    cloud189_token =['']
    print('无cloud189_token变量')




aes_iv = "Zx8dG46ax3Mc8Mj2".encode()  # 16 字节
aes_key = "bf8395f745c04f23".encode()  # 16 字节
# RSA_PUBLIC_KEY_PEM = """-----BEGIN PUBLIC KEY-----
# MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDaoVRMEdxN2LZj7f0UL/0OMJJj
# GuD1OgDRF4WTY1ZCupektwYvS5nU2FelBJ9bV5dv5MVYAp6r9rOkRwE+PEvgwaVP
# ghwfNg1ljCkQ2QFNAmwKHF/sjgHsHu94IbYL7MokSETU6Y4d5k+Vm/3qvqxZs8Yf
# 1HGx3ojEU6Atxqp/QwIDAQAB
# -----END PUBLIC KEY-----"""
RSA_PUBLIC_KEY_PEM = """-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDC72L803mNmrQgyvaU
t115S5gSHuDcS+nGdqBakHYqFShEwrEaqKsr2Z/7DQt9AobB0ne2vIS
UW0tXjhgf5vfl00kT7K+J4j+t3WLkQ6Zwc9KtZHkSW6/fkFSC1EnShP
YLsG6rHYa5+wfefOY2P7yEFRsd5DGCqHNWkzOZclsXawIDAQAB
-----END PUBLIC KEY-----"""

# AES CBC 加密函数
def aes_cbc_encrypt(plaintext, key, iv):
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_plaintext = pad(plaintext.encode('utf-8'), AES.block_size)
    ciphertext = cipher.encrypt(padded_plaintext)
    return base64.b64encode(ciphertext).decode('utf-8')

# AES CBC 解密函数
def aes_cbc_decrypt(ciphertext, key, iv):
    ciphertext = base64.b64decode(ciphertext)
    cipher = AES.new(key, AES.MODE_CBC, iv)
    padded_plaintext = cipher.decrypt(ciphertext)
    plaintext = unpad(padded_plaintext, AES.block_size)
    return plaintext.decode('utf-8')

def encrypt_aes_key(key):
    aes_session_key = key.encode('utf-8')
    rsa_public_key = RSA.import_key(RSA_PUBLIC_KEY_PEM)
    rsa_cipher = PKCS1_v1_5.new(rsa_public_key)
    encrypted_aes_key = rsa_cipher.encrypt(aes_session_key)
    return base64.b64encode(encrypted_aes_key).decode('utf-8')


def md5_encrypt(plaintext):
    md5_hash = hashlib.md5()
    md5_hash.update(plaintext.encode('utf-8'))
    return md5_hash.hexdigest()

def hmac_sha1_hex(key, message):
    key_bytes = key.encode('utf-8')
    message_bytes = message.encode('utf-8')
    hmac_hash = hmac.new(key_bytes, message_bytes, hashlib.sha1)
    return hmac_hash.digest().hex()

def get_task_info(data):
    task_info = []
    for task in data["data"]:
        if not task["status"]:  # 只返回未完成的任务
            task_info.append({
                "taskId": task["taskId"],
                "taskName": task["taskName"],
            })
    return task_info

send_msg = ''
one_msg = ''


def log(cont=''):
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

def generateRsakey():
    headers = {
        'Host': 'api.cloud.189.cn',
        'accept': 'application/json;charset=UTF-8',
        'accept-language': 'zh-cn',
        'x-request-id': '26E11B6CBEB94F77A2E5615C20C06113',
        'date': 'Sun, 22 Jun 2025 14:33:08 GMT',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko)  Mobile/15E148 Safari/604.1',
    }

    params = {
        'clientType': 'TELEIPHONE',
        'version': '10.3.3',
        'model': 'iPhone',
        'osFamily': 'iOS',
        'osVersion': '15.8.3',
        'clientSn': '02676BE3DD-8D86-4B4F-A666-749D1D5C9FF8',
        'returnType': 'JSON',
    }

    response = requests.get('https://api.cloud.189.cn/security/generateRsaKey.action', params=params, headers=headers).json()
    return response['pkId']


def get_AccessToken(sessionKey):
    timestamp_1 = str(int(time.time()))
    signature = md5_encrypt(f'AppKey=600100422&Timestamp={timestamp_1}&sessionKey={sessionKey}')

    headers = {
        'Host': 'api.cloud.189.cn',
        'accept': 'application/json;charset=UTF-8',
        'sign-type': '1',
        'timestamp': timestamp_1,
        'sec-fetch-site': 'same-site',
        'accept-language': 'zh-CN,zh-Hans;q=0.9',
        'signature': signature,
        'sec-fetch-mode': 'cors',
        'origin': 'https://m.cloud.189.cn',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Ecloud/10.3.3 iOS/16.6.1 clientId/027A8AB808-F7A5-431E-8B37-6BD9559D22D7 clientModel/iPhone proVersion/1.0.5',
        'appkey': '600100422',
        'referer': 'https://m.cloud.189.cn/',
        'sec-fetch-dest': 'empty',
    }

    params = {
        'sessionKey': sessionKey,
    }

    response = requests.get('https://api.cloud.189.cn/open/oauth2/getAccessTokenBySsKey.action', params=params,headers=headers).json()
    return response['accessToken']


def login4MergedClient(token):
    timestamp = str(int(time.time()))
    appsignature = hmac_sha1_hex('fe5734c74c2f96a38157f420b32dc995',f'AppKey=600100885&Operate=POST&RequestURI=/login4MergedClient.action&Timestamp={timestamp}')
    param = f'isCache=1&jgOpenId=1114a89792bbaa8d350&deviceModel=iPhone%206s%20Plus&exRetryTimes=1&accessToken={token}&networkAccessMode=WIFI&telecomsOperator=&idfa=00000000-0000-0000-0000-000000000000&clientType=TELEIPHONE&version=10.3.3&model=iPhone&osFamily=iOS&osVersion=15.8.3&clientSn=02676BE3DD-8D86-4B4F-A666-749D1D5C9FF8'
    encrypted_param = aes_cbc_encrypt(param, aes_key, aes_iv)
    epkey = encrypt_aes_key("bf8395f745c04f23")
    pkId = generateRsakey()
    headers = {
        'Host': 'api.cloud.189.cn',
        'content-type': 'application/x-www-form-urlencoded',
        'epver': '2',
        'accept': '*/*',
        'epway': '3',
        'timestamp': timestamp,
        'appsignature': appsignature,
        'accept-language': 'zh-CN,zh-Hans;q=0.9',
        'x-request-id': '26E11B6CBEB94F77A2E5615C20C06113',
        'epkey': epkey,
        'appkey': '600100885',
        'user-agent': 'Cloud189/8 CFNetwork/1410.0.3 Darwin/22.6.0',
    }

    data = {
        'pkId': pkId,
        'param': encrypted_param,
    }

    try:
        response = requests.post('https://api.cloud.189.cn/login4MergedClient.action', headers=headers, data=data).text
        ciphertext = re.search(r'<ciphertext>(.*?)</ciphertext>', response, re.DOTALL).group(1)
        user_data = unquote(aes_cbc_decrypt(ciphertext, aes_key, aes_iv))
        # print(user_data)
        login_Name = re.search(r'<loginName>(.*?)</loginName>', user_data, re.DOTALL).group(1)
        session_Key = re.search(r'<sessionKey>(.*?)</sessionKey>', user_data, re.DOTALL).group(1)
        sessionSecret = re.search(r'<sessionSecret>(.*?)</sessionSecret>', user_data, re.DOTALL).group(1)
        familySessionKey = re.search(r'<familySessionKey>(.*?)</familySessionKey>', user_data, re.DOTALL).group(1)
        return login_Name, session_Key,sessionSecret,familySessionKey
    except Exception as e:
        print(e)
        return False


def day_sign(sS,session_key):
    gmt_time = datetime.utcnow().strftime('%a, %d %b %Y %H:%M:%S GMT')
    signature = hmac_sha1_hex(sS,f'SessionKey={session_key}&Operate=GET&RequestURI=/mkt/userSign.action&Date={gmt_time}')

    headers = {
        'Host': 'api.cloud.189.cn',
        'x-request-id': '26E11B6CBEB94F77A2E5615C20C06113',
        'signature': signature,
        'date': gmt_time,
        'accept-language': 'zh-cn',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Ecloud/10.3.3 (iPhone; 02676BE3DD-8D86-4B4F-A666-749D1D5C9FF8; appStore) iOS/15.8.3',
        'sessionkey': session_key,
        'accept': '*/*',
    }

    params = {
        'clientType': 'TELEIPHONE',
        'version': '10.3.3',
        'model': 'iPhone',
        'osFamily': 'iOS',
        'osVersion': '15.8.3',
        'clientSn': '02676BE3DD-8D86-4B4F-A666-749D1D5C9FF8',
    }

    response = requests.get('https://api.cloud.189.cn/mkt/userSign.action', params=params, headers=headers).text
    if 'userSignResult' in response:
        print('【天翼云盘】签到成功:' + re.search(r'<resultTip>(.*?)</resultTip>', response, re.DOTALL).group(1))
        log('【天翼云盘】签到成功:' + re.search(r'<resultTip>(.*?)</resultTip>', response, re.DOTALL).group(1))
    else:
        print('【天翼云盘】签到失败:' + response)
        log('【天翼云盘】签到失败:' + response)


def ssoLoginMerge(sk,skF,token):
    print("★" * 35 )
    session = requests.Session()
    timestamp = str(int(time.time()))
    api_headers = {
        'Host': 'm.cloud.189.cn',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_8_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Ecloud/10.3.3 iOS/15.8.3 clientId/02676BE3DD-8D86-4B4F-A666-749D1D5C9FF8 clientModel/iPhone proVersion/1.0.5',
        'accept-language': 'zh-CN,zh-Hans;q=0.9',
        'referer': 'https://m.cloud.189.cn/zt/2024/green-task-system/index.html?uxChannel=10021132000'
    }
    session.headers.update(api_headers)

    params = {
        'sessionKey': sk,
        'sessionKeyFm': skF,
        'eAccessToken': token,
        'redirectUrl': 'https://m.cloud.189.cn/zt/2024/green-task-system/index.html?uxChannel=10021132000',
        'rand': f'6947_{timestamp}',
    }
    # 获取cookie数据
    session.get('https://m.cloud.189.cn/ssoLoginMerge.action', params=params)

    # 签到
    params = {
        'sessionKey': sk,
        'activityId': 'ACT2024cztx',
    }

    response = session.get('https://m.cloud.189.cn/market/signInNew.action', params=params)
    if response.json().get('result'):
        print('【绿色能量活动】签到成功')
        log('【绿色能量活动】签到成功')
        params = {
            'sessionKey': sk,
            'activityId': 'ACT2024cztx',
        }

        response = session.get('https://m.cloud.189.cn/market/signInNewInfo.action', params=params)
        print('【绿色能量活动】已签到，今天是本周第' + str(response.json().get('data')) + '天签到')
    else:
        print('【绿色能量活动】签到失败:' + response.text)
        log('【绿色能量活动】签到失败:' + response.text)

    print("\n" + "-" * 50)
    print('【绿色能量活动】获取新人专属任务')
    params = {
        'sessionKey': sk,
        'activityId': 'ACT2024cztx',
        'random': '0.48929593893531875',
        'taskType': '1',
    }

    response = session.get('https://m.cloud.189.cn/market/getGreenTaskList.action', params=params).json()
    new_task = get_task_info(response)

    if len(new_task) > 0:
        print('【绿色能量活动】获取到' + str(len(new_task)) + '个未完成新人专属任务')

        for task in new_task:
            task_id = task["taskId"]
            task_name = task["taskName"]

            data = {
                'activityId': 'ACT2024cztx',
                'sessionKey': sk,
                'taskId': task_id,
            }

            response = session.post('https://m.cloud.189.cn/market/doGreenTask.action', data=data)

            if response.json().get('data'):
                print(f'【绿色能量活动--->新人专属任务】✅ 任务完成: {task_name}')
            else:
                print(f'【绿色能量活动--->新人专属任务】⏩ 任务已跳过: {task_name}')
            time.sleep(1)
    else:
        print('【绿色能量活动】新人专属任务已完成，跳过操作')

    print("-" * 50 + "\n")
    print("-" * 50)
    print('【绿色能量活动】获取AI任务')
    params = {
        'sessionKey': sk,
        'activityId': 'ACT2024cztx',
        'random': '0.3382804414050936',
        'taskType': '2',
    }

    response = session.get('https://m.cloud.189.cn/market/getGreenTaskList.action', params=params).json()
    AI_task = get_task_info(response)

    if len(AI_task) > 0:
        print('【绿色能量活动】获取到' + str(len(AI_task)) + '个未完成日常AI任务')

        for task in AI_task:
            task_id = task["taskId"]
            task_name = task["taskName"]
            data = {
                'activityId': 'ACT2024cztx',
                'sessionKey': sk,
                'taskId': task_id,
            }
            response = session.post('https://m.cloud.189.cn/market/doGreenTask.action', data=data)
            if response.json().get('data'):
                print(f'【绿色能量活动--->日常AI任务】✅ 任务完成: {task_name} ')
            else:
                print(f'【绿色能量活动--->日常AI任务】⏩ 任务已跳过: {task_name} ')
            time.sleep(1)
    else:
        print('【绿色能量活动】日常AI任务已完成，跳过操作')
    print("-" * 50 + "\n")
    print("-" * 50)
    print('【绿色能量活动】获取绿动任务')
    params = {
        'sessionKey': sk,
        'activityId': 'ACT2024cztx',
        'random': '0.3382804414050936',
        'taskType': '3',
    }

    response = session.get('https://m.cloud.189.cn/market/getGreenTaskList.action', params=params).json()
    AI_task = get_task_info(response)

    if len(AI_task) > 0:
        print('【绿色能量活动】获取到' + str(len(AI_task)) + '个未完成绿动任务')

        for task in AI_task:
            task_id = task["taskId"]
            task_name = task["taskName"]
            data = {
                'activityId': 'ACT2024cztx',
                'sessionKey': sk,
                'taskId': task_id,
            }
            response = session.post('https://m.cloud.189.cn/market/doGreenTask.action', data=data)
            if response.json().get('data'):
                print(f'【绿色能量活动--->绿动任务】✅ 任务完成: {task_name} ')
            else:
                print(f'【绿色能量活动--->绿动任务】⏩ 任务已跳过: {task_name} ')
            time.sleep(1)
    else:
        print('【绿色能量活动】绿动任务已完成，跳过操作')
    print("-" * 50 + "\n")

    # 获取绿色能量数据
    params = {
        'sessionKey': sk,
        'activityId': 'ACT2024cztx',
    }

    response = requests.get('https://m.cloud.189.cn/market/getGreenLevelList.action', params=params).json()
    print('【绿色能量活动】目前能量：' + str(response['data']['userScore']) + 'g')
    log('【绿色能量活动】目前能量：' + str(response['data']['userScore']) + 'g'+ "\n")
    print("★" * 35 + "\n")


def main():
    z = 1
    for ck in cloud189_token:
        try:
            print('=' * 60 + '\n')
            print(f'登录第{z}个账号')
            print('=' * 60 + '\n')
            login_result = login4MergedClient(ck)
            print('\n开始签到操作>>>>>>>>>>')
            if isinstance(login_result, tuple):
                sessionKey = login_result[1]
                sessionSecret = login_result[2]
                login_name = login_result[0]
                print(f'【{login_name}】登录成功')
                log(f'【{login_name}】登录成功')
                print('获取到的临时Session_key:' + sessionKey)
                day_sign(sessionSecret, sessionKey)
                print("★" * 35 + "\n")
                ssoLoginMerge(sessionKey, login_result[3], ck)
            else:
                print(f'第{z}个账号：获取sessionKey失败，请检查accessToken是否正确')
                log(f'第{z}个账号：获取sessionKey失败，请检查accessToken是否正确')

            z = z + 1
        except Exception as e:
            print('未知错误' + str(e))
    # print(get_AccessToken(''))


if __name__ == '__main__':
    main()
    try:
        send_notification_message(title='天翼云盘签到')  # 发送通知
    except Exception as e:
        print('推送出错：' + str(e))










