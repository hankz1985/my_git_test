FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY index.html /usr/share/nginx/html/index.html
COPY styles.css /usr/share/nginx/html/styles.css
COPY script.js /usr/share/nginx/html/script.js
COPY meme.png /usr/share/nginx/html/meme.png
COPY doubao-bg.png /usr/share/nginx/html/doubao-bg.png

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
