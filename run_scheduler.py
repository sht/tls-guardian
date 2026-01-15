#!/usr/bin/env python3
"""
Script to run the SSL scan scheduler as a standalone service.
"""

import sys
import os
import time
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

from scheduler import SSLScanScheduler
from api import app, db

def wait_for_db(max_retries=30, delay=2):
    """
    Wait for the database to become available by attempting to connect repeatedly.

    Args:
        max_retries: Maximum number of connection attempts
        delay: Delay in seconds between attempts
    """
    for attempt in range(max_retries):
        try:
            with app.app_context():
                # Try to establish a connection to the database
                db.session.execute(db.text('SELECT 1'))
                print(f"Database connection successful on attempt {attempt + 1}")
                return True
        except Exception as e:
            print(f"Database connection attempt {attempt + 1} failed: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {delay} seconds...")
                time.sleep(delay)
            else:
                print("Max retries reached. Database connection failed.")
                return False
    return False

def main():
    # Wait for database to be ready before proceeding
    if wait_for_db():
        # Initialize the database
        with app.app_context():
            db.create_all()

        # Create and start the scheduler
        scheduler = SSLScanScheduler()
        scheduler.start()
    else:
        print("Failed to connect to database after multiple attempts. Exiting.")
        exit(1)

if __name__ == "__main__":
    main()