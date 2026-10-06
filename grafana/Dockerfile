FROM grafana/grafana:11.2.0

USER root

# Copy provisioning configuration and pre-built dashboards
COPY provisioning /etc/grafana/provisioning
COPY dashboards /var/lib/grafana/dashboards

# Ensure permissions
RUN chown -R grafana:root /etc/grafana/provisioning /var/lib/grafana/dashboards && \
    chmod -R 755 /var/lib/grafana/dashboards

USER grafana

EXPOSE 3000
