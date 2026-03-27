"""
作者：https://github.com/lksky8/sign-ql/
日期：2026-3-28
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
        print('发送通知消息失败！' + str(e))


class ThreeDMGame:
    def __init__(self, cookies):
        headers = {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'zh-CN,zh;q=0.9',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Origin': 'https://bbs.3dmgame.com',
            'Pragma': 'no-cache',
            'Sec-Fetch-Dest': 'iframe',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-User': '?1',
            'Upgrade-Insecure-Requests': '1',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36',
            'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Google Chrome";v="146"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"Windows"',
            'Cookie': cookies,
        }
        self.session = requests.Session()
        self.session.headers.update(headers)

    def user_info(self):
        try:
            response = self.session.get('https://bbs.3dmgame.com/home.php?mod=spacecp&ac=credit&showcredit=1')
            html = etree.HTML(response.text)
            user_id = html.xpath('//*[@id="hd"]/div/div[1]/p/strong/a/text()')[0]
            points = html.xpath('//*[@id="extcreditmenu"]/text()')[0]
            gold = html.xpath('//*[@id="ct"]/div[1]/div/ul[2]/li[1]/text()')[0]
            print(f'用户ID：[{user_id}] {points} 金元：{gold}')
            Log(f'\n用户ID：[{user_id}] {points} 金元：{gold}')
        except Exception as e:
            print('3dmgame论坛用户信息获取失败：', e)
            Log(f'\n3dmgame论坛用户信息获取失败')

    def task_view(self, t_id):
        try:
            response = self.session.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=view&id={t_id}')
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
            print(f'查看任务信息失败：{t_id} {e}')

    def check_task(self):
        try:
            response = self.session.get('https://bbs.3dmgame.com/home.php?mod=task')
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
                    print("-" * 50)
                    task_list.update({task_name: apply_link.split('id=')[-1]})
            if len(task_list) > 0:
                print(f'获取到{len(task_list)}个可接任务')
                for name, link_id in task_list.items():
                    print('*' * 30)
                    print(f'尝试领取任务：{name}')
                    response = self.session.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=apply&id={link_id}')
                    if 'do=draw' in response.text:
                        response = self.session.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={link_id}')
                        if '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' in response.text:
                            print(f'任务：{name} 直接完成')
                        else:
                            print(f'任务：{name} 失败' + response.text)
                    elif '申请此任务需要先完成另一个任务' in response.text:
                        html_message = etree.HTML(response.text)
                        qianzhi_task = html_message.xpath('//div[@id="messagetext"]//p[@class="alert_btnleft"]/a/@href')[0].split("id=")[-1]
                        print(f'任务：{name} 领取失败 | 原因是：前置任务未完成，跳转前置任务id：{qianzhi_task}')
                        self.task_view(qianzhi_task)
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
            print(f'检查任务信息失败：{e}')

    def check_task_doing(self):
        try:
            response = self.session.get('https://bbs.3dmgame.com/home.php?mod=task&item=doing')
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
                print('-' * 30)
            if len(task_list) > 0:
                return task_list
            else:
                print('没有进行中的任务')
                # Log(f'\n没有进行中的任务')
                return []
        except Exception as e:
            print(f'检查任务进行中失败：{e}')

    def do_task(self, tk_list):
        print(f'获取到{len(tk_list)}个待完成任务')
        for task_name, task_id in tk_list.items():
            print(f'尝试完成任务：《{task_name}》')
            response = self.session.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=view&id={task_id}')
            if 'static/image/task/reward.gif' in response.text:
                response = self.session.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={task_id}')
                if '恭喜您，任务已成功完成，您将收到奖励通知，请注意查收' in response.text:
                    print(f'任务：《{task_name}》 完成')
                else:
                    print(f'任务：《{task_name}》 失败')
                    print(response.text)
            elif '完成此任务所需条件' in response.text:
                print(f'任务：《{task_name}》 无完成条件')
                response = self.session.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={task_id}')
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
                    response = self.session.get(f'https://bbs.3dmgame.com/{tables}')
                    formhash = re.search(r'name="formhash" value="(\w+)"', response.text).group(1)
                    fid_match = re.search(r"fid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                    tid_match = re.search(r"tid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                    print('回复次数:' + reply_count)
                    if int(reply_count) > 5:
                        print('回复次数大于5次，任务跳过')
                    else:
                        for _ in range(int(reply_count)):
                            for i in range(3):
                                result = self.reply(tid_match, fid_match, formhash)
                                if result:
                                    break
                                time.sleep(10)
                            time.sleep(35)
                    print(f'已完成任务 《{task_name}》 回复指定文章要求')
                else:
                    response = self.session.get(f'https://bbs.3dmgame.com/{tables}')
                    result = re.findall(r'mod=redirect&tid=(\d+)&goto', response.text)
                    if len(result) > 0:
                        response = self.session.get(f'https://bbs.3dmgame.com/thread-{random.choice(result)}-1-1.html')
                        formhash = re.search(r'name="formhash" value="(\w+)"', response.text).group(1)
                        fid_match = re.search(r"fid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                        tid_match = re.search(r"tid\s*=\s*parseInt\('(\d+)'\)", response.text).group(1)
                        for _ in range(int(reply_count)):
                            for i in range(3):
                                result = self.reply(tid_match, fid_match, formhash)
                                if result:
                                    break
                                time.sleep(10)
                            time.sleep(35)
                    print(f'已完成任务 《{task_name}》 回复指定主题要求')
                response = self.session.get(f'https://bbs.3dmgame.com/home.php?mod=task&do=draw&id={task_id}')
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

    def reply(self, tid, fid, formhash):
        response = requests.get("https://www.mxnzp.com/api/jokes/list?page=1&app_id=vqohyieoq7qklmgp&app_secret=FCc9Uf0h1c0LNkqeLRolebStTGfds3Fx")
        response_json = response.json()
        if response_json['code'] == 1 :
            message = response_json['data']['list'][0]['content']
        else:
            message = '我是新玩家，搞不懂' + random.choice(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'])
        data = {
            'file': '',
            'message': message,
            'posttime': str(int(time.time())),
            'formhash': formhash,
            'usesig': '1',
            'subject': '  ',
        }
        response = self.session.post(f'https://bbs.3dmgame.com/forum.php?mod=post&action=reply&fid={fid}&tid={tid}&extra=page%3D1&replysubmit=yes&infloat=yes&handlekey=fastpost&inajax=1', data=data)
        if '回复发布成功' in response.text:
            print('回帖成功,等待35秒后回复下个帖子')
            return True
        else:
            print('回复失败，未知原因')
            return False


    def main(self):
        self.user_info()
        print('-' * 50)
        print('开始做论坛任务-->>>>>>>>')
        self.check_task()
        task_list = self.check_task_doing()
        if task_list:
            for task in task_list:
                self.do_task(task)
        print('等待30秒进行下一个账号')
        self.session.close()
        print('*' * 50)
        time.sleep(30)
        Log('-' * 30)


if __name__ == '__main__':
    try:
        if 'bbs3dmck' in os.environ:
            bbs3dmck = re.split("@|&", os.environ.get("bbs3dmck"))
            print(f'查找到{len(bbs3dmck)}个账号\n')
        else:
            bbs3dmck = None
            print('无bbs3dmck变量')
            Log(f'\n未填入bbs3dmck变量')

        if bbs3dmck:
            z = 1
            for ck in bbs3dmck:
                print(f'登录第{z}个账号')
                threeDM = ThreeDMGame(ck)
                threeDM.main()
                z+= 1
    except Exception as e:
        print(e)
    try:
        send_notification_message(title='3dmgame论坛签到')  # 发送通知
    except Exception as e:
        print(e)
