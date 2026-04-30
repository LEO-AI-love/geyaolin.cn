# Personal Portfolio

这是一个基于 `https://onechang.vercel.app/` 视觉方向重做的个人网站模板：暗色背景、金色点缀、动态首屏、作品筛选、关于、技能、联系和中英文切换。

## 怎么改成你自己的

主要改 `content.js`：

- `profile.brand`：左上角标识
- `profile.email` / `profile.wechat`：联系方式
- `zh` / `en`：中英文文案
- `projects`：作品卡片、年份、标签、角色、强调色

## 怎么预览

直接双击 `index.html`，或在浏览器里打开它即可。

## 发布

这个站点适合直接发布到 GitHub Pages。根目录已经包含：

- `CNAME`：绑定自定义域名 `geyaolin.cn`
- `.nojekyll`：让 GitHub Pages 按静态文件原样发布

## 文件说明

- `index.html`：页面结构
- `styles.css`：视觉样式与响应式布局
- `content.js`：你的个人内容配置
- `script.js`：双语切换、打字机、作品筛选、复制联系信息、首屏动画
