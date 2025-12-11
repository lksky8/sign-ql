"""
统一茄皇

作者：https://github.com/lksky8/sign-ql
最后更新日期：2025-12-11
食用方法：抓包url https://api.zhumanito.cn/api/login 请求体json {"wid":"12345678910"}
支持多用户运行
多用户用&或者@隔开
例如账号1：12345678910 账号2： 12345678911
则变量为
export tyqh="12345678910@12345678911"

cron: 11 11 * * *
"""

import requests
import os
import re
import time

# 推送开关，True为开启，False为关闭
sendnotify = True

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
    'Host': 'api.zhumanito.cn',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541022) XWEB/16571',
    'authorization': '',
    'accept': '*/*',
    'origin': 'https://h5.zhumanito.cn',
    'sec-fetch-site': 'same-site',
    'sec-fetch-mode': 'cors',
    'sec-fetch-dest': 'empty',
    'referer': 'https://h5.zhumanito.cn/',
    'accept-language': 'zh-CN,zh;q=0.9',
    'priority': 'u=1, i',
}


def login(wid):
    headers = {
        'Host': 'api.zhumanito.cn',
        'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781(0x6700143B) NetType/WIFI MiniProgramEnv/Windows WindowsWechat/WMPF WindowsWechat(0x63090a13) UnifiedPCWindowsWechat(0xf2541022) XWEB/16571',
        'content-type': 'application/json;charset=UTF-8',
        'accept': '*/*',
        'origin': 'https://h5.zhumanito.cn',
        'sec-fetch-site': 'same-site',
        'sec-fetch-mode': 'cors',
        'sec-fetch-dest': 'empty',
        'referer': 'https://h5.zhumanito.cn/',
        'accept-language': 'zh-CN,zh;q=0.9',
        'priority': 'u=1, i',
    }

    try:
        response = requests.post('https://api.zhumanito.cn/api/login', headers=headers, json={'wid': wid})
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['msg'] == '成功':
            print(f"登录成功，用户ID: {wid}，拥有番茄：{response_json['data']['user']['fruit_num']} 个")
            Log(f"登录成功，用户ID: {wid}，拥有番茄：{response_json['data']['user']['fruit_num']} 个")
            if '"seed_stage":0' in response.text:
                print(f"未种植番茄")
                Log(f"未种植番茄")
                time.sleep(1)
                seed_tomato(response_json['data']['token'])
            return  response_json['data']['token']
        else:
            print(f"用户ID: {wid} 登录失败: {response_json['msg']}")
            Log(f"用户ID: {wid} 登录失败: {response_json['msg']}")
            return None
    except requests.RequestException as e:
            print(f"获取用户数据网络请求失败: {e}")
    except ValueError as e:
        print(f"获取用户数据解析JSON响应失败: {e}")
    except KeyError as e:
        print(f"获取用户数据JSON响应中缺少键: {e}")
    except Exception as e:
        print(f"获取用户数据时发生未知错误: {e}")


def get_tomato(user_token):
    headers = api_headers.copy()
    headers['authorization'] = user_token

    try:
        response = requests.post('https://api.zhumanito.cn/api/harvest', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['msg'] == '成功':
            print(f"番茄收获成功，获得番茄：{response_json['data']['fruit_up']} 个")
            Log(f"番茄收获成功，获得番茄：{response_json['data']['fruit_up']} 个")
            seed_tomato(user_token)
        else:
            print(f"收获番茄失败: {response_json['msg']}")
            Log(f"收获番茄失败: {response_json['msg']}")
    except requests.RequestException as e:
            print(f"收获番茄网络请求失败: {e}")
    except ValueError as e:
        print(f"收获番茄解析JSON响应失败: {e}")
    except KeyError as e:
        print(f"收获番茄JSON响应中缺少键: {e}")
    except Exception as e:
        print(f"收获番茄时发生未知错误: {e}")


def seed_tomato(user_token):
    headers = api_headers.copy()
    headers['authorization'] = user_token

    try:
        response = requests.post('https://api.zhumanito.cn/api/seed', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['msg'] == '成功':
            print(f"番茄种植成功")
            Log(f"番茄种植成功")
        else:
            print(f"番茄种植失败: {response_json['msg']}")
            Log(f"番茄种植失败: {response_json['msg']}")
    except requests.RequestException as e:
            print(f"番茄种植网络请求失败: {e}")
    except ValueError as e:
        print(f"番茄种植解析JSON响应失败: {e}")
    except KeyError as e:
        print(f"番茄种植JSON响应中缺少键: {e}")
    except Exception as e:
        print(f"番茄种植时发生未知错误: {e}")

def get_task(user_token):
    headers = api_headers.copy()
    headers['authorization'] = user_token
    try:
        response = requests.get('https://api.zhumanito.cn/api/task?', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['msg'] == '成功':
            print(f"获取任务成功")
            task_lists = []
            for task_list in response_json['data']['task']:
                task_name = task_list['content']
                reward_water = task_list['water_num']
                reward_sun = task_list['sun_num']
                if task_list['status'] == 1:
                    print(f"任务: {task_name}, 奖励水: {reward_water}, 奖励阳光: {reward_sun} 已完成")
                else:
                    print(f"任务: {task_name}, 奖励水: {reward_water}, 奖励阳光: {reward_sun} 未完成")
                task_lists.append({
                    'task_id': task_list['id'],
                    'task_name': task_name,
                })
            return task_lists
        else:
            print(f"获取任务失败: {response_json['msg']}")
            return None
    except requests.RequestException as e:
        print(f"获取任务数据网络请求失败: {e}")
    except ValueError as e:
        print(f"获取任务数据解析JSON响应失败: {e}")
    except KeyError as e:
        print(f"获取任务数据JSON响应中缺少键: {e}")
    except Exception as e:
        print(f"获取任务数据时发生未知错误: {e}")

def get_task_again(user_token):
    headers = api_headers.copy()
    headers['authorization'] = user_token
    try:
        response = requests.get('https://api.zhumanito.cn/api/task?', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['msg'] == '成功':
            print(f"获取任务成功")
            for task_list in response_json['data']['task']:
                task_name = task_list['content']
                reward_water = task_list['water_num']
                reward_sun = task_list['sun_num']
                if task_list['status'] == 1:
                    print(f"任务: {task_name}, 奖励水: {reward_water}, 奖励阳光: {reward_sun} 已完成")
                    Log(f"任务: {task_name}, 奖励水: {reward_water}, 奖励阳光: {reward_sun} 已完成")
                else:
                    print(f"任务: {task_name}, 奖励水: {reward_water}, 奖励阳光: {reward_sun} 未完成")
                    Log(f"任务: {task_name}, 奖励水: {reward_water}, 奖励阳光: {reward_sun} 未完成")
        else:
            print(f"获取任务失败: {response_json['msg']}")
            Log(f"获取任务失败: {response_json['msg']}")
            return None
    except requests.RequestException as e:
        print(f"获取任务数据网络请求失败: {e}")
    except ValueError as e:
        print(f"获取任务数据解析JSON响应失败: {e}")
    except KeyError as e:
        print(f"获取任务数据JSON响应中缺少键: {e}")
    except Exception as e:
        print(f"获取任务数据时发生未知错误: {e}")

def task_complete(user_token, task_id,task_name):
    headers = api_headers.copy()
    headers['authorization'] = user_token
    headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
    try:
        response = requests.post('https://api.zhumanito.cn/api/task/complete', headers=headers, data=f'task_id={task_id}&')
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['msg'] == '成功':
            for task_status in response_json['data']['task']:
                if task_status['task_id'] == task_id and task_status['status']:
                    print(f"任务: {task_name} 成功，剩余水: {response_json['data']['user']['water_num']}, 剩余阳光: {response_json['data']['user']['sun_num']}")
        else:
            print(f"任务: {task_name} 失败: {response_json['msg']}")
    except requests.RequestException as e:
        print(f"完成任务: {task_name} 时网络请求失败: {e}")
    except ValueError as e:
        print(f"完成任务: {task_name} 时解析JSON响应失败: {e}")
    except KeyError as e:
        print(f"完成任务: {task_name} 时JSON响应中缺少键: {e}")
    except Exception as e:
        print(f"完成任务: {task_name} 时发生未知错误: {e}")

def water(user_token):
    headers = api_headers.copy()
    headers['authorization'] = user_token
    headers['content-type'] = 'application/x-www-form-urlencoded;charset=UTF-8'
    try:
        response = requests.post('https://api.zhumanito.cn/api/water', headers=headers)
        response.raise_for_status()
        response_json = response.json()
        if response_json['code'] == 200 and response_json['msg'] == '成功':
            print(f"浇水成功，剩余水: {response_json['data']['user']['water_num']}, 剩余阳光: {response_json['data']['user']['sun_num']}")
            Log(f"浇水成功，剩余水: {response_json['data']['user']['water_num']}, 剩余阳光: {response_json['data']['user']['sun_num']}")
            return True
        elif response_json['code'] == 10006 and response_json['msg'] == '能量值不足了，可以坚持做任务获取哦~':
            print("不够水了")
            Log("不够水了")
            return False
        elif response_json['code'] == 10007 and response_json['msg'] == '今日浇水已达到上限，请明天再来哦~':
            print("今日浇水次数已达到上限")
            Log("今日浇水次数已达到上限")
            return False
        elif response_json['code'] == 10008 and response_json['msg'] == '已成熟，不必浇灌':
            print("番茄已成熟，自动收获")
            Log("番茄已成熟，自动收获")
            get_tomato(user_token)
            return True
        else:
            print(f"浇水失败: {response_json['msg']}")
            return False
    except requests.RequestException as e:
        print(f"浇水时网络请求失败: {e}")
    except ValueError as e:
        print(f"浇水时解析JSON响应失败: {e}")
    except KeyError as e:
        print(f"浇水时JSON响应中缺少键: {e}")
    except Exception as e:
        print(f"浇水时发生未知错误: {e}")
    finally:
        time.sleep(3)


def view_page(wid):
    headers = {
        'Host': 'api.zhumanito.cn',
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'sec-fetch-site': 'same-site',
        'sec-fetch-dest': 'document',
        'accept-language': 'zh-CN,zh-Hans;q=0.9',
        'sec-fetch-mode': 'navigate',
        'user-agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.64(0x1800402b) NetType/WIFI Language/zh_CN miniProgram/wx532ecb3bdaaf92f9',
        'referer': 'https://h5.zhumanito.cn/',
    }
    requests.get(f'https://api.zhumanito.cn/?wid={wid}', headers=headers)


if __name__ == '__main__':
    if 'tyqh' in os.environ:
        tyqh_session = re.split("@|&", os.environ.get("tyqh"))
        print(f'查找到{len(tyqh_session)}个账号')
    else:
        tyqh_session = []

    if tyqh_session:
        z = 1
        for wid in tyqh_session:
            print('*'*50)
            print(f'开始处理第{z}个账号')
            Log(f'处理第{z}个账号:')
            print('-' * 30)
            token = login(wid)
            print('-' * 30)
            all_task = get_task(token)
            print('-'*30)
            print('开始做任务')
            for task in all_task:
                if task['task_name'] == '浏览指定页面':
                    view_page(wid)
                    print('任务: 浏览指定页面 成功')
                    time.sleep(3)
                    continue
                task_complete(token, task['task_id'], task['task_name'])
                time.sleep(3)
            print('-' * 30)
            while water(token):
                pass
            get_task_again(token)
            Log('\n')
            z += 1
            time.sleep(10)
    else:
        print('请填入tyqh变量')
        Log('请填入tyqh变量')
    if sendnotify:
        try:
            send_notification_message(title='统一茄皇')  # 发送通知
        except Exception as e:
            print('推送失败:' + str(e))