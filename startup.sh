#!/bin/bash
# Startup script for the API service

set -e  # Exit on any error

echo "Starting API service..."

# Wait for the database to be ready
echo "Waiting for database to be ready..."
python -c "
import time
import sys
from api import app, db

for attempt in range(60):  # Try for up to 5 minutes (60 attempts * 5 seconds)
    try:
        with app.app_context():
            db.session.execute(db.text('SELECT 1'))
        print('Database connection successful!')
        break
    except Exception as e:
        print(f'Database connection attempt {attempt + 1} failed: {e}')
        time.sleep(5)
else:
    print('Failed to connect to database after 5 minutes')
    sys.exit(1)

print('Creating database tables...')
with app.app_context():
    db.create_all()
print('Database tables created successfully!')
"

# Start the main application
echo "Starting Gunicorn server..."
exec gunicorn --bind 0.0.0.0:5000 --workers 2 --timeout 600 api:app