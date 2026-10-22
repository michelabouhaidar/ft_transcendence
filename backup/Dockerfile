FROM alpine:3.22

RUN apk add --no-cache postgresql17-client tzdata
COPY common.sh entrypoint.sh backup.sh restore.sh verify.sh list.sh healthcheck.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/*.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]