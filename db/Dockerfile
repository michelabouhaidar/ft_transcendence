FROM postgres:17-alpine

# PostgreSQL 17 Database Service
COPY postgresql.conf /usr/local/share/postgresql/postgresql.conf.sample

# Copy database initialization SQL scripts into PostgreSQL entrypoint hook
COPY init.sql /docker-entrypoint-initdb.d/01-init.sql
