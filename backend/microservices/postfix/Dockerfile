FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && \
    apt-get install -y postfix opendkim opendkim-tools opendmarc && \
    rm -rf /var/lib/apt/lists/*

COPY microservices/postfix/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY configs/postfix/transport /etc/postfix/transport
COPY configs/postfix/sender_access /etc/postfix/sender_access
RUN postmap /etc/postfix/transport && \
    postmap /etc/postfix/sender_access

COPY configs/opendkim/opendkim.conf /etc/opendkim.conf
COPY configs/opendkim/TrustedHosts /etc/opendkim/TrustedHosts
COPY configs/opendmarc/opendmarc.conf /etc/opendmarc.conf

ENTRYPOINT ["/entrypoint.sh"]
