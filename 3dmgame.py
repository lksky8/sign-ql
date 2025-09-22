"""
作者：https://github.com/lksky8/sign-ql/
日期：2025-9-20
网站：3dmgame论坛签到
功能：签到、抽奖，金币可换现金买游戏
食用方法：登录论坛后，浏览器F12打开抓包，https://bbs.3dmgame.com/home.php?mod=spacecp&ac=credit&showcredit=1抓这个url请求头的cookie包
变量：bbs3dmck='cookie'  多个账号用换行分割
定时一天三次
青龙需要安装lxml模块
cron: 0 9 */8 * * *
"""

import time
import requests
from lxml import etree
import re
import random
import os


if 'bbs3dmck' in os.environ:
    bbs3dmck = re.split("@|&",os.environ.get("bbs3dmck"))
    print(f'查找到{len(bbs3dmck)}个账号\n')
else:
    bbs3dmck =[]

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

api_headers = {
    'Host': 'bbs.3dmgame.com',
    'cache-control': 'max-age=0',
    'sec-ch-ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': '"Windows"',
    'upgrade-insecure-requests': '1',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.95 Safari/537.36',
    'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'sec-fetch-site': 'none',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-user': '?1',
    'sec-fetch-dest': 'document',
    'accept-language': 'zh-CN,zh;q=0.9',
}



def user_info(ck):
    headers = api_headers.copy()
    headers['cookie'] = ck
    try:
        response = requests.get('https://bbs.3dmgame.com/home.php?mod=spacecp&ac=credit&showcredit=1', headers=headers)
        if '<script>document.cookie' in response.text:
            print("检测到Cookie验证挑战，正在处理...")
            cookie_pattern = r"document\.cookie\s*=\s*'([^=]+)=([^']+)'"
            match = re.search(cookie_pattern, response.text)
            if match:
                cookie_name = match.group(1)
                cookie_value = match.group(2)
                print(f"提取到Cookie: {cookie_name}={cookie_value}")
                # 替换 headers的cookie里面的yxd_token数据，先获取当前cookie的yxd_token值，再替换
                old_yxd_token = re.search(f'{cookie_name}=([^;]+)', ck)
                if old_yxd_token:
                    old_yxd_token = old_yxd_token.group(1)
                headers['cookie'] = ck.replace(f'{cookie_name}={old_yxd_token}', f'{cookie_name}={cookie_value}')
                response = requests.get('https://bbs.3dmgame.com/home.php?mod=spacecp&ac=credit&showcredit=1', headers=headers)
            else:
                print("未从JS中提取到Cookie信息。")
        html = etree.HTML(response.text)
        user_id = html.xpath('//*[@id="hd"]/div/div[1]/p/strong/a/text()')[0]
        jifen = html.xpath('//*[@id="extcreditmenu"]/text()')[0]
        gold = html.xpath('//*[@id="ct"]/div[1]/div/ul[2]/li[1]/text()')[0]
        print(f'用户ID：[{user_id}] {jifen} 金元：{gold}')
        Log(f'\n用户ID：[{user_id}] {jifen} 金元：{gold}')
    except Exception as e:
        print(e)
        Log(f'\n3dmgmae论坛用户信息获取失败')

def task_view(t_id,ck):
    headers = api_headers.copy()
    headers['cookie'] = ck
    try:
        response = requests.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=view&id={t_id}', headers=headers)
        html = etree.HTML(response.text)
        task_name = html.xpath('//h1[contains(@class, "xs2") and contains(@class, "ptm") and contains(@class, "pbm")]/text()')[0].strip()
        if 'do=apply' in response.text:
            print(f'任务：《{task_name}》 可申请')
        elif '后可以再次申请' in response.text:
            print(f'任务：《{task_name}》 未到申请时间')
        elif '您所在的用户组无法申请此任务' in response.text:
            print(f'任务：《{task_name}》 您所在的用户组无法申请此任务')
        elif 'static/image/task/reward.gif' in response.text:
            print(f'任务：《{task_name}》 任务已完成，待领取奖励')
        else:
            print(f'任务：《{task_name}》 未知状态')
    except Exception as e:
        print(e)


def check_task(ck):
    headers = api_headers.copy()
    headers['cookie'] = ck
    try:
        response = requests.get('https://bbs.3dmgame.com/home.php?mod=task', headers=headers)
        # print(response.text)
        html = etree.HTML(response.text)
        task_rows = html.xpath('//div[@class="ptm"]//table//tr')

        # for row in task_rows:
        #     # 提取任务名称
        #     task_name = row.xpath('.//td[2]//h3/a/text()')[0] if row.xpath('.//td[2]//h3/a/text()') else ""
        #
        #     # 提取任务描述
        #     description = row.xpath('.//td[2]/p/text()')[0] if row.xpath('.//td[2]/p/text()') else ""
        #
        #     # 提取任务奖励
        #     reward = row.xpath('.//td[3]/text()')[0].strip() if row.xpath('.//td[3]/text()') else ""
        #
        #     # 提取任务状态（可申请/不可申请）
        #     is_available = len(row.xpath('.//td[4]//img[@alt="apply"]')) > 0
        #
        #     apply_link = row.xpath('.//td[4]/a[contains(@href, "do=apply")]/@href')[0] if row.xpath('.//td[4]/a[contains(@href, "do=apply")]/@href') else "无可用申请链接"
        #
        #     print(f"任务名称: {task_name}")
        #     print(f"申请链接: {apply_link}")
        #     print(f"描述: {description}")
        #     print(f"奖励: {reward}")
        #     print(f"是否可申请: {'是' if is_available else '否'}")
        #     print("---")
        task_list = {}
        for row in task_rows:
            task_name = row.xpath('.//td[2]//h3/a/text()')[0] if row.xpath('.//td[2]//h3/a/text()') else ""
            description = row.xpath('.//td[2]/p/text()')[0] if row.xpath('.//td[2]/p/text()') else ""
            reward = row.xpath('.//td[3]/text()')[0].strip() if row.xpath('.//td[3]/text()') else ""
            apply_links = row.xpath('.//td[4]/a[contains(@href, "do=apply")]/@href')

            # 只处理有可用申请链接的任务
            if apply_links:
                apply_link = apply_links[0]
                print(f"任务名称: {task_name}")
                print(f"描述: {description}")
                print(f"奖励: {reward}")
                # print(f"任务id: {apply_link.split('id=')[-1]}")
                print("-"*50)
                task_list.update({task_name: apply_link.split('id=')[-1]})
        if len(task_list) > 0:
            print(f'获取到{len(task_list)}个可接任务')
            for name, link_id in task_list.items():
                print('*' * 30)
                print(f'尝试领取任务：{name}')
                response = requests.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=apply&id={link_id}', headers=headers)
                if 'do=draw' in response.text:
                    response = requests.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={link_id}', headers=headers)
                    if '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' in response.text:
                        print(f'任务：{name} 直接完成')
                    else:
                        print(f'任务：{name} 失败' + response.text)
                elif '申请此任务需要先完成另一个任务' in response.text:
                    html_message = etree.HTML(response.text)
                    qianzhi_task = html_message.xpath('//div[@id="messagetext"]//p[@class="alert_btnleft"]/a/@href')[0].split("id=")[-1]
                    print(f'任务：{name} 领取失败 | 原因是：前置任务未完成，跳转前置任务id：{qianzhi_task}')
                    task_view(qianzhi_task,ck)
                elif '任务申请成功' in response.text:
                    print(f'任务：{name} 领取成功')
                elif '不是进行中的任务' in response.text:
                    print(f'任务：{name} 无法直接完成')
                else:
                    print(f'任务：{name} 领取失败')
                    print(response.text)
                time.sleep(1)
            print('-' * 50)
        else:
            print('没有可接任务')
            # Log(f'\n没有可接任务')
            print('-' * 50)
    except Exception as e:
        print(e)



def check_task_doing(ck):
    headers = api_headers.copy()
    headers['cookie'] = ck
    try:
        response = requests.get('https://bbs.3dmgame.com/home.php?mod=task&item=doing', headers=headers)
        # print(response.text)
        html = etree.HTML(response.text)
        task_rows = html.xpath('//div[@class="ptm"]//table//tr')
        task_list = []
        for row in task_rows:
            # 提取任务名称
            task_name = row.xpath('.//td[2]//h3/a/text()')[0] if row.xpath('.//td[2]//h3/a/text()') else ""

            # 提取任务ID
            task_id = row.xpath('.//td[2]//h3/a/@href')[0].split('id=')[-1] if row.xpath('.//td[2]//h3/a/@href') else ""

            # 提取do=view链接（任务详情链接）
            # view_link = row.xpath('.//td[2]//h3/a[contains(@href, "do=view")]/@href')[0] if row.xpath('.//td[2]//h3/a[contains(@href, "do=view")]/@href') else ""

            # 提取领取链接(do=draw类型)
            # draw_links = row.xpath('.//td[4]/p/a[contains(@href, "do=draw")]/@href')[0] if row.xpath('.//td[4]/p/a/@href') else ""
            print(f"进行中的任务: 《{task_name}》")
            task_list.append({task_name: task_id})
            print('-'*30)
        if len(task_list) > 0:
            return task_list
        else:
            print('没有进行中的任务')
            # Log(f'\n没有进行中的任务')
            return []
    except Exception as e:
        print(e)

def do_task(tk_list,ck):
    headers = api_headers.copy()
    headers['cookie'] = ck
    print(f'获取到{len(tk_list)}个待完成任务')
    for task_name,task_id in tk_list.items():
        print(f'尝试完成任务：《{task_name}》')
        response = requests.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=view&id={task_id}',headers=headers)
        if 'static/image/task/reward.gif' in response.text:
            response = requests.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={task_id}',headers=headers)
            if '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' in response.text:
                print(f'任务：《{task_name}》 完成')
            else:
                print(f'任务：《{task_name}》 失败')
                print(response.text)
        elif '完成此任务所需条件' in response.text:
            print(f'任务：《{task_name}》 无完成条件')
            response = requests.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={task_id}', headers=headers)
            if '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' in response.text:
                print(f'任务：《{task_name}》 完成')
            else:
                print(f'任务：《{task_name}》 失败')
                print(response.text)
        else:
            print(f'任务：《{task_name}》 有完成条件')
            tree = etree.HTML(response.text)
            tables = tree.xpath("//table[@class='tfm']//td[@class='bbda']/a/@href")[0]
            # print(tables)
            reply_td = tree.xpath("//table[@class='tfm']//td[@class='bbda'][contains(., '次')]/text()[normalize-space()]")[1]
            reply_td = reply_td.replace(' ', '')
            # print(reply_td)
            reply_count = re.search(r'(\d+)次', reply_td).group(1) if re.search(r'(\d+)次', reply_td) else "未知"
            if 'thread' in tables:
                response = requests.get(f'https://bbs.3dmgame.com/{tables}', headers=headers)
                formhash = re.search(r'name="formhash" value="(\w+)"', response.text).group(1)
                fid_match = re.search(r"fid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                tid_match = re.search(r"tid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                print('回复次数:' + reply_count)
                if int(reply_count) > 5:
                    print('回复次数大于5次，任务跳过')
                else:
                    for _ in range(int(reply_count)):
                        reply(tid_match, fid_match, formhash, ck)
                        time.sleep(35)
                print(f'已完成任务 《{task_name}》 回复指定文章要求')
            else:
                response = requests.get(f'https://bbs.3dmgame.com/{tables}', headers=headers)
                result = re.findall(r'mod=redirect&tid=(\d+)&goto', response.text)
                if len(result) > 0:
                    tiezi_id = random.choice(result)
                    response = requests.get(f'https://bbs.3dmgame.com/thread-{tiezi_id}-1-1.html', headers=headers)
                    formhash = re.search(r'name="formhash" value="(\w+)"', response.text).group(1)
                    fid_match = re.search(r"fid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                    tid_match = re.search(r"tid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                    for _ in range(int(reply_count)):
                        reply(tid_match, fid_match, formhash, ck)
                        time.sleep(35)
                print(f'已完成任务 《{task_name}》 回复指定主题要求')
            response = requests.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={task_id}', headers=headers)
            if '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' in response.text:
                print(f'任务：《{task_name}》 完成')
            elif '您已完成该任务的' in response.text:
                html = etree.HTML(response.text)
                b = html.xpath('//div[@id="messagetext"]/p/text()')[0]
                print(f'任务：《{task_name}》 失败：' + b.strip())
            elif '您还没有开始执行任务，赶快哦' in response.text:
                print(f'任务：《{task_name}》 失败：因任务特殊跳过该任务')
            elif '您还没有开始执行任务' in response.text:
                print(f'任务：《{task_name}》 失败：因任务特殊跳过该任务')
            else:
                print(f'任务：《{task_name}》 失败')
                print(response.text)
        time.sleep(3)

def reply(tid,fid,formhash,ck):
    headers = api_headers.copy()
    headers['cookie'] = ck
    data = {
        'file': '',
        'message': '我是新玩家，搞不懂'+ random.choice(['1','2','3','4','5','6','7','8','9','0']),
        'posttime': str(int(time.time())),
        'formhash': formhash,
        'usesig': '',
        'subject': '  ',
    }
    response = requests.post(f'https://bbs.3dmgame.com/forum.php?mod=post&action=reply&fid={fid}&tid={tid}&extra=page%3D1&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1', headers=headers, data=data)
    if '回复发布成功' in response.text:
        print('回帖成功,等待35秒后回复下个帖子')
    else:
        print('回复失败，未知原因')
        print(response.text)


def main():
    z = 1
    if bbs3dmck:
        for ck in bbs3dmck:
            print(f'登录第{z}个账号')
            user_info(ck)
            print('-' * 50)
            print('开始做论坛任务-->>>>>>>>')
            check_task(ck)
            task_list = check_task_doing(ck)
            if task_list:
                for task in task_list:
                    do_task(task, ck)
            print('等待1分钟进行下一个账号')
            print('*' *50)
            time.sleep(60)
            Log('-' * 30)
            z = z + 1
    else:
        print('无bbs3dmck变量')
        Log(f'\n未填入3dmgame_cookies变量')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(e)
    try:
        send_notification_message(title='3dmgame论坛签到')  # 发送通知
    except Exception as e:
        print(e)
