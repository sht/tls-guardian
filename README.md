# SSL Hygiene Monitor - Deployment Guide

This guide provides instructions for deploying the SSL Hygiene Monitor, a self-hosted tool for monitoring SSL/TLS security posture of internal/external web applications. This tool is based on [testssl.sh](https://github.com/testssl/testssl.sh) for SSL/TLS scanning capabilities.

## Prerequisites

- Docker and Docker Compose installed
- At least 2GB of RAM available
- Access to target URLs for scanning
- Port 3000, 5000, and 5432 available (or configure custom ports)

## Quick Start

1. Clone the repository:
```bash
git clone <repository-url>
cd ssl-monitor
```

2. Build and start the services:
```bash
docker-compose up -d
```

3. Access the dashboard:
   - Frontend: http://localhost:3000
   - API: http://localhost:5000/api/applications

4. Add your first application via the web interface or API

## Configuration

### Environment Variables

The application can be configured using environment variables in a `.env` file:

```bash
# Database configuration
DATABASE_URL=postgresql://ssl_user:ssl_password@db:5432/ssl_monitor

# Timezone for scheduler (default: UTC)
TZ=UTC

# Scan timeout in seconds (default: 300)
SCAN_TIMEOUT=300

# Hour of day to run daily scans (default: 2 for 2 AM UTC)
SCAN_TIME_OF_DAY=2
```

### Adding Applications

Applications can be added via the web dashboard or using the API:

```bash
curl -X POST http://localhost:5000/api/applications \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "name": "Example Application"}'
```

## Architecture Overview

The system follows a layered architecture with these components:

1. **Scanner Layer**: Uses testssl.sh to perform SSL/TLS scans
2. **Policy/Rule Evaluation Layer**: A dedicated rule engine that evaluates scan results against defined security policies
3. **Storage Layer**: Database (PostgreSQL) that stores application data, scan results, and findings
4. **API Server**: Provides REST API for dashboard and manages scan requests
5. **Scheduler**: Runs automated scans every 24 hours
6. **Frontend**: Web dashboard for monitoring SSL posture

## SSL Policy Rules

The system evaluates SSL configurations against these opinionated rules using a dedicated rule engine:

### FAIL Conditions
- TLS 1.0 or TLS 1.1 is enabled
- Any weak cipher is enabled (e.g. RC4, 3DES, CBC-based suites)
- RSA key length < 2048 bits
- Certificate is expired or invalid

### WARN Conditions
- TLS 1.3 is not enabled
- OCSP stapling is missing
- Certificate expires in < 30 days

### PASS Conditions
- Only modern protocols and strong ciphers are enabled
- Certificate is valid and sufficiently strong

## Detailed SSL Information

The system provides comprehensive SSL information similar to SSL Labs:

### Protocol Information
- TLS version support (1.0, 1.1, 1.2, 1.3)
- SSL version support (2.0, 3.0)
- ALPN/HTTP2 support
- QUIC support

### Cipher Information
- Cipher suite strength and security
- 3DES/IDEA cipher support
- Export-grade cipher detection
- Low-strength cipher detection
- NULL cipher detection
- Obsolete cipher detection
- Strong cipher with/without forward secrecy

### Certificate Information
- Certificate validity and expiration
- Key size and algorithm
- Signature algorithm
- Subject and issuer information
- Alternative names
- OCSP stapling status

### Vulnerability Information
- Heartbleed vulnerability
- CCS injection vulnerability
- Ticketbleed vulnerability
- ROBOT vulnerability
- CRIME/TLS vulnerability
- BREACH vulnerability
- POODLE vulnerability
- FREAK vulnerability
- Logjam vulnerability
- DROWN vulnerability
- BEAST vulnerability
- LUCKY13 vulnerability

### Handshake Simulation
- Client compatibility testing
- Browser simulation results
- TLS negotiation details

## Maintenance

### Backup Database

```bash
docker exec ssl_monitor_db pg_dump -U ssl_user ssl_monitor > backup.sql
```

### View Logs

```bash
# API logs
docker logs ssl_monitor_api

# Scheduler logs
docker logs ssl_monitor_scheduler

# Database logs
docker logs ssl_monitor_db
```

### Manual Scan

Trigger a manual scan for a specific application:

```bash
curl -X POST http://localhost:5000/api/scan/{application_id}
```

### Updating the System

1. Pull the latest changes:
```bash
git pull origin main
```

2. Rebuild and restart:
```bash
docker-compose down
docker-compose build
docker-compose up -d
```

## Troubleshooting

### Common Issues

1. **Permission Errors**: Ensure Docker has access to required directories
2. **Connection Timeouts**: Check firewall settings for ports 3000, 5000, 5432
3. **Scan Failures**: Verify target URLs are accessible from the container

### Debugging Scans

Check scheduler logs for scan errors:
```bash
docker logs ssl_monitor_scheduler
```

### Resource Usage

Monitor resource usage:
```bash
docker stats
```

## Security Considerations

- The dashboard is intended for internal use only
- Applications are scanned from the container's network perspective
- Raw scan outputs are stored locally and should be protected
- Regular updates of base images are recommended

## Scaling

For larger deployments:
- Increase worker count in gunicorn configuration
- Use external PostgreSQL instance
- Add load balancing for frontend
- Consider distributed scanning for many targets

## Uninstall

To remove all containers and data:

```bash
docker-compose down -v
```

Note: This will permanently delete all scan data.

## Support

For issues or questions:
- Check the logs first
- Verify network connectivity to target URLs
- Ensure sufficient system resources
- Consult the documentation for configuration options