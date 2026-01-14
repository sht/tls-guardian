"""
Configuration for the SSL monitoring tool.
"""

import os
from datetime import timedelta

class Config:
    # Database configuration
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///ssl_monitor.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Scheduler configuration
    SCHEDULER_TIMEZONE = 'UTC'
    
    # Scan configuration
    SCAN_TIMEOUT = 300  # 5 minutes timeout for each scan
    SCAN_TIME_OF_DAY = 2  # Hour of day to run daily scans (2 AM UTC)
    
    # Application configuration
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-for-ssl-monitor'
    
    # testssl.sh path
    TESTSSL_PATH = os.environ.get('TESTSSL_PATH') or '/usr/local/bin/testssl.sh'