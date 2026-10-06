FROM prom/prometheus:v2.54.1

# Copy configuration and alerting rules into standard prometheus paths
COPY prometheus.yml /etc/prometheus/prometheus.yml
COPY alert.rules.yml /etc/prometheus/alert.rules.yml

EXPOSE 9090
