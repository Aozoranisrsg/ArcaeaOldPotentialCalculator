# Arcaea旧版潜力值计算器

感觉还是对旧版潜力值比较有概念，所以用AI搓了一个网页小工具，可以上传Arcaea成绩文件（CSV）计算旧版潜力值（b30）。

[在线使用](https://aozoranisrsg.github.io/ArcaeaOldPotentialCalculator/)

## 获取成绩文件

有两种方法获取成绩文件。

本质上都是用Yurisaki机器人的功能，所以在此之前你需要完成如下操作：

1. 绑定Yurisaki机器人：在群聊里@Yurisaki发送/a bind xxxxxxxxx，将其中的xxxxxxxxx替换为你的Arcaea好友码。或者私聊发送指令也可以。
2. 声明账号所有权：对Yurisaki发送/a account claim（同样私聊也可以），随后Yurisaki会引导你完成如下操作：
    1. 切换搭档：打开游戏，把你的搭档和头像都切换为Yurisaki指定的头像（切换头像：先选择一个搭档，再点右边快速设置，点击四个格子里面顶上那个）（技能锁不锁没关系）
    2. 验证：对Yurisaki发送/a account check，等待验证。

然后可以通过以下两种方式获得成绩文件。

### Yurisaki聊天导出

对机器人发送/a export，获得一串地址，将其输入工具即可自动获取成绩并计算。
或者你也可以访问'u.yurisaki.top/你的地址'，会直接下载你的成绩文件，然后把里面的best_scores.csv导入工具即可。

### Yurisaki网站导出

打开Yurisaki网站：https://arcaea.yurisaki.top

初次打开需要登录，用户名就是你的Arcaea用户名或者你的好友码，密码对Yurisaki发送/a account otp获得（仅私聊使用，需要先声明账号所有权）

登录后网页左侧找到玩家数据，进入后等待加载完成，点击导出按钮即可。

获取的CSV文件有三项，需要用的是best_scores，文件内按单曲潜力值从高到低记录了所有分数不为0的谱面的最高成绩的详细信息。

以防有人想知道另外两个是什么：all_scores记录了所有分数不为0的谱面的所有推分记录（用Yurisaki查一次就记录一次，只有推分的会被记录），ratings记录了Yurisaki有记录的潜力值的变化（乘了10）
