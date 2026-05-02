# 自己去问 AI

一个纯前端静态页面：把问题做成分享链接，对方打开后可以复制问题，再去豆包自己提问。

## 本地直接打开

直接打开 [index.html](/C:/Users/19851/Documents/New%20project%205/index.html) 即可。

注意：
`file://` 环境下部分浏览器会限制自动复制，所以更推荐用本地 HTTP 或公网访问来测试。

## Docker 部署

### 1. 构建镜像

```bash
docker build -t ask-doubao .
```

### 2. 启动容器

```bash
docker run -d --name ask-doubao -p 8080:80 ask-doubao
```

启动后访问：

```text
http://你的服务器IP:8080
```

## 如果你有域名

把域名解析到你的服务器，然后用 Nginx / Caddy / 宝塔反代到这个容器端口，例如 `8080`。

最后你的访问地址就会变成：

```text
https://你的域名/?q=为什么不问豆包啊
```

## 推荐公网部署方式

如果只是娱乐项目，最简单的是：

1. 云服务器装 Docker
2. 把这个项目传上去
3. `docker build`
4. `docker run -p 8080:80`
5. 用现有 Nginx 或宝塔把域名反代到 `8080`

## 目录

- `index.html` 页面结构
- `styles.css` 页面样式
- `script.js` 页面逻辑
- `Dockerfile` 容器构建文件
- `nginx.conf` 容器内静态站点配置
