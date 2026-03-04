#!/bin/bash
# 服务器一键更新脚本
# 用法：bash /www/wwwroot/two.edu.kg/update.sh
# 强制同步最新代码，不受本地修改影响，且保留 server.json / sessions / data

cd /www/wwwroot/two.edu.kg

echo "🔄 拉取最新代码..."
git fetch origin main
git reset --hard origin/main

echo "✅ 更新完成！"
