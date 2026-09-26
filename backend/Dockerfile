FROM node:20-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .
RUN chmod +x docker-entrypoint.sh && mkdir -p uploads

EXPOSE 5060
HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD node -e "require('http').get('http://127.0.0.1:5060/api/health',(r)=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

ENTRYPOINT ["./docker-entrypoint.sh"]
