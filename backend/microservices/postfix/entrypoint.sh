#!/bin/bash
set -e

KEYDIR=/etc/opendkim/keys/e-smail.ru

if [ ! -f "$KEYDIR/mail.private" ]; then
    echo "FATAL: DKIM key not found at $KEYDIR/mail.private" >&2
    exit 1
fi

chown -R opendkim:opendkim /etc/opendkim
chmod 600 "$KEYDIR/mail.private"

mkdir -p /run/opendkim /run/opendmarc
chown opendkim:opendkim /run/opendkim
chown opendmarc:opendmarc /run/opendmarc

opendkim  -x /etc/opendkim.conf
opendmarc -c /etc/opendmarc.conf

exec postfix start-fg
