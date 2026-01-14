#!/usr/bin/env python3
"""
Script to run the SSL scan scheduler as a standalone service.
"""

import sys
import os
from pathlib import Path

# Add the project root to the Python path
project_root = Path(__file__).parent.absolute()
sys.path.insert(0, str(project_root))

from scheduler import SSLScanScheduler
from api import app, db

def main():
    # Initialize the database
    with app.app_context():
        db.create_all()
    
    # Create and start the scheduler
    scheduler = SSLScanScheduler()
    scheduler.start()

if __name__ == "__main__":
    main()