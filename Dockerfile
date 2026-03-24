# build
FROM node:20-alpine AS build

ARG NUXT_PUBLIC_RECAPTCHA_SITE_KEY
ENV NUXT_PUBLIC_RECAPTCHA_SITE_KEY=$NUXT_PUBLIC_RECAPTCHA_SITE_KEY
ARG NUXT_PUBLIC_N8N_CHAT_WEBHOOK_PATH
ENV NUXT_PUBLIC_N8N_CHAT_WEBHOOK_PATH=$NUXT_PUBLIC_N8N_CHAT_WEBHOOK_PATH

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# serve
FROM nginx:1.27-alpine
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/.output/public /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s \
  CMD wget -qO- http://127.0.0.1/health || exit 1
CMD ["nginx", "-g", "daemon off;"]
