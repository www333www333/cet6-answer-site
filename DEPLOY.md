# 公网部署说明

这个网站是纯静态站，上传整个 `cet6-answer-site` 文件夹即可公网访问。

## 最快方式：Netlify Drop

1. 打开 `https://app.netlify.com/drop`。
2. 把 `cet6-answer-site-deploy.zip` 解压后的整个文件夹拖进去。
3. 等待上传完成，Netlify 会给你一个 `https://...netlify.app` 网址。
4. 手机上打开这个网址，然后用浏览器的“添加到主屏幕”保存成图标。

## GitHub Pages

### 一键脚本

先让 GitHub CLI 登录：

```powershell
gh auth login
```

然后运行：

```powershell
cd "C:\Users\王泳伟\Documents\New project\cet6-answer-site"
.\publish-github.ps1
```

脚本会创建或更新 `cet6-answer-site` 仓库，并把 GitHub Pages 指向 `main` 分支根目录。

### 网页手动方式

1. 新建一个 GitHub 仓库。
2. 上传 `cet6-answer-site` 文件夹里的所有文件到仓库根目录。
3. 进入仓库 `Settings` -> `Pages`。
4. Source 选择 `Deploy from a branch`，Branch 选择 `main` 和 `/root`。
5. 保存后等待几分钟，会得到 `https://用户名.github.io/仓库名/`。

## 手机使用

- iPhone Safari：打开网址 -> 分享 -> 添加到主屏幕。
- Android Chrome/Edge：打开网址 -> 菜单 -> 添加到主屏幕。

第一次打开后，网站外壳会缓存到手机；但外部真题/答案 PDF 链接仍需要联网访问。
