#!/bin/zsh
set -e

export PATH="$HOME/.local/bin:$PATH"
cd "$(dirname "$0")"

echo "==> 检查 GitHub 登录状态..."
if ! gh auth status 2>/dev/null; then
  echo ""
  echo "请先登录 GitHub："
  gh auth login --hostname github.com --git-protocol https --web
fi

OWNER="$(gh api user --jq .login)"
REPO="her"
REMOTE="https://github.com/${OWNER}/${REPO}.git"

echo ""
echo "==> 创建仓库 ${OWNER}/${REPO} 并推送..."
git remote set-url origin "$REMOTE" 2>/dev/null || git remote add origin "$REMOTE"

if gh repo view "${OWNER}/${REPO}" >/dev/null 2>&1; then
  echo "仓库已存在，直接推送..."
  git push -u origin main
else
  gh repo create "$REPO" --public --source=. --remote=origin --push
fi

echo ""
echo "==> 启用 GitHub Pages..."
gh api -X PUT "repos/${OWNER}/${REPO}/pages" \
  -f build_type=workflow >/dev/null 2>&1 || true

echo ""
echo "完成！"
echo "  仓库地址: https://github.com/${OWNER}/${REPO}"
echo "  Pages 地址: https://${OWNER}.github.io/${REPO}/"
echo ""
echo "推送后 Actions 会自动部署，约 1-2 分钟可在 Pages 地址访问。"
