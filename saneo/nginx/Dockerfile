FROM nginx:alpine

# Copier la configuration personnalisée
COPY nginx.conf /etc/nginx/nginx.conf

# Exposition du port
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
