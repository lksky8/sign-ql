'''
作者：https://github.com/lksky8/sign-ql/
日期：2025-8-21
网站：游侠网APP签到
功能：签到、抽奖，金币可换现金买游戏，配合金币脚本使用可获得更多金币
变量：yxwlogin='账号&密码'  多个账号用@或者#分割 
定时：一天一次
cron：45 8 * * *
'''

from json import JSONDecodeError
import requests
import hashlib
import time
import json
import os
import re
import datetime


if 'yxwlogin' in os.environ:
    yxwlogin = re.split("@|#",os.environ.get("yxwlogin"))
    print(f'查找到{len(yxwlogin)}个账号')
else:
    yxwlogin = []


send_msg = ''
one_msg = ''

def log(cont=''):
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
    'Host': 'api3.ali213.net',
    'accept': '*/*',
    'user-agent': 'ali213app',
    'accept-language': 'zh-Hans-CN;q=1',
}

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

            if user_name and user_token:  # 确保userId和token存在
                results.append({
                    'phone_key': phone_key,
                    'user_name': user_name,
                    'token': user_token
                })
                # print(f"手机号: {phone_key}, userId: {user_id}, token: {token}")

        return results

    except FileNotFoundError:
        print(f"文件 {file_path} 不存在！")
        return []
    except json.JSONDecodeError:
        print(f"文件 {file_path} 格式错误！")
        return []

def save_or_update_phone_data(phone_key, new_data, file_path='youxia_data.json'):
    if os.path.exists(file_path):
        with open(file_path, 'r', encoding='utf-8') as f:
            existing_data = json.load(f)
    else:
        existing_data = {}

    if phone_key in existing_data:
        existing_data[phone_key].update(new_data)  # 合并新旧数据
        print(f"账号 [{phone_key}] 数据已更新！")
    else:
        existing_data[phone_key] = new_data  # 新增数据
        print(f"账号 [{phone_key}] 新增数据！")

    with open(file_path, 'w', encoding='utf-8') as f:
        json.dump(existing_data, f, ensure_ascii=False, indent=4)

def get_userdata(u):
    phone_user = u.split('&')[0]
    phone_password = u.split('&')[1]

    try:
        with open('youxia_data.json', 'r', encoding='utf-8') as f:
            cache_data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        cache_data = {}

    if phone_user not in cache_data:
        print(f'账号 {phone_user} 不存在于缓存中，尝试初始化数据')
        login(phone_user, phone_password)
    else:
        print(f'账号 {phone_user} 已存在于缓存中，直接读取数据')

def md5_encode(string):
    md5 = hashlib.md5()
    md5.update(string.encode('utf-8'))
    return md5.hexdigest()

def check_token(phone,token): # 检查token是否有效，并返回新的token
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/checktoken?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1:
            print(f'账号 [{phone}] token 有效')
            save_or_update_phone_data(phone, {'token': response_json['token']})
            return response_json['token']
        else:
            print(f'账号 [{phone}] token 无效')
            log(f'账号 [{phone}] token 无效\n')
            return None
    except JSONDecodeError as e:
        print(f'账号 [{phone}] 检查token失败: {e}')
    except Exception as e:
        print(f'账号 [{phone}] 检查token失败: {e}')


def token_exchanger(token):
    headers = {
        'Host': 'api3.ali213.net',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ali213app',
        'accept-language': 'zh-CN,zh-Hans;q=0.9',
        'sec-fetch-dest': 'document',
    }

    response = requests.get('https://api3.ali213.net/feedearn/tokenexchanger?token='+token+'&redirectUrl=https://api3.ali213.net/feedearn/luckybox',headers=headers)
    print(response.text)

def userinfo(phone,token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/userbaseinfo?token={token}', headers=api_headers)
        response_json = response.json()
        if '"status":0' in response.text:
            print(f'账号 [{phone}] 登录过期，需要重新登录')
            log(f'账号 [{phone}] 登录过期，需要重新登录\n')
        else:
            experience = response_json['experience']
            nextgrade_experience = response_json['nextgrade']['experience']
            nextgrade_experience_coin = response_json['nextgrade']['coin']
            money = response_json['money'] / 100
            # 计算百分比
            percent = (experience / nextgrade_experience) * 100
            print(f'账号 [{response_json["nickname"]}] Lv.{response_json["grade"]} 目前金币：{response_json["coins"]} 现金：{money} 剩余{percent:.2f}% 即可升级获得{nextgrade_experience_coin}金币')
            log(f'账号 [{response_json["nickname"]}] Lv.{response_json["grade"]} 目前金币：{response_json["coins"]} 现金：{money} 剩余{percent:.2f}% 即可升级获得{nextgrade_experience_coin}金币\n')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{phone}] 获取用户信息失败: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{phone}] 获取用户信息失败: {e}')
    except Exception as e:
        print(f'账号 [{phone}] 获取用户信息失败: {e}')

def check_sign(name,token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/signing?action=set&token={token}', headers=api_headers)
        if r'\u7528\u6237\u672a\u767b\u5f55\u6216\u767b\u5f55\u5df2\u8d85\u65f6' in response.text:
            print(f'账号 [{name}] 登录过期，需要重新登录')
        else:
            response_json = response.json()
            if response_json['data']['status'] == 1:
                print(f'账号 [{name}] {response_json["data"]["msg"]}，获得金币:{response_json["data"]["coins"]}')
                log(f'账号 [{name}] {response_json["data"]["msg"]}，获得金币:{response_json["data"]["coins"]}\n')
            elif response_json['data']['status'] == 0:
                print(f'账号 [{name}] {response_json["data"]["msg"]}')
                log(f'账号 [{name}] {response_json["data"]["msg"]}\n')
            else:
                print(f'账号 [{name}] 签到失败:{response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 签到失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 签到失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 签到失败[其他]: {e}')

def login(phone, password):
    headers = {
        'Host': 'i.ali213.net',
        'accept': '*/*',
        'user-agent': 'ali213app',
        'accept-language': 'zh-Hans-CN;q=1',
    }
    time10 = str(int(time.time()))
    params = {
        'action': 'login',
        'from': 'feedearn',
        'passwd': password,
        'signature': md5_encode(f'username-{phone}-time-{time10}-passwd-{password}-from-feedearn-action-loginBGg)K6ng4?&x9sCIuO%C2%' + '{@TJ?fnFJ,bZKy/[/EWnw9UsC$@1'),
        'time': time10,
        'username': phone,
    }
    try:
        response = requests.get('https://i.ali213.net/api.html', params=params, headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['status'] == 1 and response_json['msg'] == '登录成功':
            print('登录成功: ' + response_json['data']['userinfo']['nickname'])
            log(f'账号 [{response_json["data"]["userinfo"]["nickname"]}] 登录成功\n')
            new_data = {
                'uid': response_json['data']['userinfo']['uid'],
                'nickname': response_json['data']['userinfo']['nickname'],
                'token': response_json['data']['token'],
            }
            save_or_update_phone_data(phone, new_data)
        elif response_json['status'] == 0:
            print('登录失败: ' + response_json['msg'])
            log(f'登录失败: {response_json["msg"]}\n')
        else:
            print('登录失败: ' + response_json)
    except requests.exceptions.RequestException as e:
        print(e)

def newusercheck(name, token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/newusercheck?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1 and response_json['msg'] == '您是老用户，所以还是跳老活动页面吧' or response_json['msg'] == '您参与完新用户活动了，现在去老活动页面吧':
            # print(f'账号 [{name}] 老用户了，去周签')
            olduser_sign(name, token)
        elif response_json['status'] == 3 and response_json['msg'] == '您是最新用户，可以跳最新活动页面了':
            # print(f'账号 [{name}] 新用户，去首月福利签到')
            newuser_sign(name, token)
        else:
            print(f'账号 [{name}] 未知状态: {response_json}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 检查新用户失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 检查新用户失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 检查新用户失败[其他]: {e}')

def newuser_sign(name, token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/newuseractivitysign?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1:
            print(f'账号 [{name}] 新用户福利: {response_json["msg"]}')
            log(f'账号 [{name}] 新用户福利: {response_json["msg"]}\n')
            newuser_monthsigncheck(name, token)
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 新用户福利: {response_json["msg"]}')
            log(f'账号 [{name}] 新用户福利: {response_json["msg"]}\n')
            newuser_monthsigncheck(name, token)
        else:
            print(f'账号 [{name}] 新用户福利:签到失败 {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 新用户福利签到失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 新用户福利签到失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 新用户福利签到失败[其他]: {e}')

def newuser_monthsigncheck(name, token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/newusermonthactivity?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1:
            prize = response_json['data']['prize']
            today = datetime.datetime.now().strftime('%Y-%m-%d')
            for item in prize:
                if item['date'] == today:
                    print(f"账号 [{name}] 【新用户首月福利】 今天({today})的签到信息:")
                    log(f'账号 [{name}] 【新用户首月福利】 今天({today})的签到信息:\n')
                    newuser_kjl(name, token, item['con'], item['tit'], item['typeid'])
                    break
            else:
                print('没有获取到当天签到数据')
                log('没有获取到当天签到数据\n')
            month_day = response_json["data"]["qztime"].split(',')
            print(f'账号 [{name}] 【新用户首月福利】已签到: {response_json["data"]["wcday"]}天，已领取{response_json["data"]["totalcoin"]}金币')
            log(f'账号 [{name}] 【新用户首月福利】已签到: {response_json["data"]["wcday"]}天，已领取{response_json["data"]["totalcoin"]}金币\n')
            print(f'账号 [{name}] 【新用户首月福利】从{month_day[0]}开始，到{month_day[1]}结束。记得绑定Steam账号才能领取奖励')
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 新用户月签查询失败: {response_json["msg"]}')
            log(f'账号 [{name}] 新用户月签查询失败: {response_json["msg"]}\n')
        else:
            print(f'账号 [{name}] 新用户月签查询失败: {response.text}')
            log(f'账号 [{name}] 新用户月签查询失败: {response.text}\n')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 新用户月签查询失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 新用户月签查询失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 新用户月签查询失败[其他]: {e}')

def olduser_sign(name, token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/olduseractivitysign?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1:
            print(f'账号 [{name}] 老用户福利: {response_json["msg"]}')
            log(f'账号 [{name}] 老用户福利: {response_json["msg"]}\n')
            olduser_weeksigncheck(name, user_token)
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 老用户福利: {response_json["msg"]}')
            log(f'账号 [{name}] 老用户福利: {response_json["msg"]}\n')
            olduser_weeksigncheck(name, user_token)
        else:
            print(f'账号 [{name}] 老用户福利:签到失败 {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 老用户福利签到失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 老用户福利签到失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 老用户福利签到失败[其他]: {e}')

def olduser_weeksigncheck(name, token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/oldusermonthactivity?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1:
            print(f'账号 [{name}] 【第{response_json["data"]["prizingno"]}阶段】已达成连续签到: {response_json["data"]["signday"]}天')
            log(f'账号 [{name}] 【第{response_json["data"]["prizingno"]}阶段】已达成连续签到: {response_json["data"]["signday"]}天\n')
            if response_json["data"]["signday"] == 7:
                print(f'账号 [{name}] 第七天了，可领取奖励')
                kjl(name, token)
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 周签查询失败: {response_json["msg"]}')
            log(f'账号 [{name}] 周签查询失败: {response_json["msg"]}\n')
        else:
            print(f'账号 [{name}] 周签查询失败: {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 周签查询失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 周签查询失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 周签查询失败[其他]: {e}')

def kjl(name, token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/olduseractivityprizing?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1 and response_json['msg'] == '恭喜中奖':
            print(f'账号 [{name}] 已领取奖励: 《{response_json["data"]["name"]}》')
            log(f'账号 [{name}] 已领取奖励: 《{response_json["data"]["name"]}》\n')
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 领取奖励失败: {response_json["msg"]}')
            log(f'账号 [{name}] 领取奖励失败: {response_json["msg"]}\n')
        else:
            print(f'账号 [{name}] 领取奖励失败: {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 领取奖励失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 领取奖励失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 领取奖励失败[其他]: {e}')

def newuser_kjl(name,token,coin,mem,typeid):
    try:
        params = {
            "coin": coin,
            "mem": mem,
            "token": token,
            "typeid": str(typeid)
        }
        response = requests.post("https://api3.ali213.net/feedearn/newuserprizing", params=params, headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1 and response_json['msg'] == '成功':
            print(f'账号 [{name}] 【新用户首月福利】已领取奖励: {coin}')
            log(f'账号 [{name}] 【新用户首月福利】已领取奖励: {coin}\n')
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 【新用户首月福利】领取奖励失败: {response_json["msg"]}')
            log(f'账号 [{name}] 【新用户首月福利】领取奖励失败: {response_json["msg"]}\n')
        else:
            print(f'账号 [{name}] 【新用户首月福利】领取奖励失败: {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 【新用户首月福利】领取奖励失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 【新用户首月福利】领取奖励失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 【新用户首月福利】领取奖励失败[其他]: {e}')


def luckbox_cookies(phone, token):
    headers = {
        'Host': 'api3.ali213.net',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'sec-fetch-site': 'none',
        'sec-fetch-mode': 'navigate',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 ali213app',
        'accept-language': 'zh-CN,zh-Hans;q=0.9',
        'sec-fetch-dest': 'document',
    }

    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/tokenexchanger?token={token}&redirectUrl=https://api3.ali213.net/feedearn/luckybox', headers=headers)
        api3AliSSO = response.cookies.get_dict()
        if api3AliSSO:
            print(f'账号 [{phone}] 获取神秘宝箱cookies成功')
            save_or_update_phone_data(phone, api3AliSSO)
        else:
            print(f'账号 [{phone}] 获取神秘宝箱cookies失败')
            log(f'账号 [{phone}] 获取神秘宝箱cookies失败\n')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{phone}] 获取神秘宝箱cookies失败[请求]: {e}')
    except Exception as e:
        print(f'账号 [{phone}] 获取神秘宝箱cookies失败[其他]: {e}')

def usermission(name,token):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/usermission?token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1:
            print(f'账号 [{name}] 任务查询成功')
            common_mission = response_json['data']['common']
            if common_mission:
                for mission in common_mission:
                    mission_name = mission['title']
                    mission_experience = mission['experience']
                    mission_total = mission['total']
                    mission_prize = mission['prize']
                    print(f'任务名称: {mission_name}, 每日次数: {mission_total}, 奖励经验: {mission_experience}, {mission_prize}')
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 任务查询失败: {response_json["msg"]}')
        else:
            print(f'账号 [{name}] 任务查询失败: {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 任务查询失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 任务查询失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 任务查询失败[其他]: {e}')

def share(name,token,entity_id):
    try:
        response = requests.get(f'https://api3.ali213.net/feedearn/sharearticle?channelID=1&entityID={entity_id}&token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['status'] == 1:
            print(f'账号 [{name}] 分享成功，奖励: {response_json["msg"]}金币')
        elif response_json['status'] == 0:
            print(f'账号 [{name}] 分享失败: {response_json["msg"]}')
        else:
            print(f'账号 [{name}] 分享失败: {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 分享失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 分享失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 分享失败[其他]: {e}')

def get_recommendList():
    try:
        response = requests.get('https://newapi.ali213.net/app/v1/recommendList?confirmNo=0&keyword=&lastId=&navId=2&pageNo=1&pageNum=10', headers=api_headers)
        response_json = response.json()
        if response_json['code'] == 200:
            print('推荐列表数据获取成功')
            data = response_json['data']['list']
            integer_jump_urls = []
            for item in data:
                if isinstance(item.get('jumpUrl'), int):
                    integer_jump_urls.append(item['jumpUrl'])
            return integer_jump_urls
        else:
            print('推荐列表数据获取失败')
            log(f'推荐列表数据获取失败\n')
            return []
    except requests.exceptions.RequestException as e:
        print(f'推荐列表数据获取失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'推荐列表数据获取失败[JSON]: {e}')
    except Exception as e:
        print(f'推荐列表数据获取失败[其他]: {e}')


def get_square():
    try:
        response = requests.get('https://club.ali213.net/application/forum/square?id=0', headers=api_headers)
        response_json = response.json()
        if response_json['code'] == 111 and response_json['msg'] == 'success':
            print('BBS社区数据获取成功')
            threadList = response.json()['data']['threadList']
            thread_id = []
            for item in threadList:
                thread_id.append(item['id'])
            return thread_id
        else:
            print('BBS社区数据获取失败')
            log(f'BBS社区数据获取失败\n')
            return []
    except requests.exceptions.RequestException as e:
        print(f'BBS社区数据获取失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'BBS社区数据获取失败[JSON]: {e}')
    except Exception as e:
        print(f'BBS社区数据获取失败[其他]: {e}')

def readingreward(name,token,threadid):
    try:
        response = requests.get(f'https://club.ali213.net/application/thread/readingreward?threadid={threadid}&token={token}', headers=api_headers)
        response_json = response.json()
        if response_json['code'] == 111 and response_json['msg'] == 'success':
            print(f'账号 [{name}] 阅读奖励成功，奖励: {response_json["data"]}金币')
        elif response_json['code'] == -1 and response_json['msg'] == 'failed':
            print(f'账号 [{name}] 阅读奖励失败: 已领取过奖励')
        else:
            print(f'账号 [{name}] 阅读奖励失败: {response.text}')
    except requests.exceptions.RequestException as e:
        print(f'账号 [{name}] 阅读奖励失败[请求]: {e}')
    except json.JSONDecodeError as e:
        print(f'账号 [{name}] 阅读奖励失败[JSON]: {e}')
    except Exception as e:
        print(f'账号 [{name}] 阅读奖励失败[其他]: {e}')

if __name__ == '__main__':
    print('*'*50)
    all_user = len(yxwlogin)
    print(f"检测到环境变量中存在{all_user}个账号")
    for yxwlogin_item in yxwlogin:
        get_userdata(yxwlogin_item)

    user_data = get_user_ids_and_tokens()
    if not user_data:
        print("未读取到用户数据，程序退出")
        exit(0)
    else:
        print(f"读取到{len(user_data)}个账号")

    recommendList = get_recommendList()
    square = get_square()
    print('*'*50)

    for item in user_data:
        print('-' * 50)
        log('-' * 50)
        user_phone = item['phone_key']
        user_name = item['user_name']
        user_token = item['token']
        new_user_token = check_token(user_phone,user_token)
        if new_user_token:
            userinfo(user_phone, new_user_token)
            check_sign(user_name, new_user_token)
            newusercheck(user_name, new_user_token)
            luckbox_cookies(user_phone, user_token)
            # usermission(user_name, new_user_token)
            if recommendList:
                for entity_id in recommendList:
                    share(user_name, new_user_token, entity_id)
                    time.sleep(1)
            else:
                print(f'账号 [{user_phone}] 推荐列表为空')
            if square:
                for thread_id in square:
                    readingreward(user_name, new_user_token, thread_id)
                    time.sleep(1)
            else:
                print(f'账号 [{user_phone}] BBS社区列表为空')
        else:
            print(f'账号 [{user_phone}] 获取数据失败')
            continue

    try:
        send_notification_message(title='游侠网开宝箱')  # 发送通知
    except Exception as e:
        print('推送失败:' + str(e))    

