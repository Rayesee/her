#!/bin/zsh
set -e

export PATH="$HOME/.local/bin:$PATH"
cd "$(dirname "$0")"

echo "==> 检查 GitHub 登录状态..."
if ! gh auth status 2>/dev/null; then
  echo ""
  echo "请先登录 GitHub（浏览器用 www3407@126.com 对应账号授权）："
  gh auth login --hostname github.com --git-protocol https --web
fi

echo ""
echo "==> 创建仓库 her 并推送..."
git remote set-url origin https://github.com/muzirui/her.git 2>/dev/null || true

if gh repo view muzirui/her >/dev/null 2>&1; then
  echo "仓库已存在，直接推送..."
  git push -u origin main
else
  gh repo create her --public --source=. --remote=origin --push
fi

echo ""
echo "完成！仓库地址: https://github.com/muzirui/her"
