FROM grafana/grafana:11.2.0

USER root

# Copy provisioning configuration and pre-built dashboards
COPY provisioning /etc/grafana/provisioning
# Outside /var/lib/grafana: GRAFANA_DATA_DIR is bind-mounted there and would hide them
COPY dashboards /etc/grafana/dashboards

# Ensure permissions
RUN chown -R grafana:root /etc/grafana/provisioning /etc/grafana/dashboards && \
    chmod -R 755 /etc/grafana/dashboards

USER grafana

EXPOSE 3000
