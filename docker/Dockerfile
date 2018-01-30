FROM docker.io/centos:7

ENV NGINX_VERSION 1.13.4-1.el7

ARG SRC_DIR="site"

LABEL name="nginxinc/nginx" \
      vendor="NGINX Inc." \
      version="${NGINX_VERSION}" \
      release="1" \
      summary="NGINX" \
      description="nginx will do ....."
### Required labels above - recommended below
LABEL url="https://www.nginx.com/" \
      io.k8s.display-name="NGINX" \
      io.openshift.expose-services="http:8080" \
      io.openshift.tags="nginx,nginxinc"

ADD nginx.repo /etc/yum.repos.d/nginx.repo

RUN curl -sO http://nginx.org/keys/nginx_signing.key && \
    rpm --import ./nginx_signing.key && \
    yum -y install --setopt=tsflags=nodocs nginx-${NGINX_VERSION}.ngx && \
    rm -f ./nginx_signing.key && \
    yum clean all

# forward request and error logs to docker log collector
# - Change pid file location & remove nginx user & change port to 8080
# - modify perms for non-root runtime
RUN ln -sf /dev/stdout /var/log/nginx/access.log && \
    ln -sf /dev/stderr /var/log/nginx/error.log && \
    sed -i 's/\/var\/run\/nginx.pid/\/var\/cache\/nginx\/nginx.pid/g' /etc/nginx/nginx.conf && \
    sed -i -e '/user/!b' -e '/nginx/!b' -e '/nginx/d' /etc/nginx/nginx.conf && \
    rm -f /etc/nginx/conf.d/default.conf && \
    chown -R 998 /var/cache/nginx /etc/nginx && \
    chmod -R g=u /var/cache/nginx /etc/nginx

#VOLUME ["/var/cache/nginx"]

EXPOSE 8080

# Add symbolic link to config.json to avoid mounting issues
RUN ln -sf /usr/share/nginx/html/config/config.json /usr/share/nginx/html/config.json

USER 998

COPY nginx.conf /etc/nginx/conf.d
COPY ${SRC_DIR} /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]