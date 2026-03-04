# 个人邮局 · Personal Post Office

一个苹果官网风格的个人邮件客户端，支持对接宝塔邮局管理器，也可以在无服务器环境下以演示模式运行。

---

## 功能特性

- 收件箱、已发送、回收站、地址簿
- 写信、回复、删除（移入回收站）、恢复、永久删除
- 对接宝塔邮局（IMAP/SMTP），发信自动保存到 Sent 文件夹
- 无服务器时自动进入演示模式（数据存 localStorage）

---

## 部署方式

### 方式一：演示模式（无需服务器）

直接用浏览器打开 `dist/index.html` 即可，填写任意邮箱和密码即可登录，数据保存在浏览器 localStorage 中。

> 演示模式下无法真实收发邮件，仅用于体验界面。

---

### 方式二：宝塔面板 + PHP（完整功能）

#### 环境要求

- 宝塔面板（推荐 8.x）
- PHP 7.4 或以上，需开启 `imap` 扩展
- 宝塔邮局管理器（已配置好域名邮箱）
- 已申请好的邮箱账号（如 `user@yourdomain.com`）

#### 部署步骤

**1. 克隆仓库到网站目录**

```bash
cd /www/wwwroot
git clone https://github.com/3281341052g-bot/personal-post-office yourdomain.com
```

**2. 宝塔面板添加站点**

- 域名填写你的域名（如 `mail.yourdomain.com`）
- 根目录指向 `/www/wwwroot/yourdomain.com/dist`
- PHP 版本选 7.4 或 8.x

**3. 开启 PHP imap 扩展**

宝塔面板 → 软件商店 → PHP → 设置 → 安装扩展 → 勾选 `imap` → 安装。

**4. 配置邮件服务器**

在 `dist/api/` 目录下创建 `server.json`（此文件已被 `.gitignore` 忽略，不会上传到仓库）：

```json
{
  "host": "mail.yourdomain.com",
  "smtpPort": 465,
  "imapPort": 993,
  "ssl": true
}
```

> `host` 填写宝塔邮局的 IMAP/SMTP 服务器地址，通常与你的邮件域名相同。

**5. 配置目录权限**

```bash
cd /www/wwwroot/yourdomain.com/dist/api
mkdir -p sessions data
chmod 755 sessions data
chown -R www:www sessions data
```

**6. 配置 Nginx 伪静态（可选）**

宝塔面板 → 站点设置 → 伪静态，添加：

```nginx
location /api/ {
    try_files $uri $uri/ =404;
}
```

**7. 访问网站**

打开浏览器访问你的域名，登录页面会自动检测服务器配置。

- 已配置 `server.json` → 显示「邮件服务器已就绪」
- 未配置 → 显示「演示模式」

用你在宝塔邮局创建的邮箱账号（如 `user@yourdomain.com`）和密码登录即可。

---

### 方式三：Git 自动部署（推荐用于持续更新）

网站根目录有 `update.sh`，服务器上每次更新只需一条命令：

```bash
bash /www/wwwroot/yourdomain.com/update.sh
```

脚本会从 GitHub 拉取最新代码，并保留本地的 `server.json`、`sessions/`、`data/` 目录不被覆盖。

---

## 目录结构

```
dist/
├── index.html          # 登录页
├── app.html            # 主应用
├── styles/             # 样式文件
├── js/
│   ├── api.js          # 前端 API 封装
│   ├── store.js        # 状态管理
│   ├── router.js       # 路由
│   └── views/          # 各页面视图
└── api/                # PHP 后端
    ├── login.php       # 登录接口
    ├── messages.php    # 邮件增删改查
    ├── send.php        # 发信
    ├── contacts.php    # 联系人
    ├── server-config.php  # 服务器配置
    ├── _imap.php       # IMAP 封装
    ├── _smtp.php       # SMTP 封装
    ├── _helper.php     # 公共函数
    ├── server.json     # 服务器配置（需手动创建，不在仓库中）
    ├── sessions/       # 登录会话（需手动创建）
    └── data/           # 本地数据（需手动创建）
```

---

## 常见问题

**Q: 登录后收件箱没有邮件？**
A: 检查 `server.json` 中 `host`、`imapPort`、`ssl` 是否正确，并确认 PHP imap 扩展已启用。

**Q: 发信成功但「已发送」为空？**
A: 检查 IMAP 扩展是否已开启，发信会自动通过 `imap_append` 存入 Sent 文件夹。

**Q: 提示「演示模式」但我已经配置了 server.json？**
A: 确认文件放在 `dist/api/server.json`，且 `host` 字段不为空，PHP 有读取该文件的权限。

**Q: 如何修改主题色或侧边栏宽度？**
A: 登录后进入「设置 → 外观」即可调整。
