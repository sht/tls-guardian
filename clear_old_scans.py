#!/usr/bin/env python3
"""
Script to clear old scan results from the database so that fresh scans 
with the corrected rule engine can be performed.
"""
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def clear_old_scans():
    """Clear all old scan results from the database."""
    # Import here to avoid issues if dependencies aren't installed
    try:
        from api import db, Application, Scan, Finding
        from flask import Flask
        from flask_sqlalchemy import SQLAlchemy
        
        # Create a minimal Flask app to work with the database
        app = Flask(__name__)
        DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///tls_guardian.db'
        app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
        app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
        
        with app.app_context():
            # Count existing scans before clearing
            scan_count_before = Scan.query.count()
            finding_count_before = Finding.query.count()
            
            print(f"Before cleanup: {scan_count_before} scans, {finding_count_before} findings")
            
            # Delete all findings first (due to foreign key constraint)
            Finding.query.delete()
            
            # Delete all scans
            Scan.query.delete()
            
            # Commit the changes
            db.session.commit()
            
            # Count after clearing
            scan_count_after = Scan.query.count()
            finding_count_after = Finding.query.count()
            
            print(f"After cleanup: {scan_count_after} scans, {finding_count_after} findings")
            print("Old scan results have been cleared successfully!")
            print("Please restart your Docker services and run a fresh scan.")
            
    except ImportError as e:
        print(f"Missing dependencies: {e}")
        print("Please install the required packages with: pip install -r requirements.txt")
        return False
    except Exception as e:
        print(f"Error clearing old scans: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    print("Clearing old scan results to apply the TLS 1.3 detection fix...")
    success = clear_old_scans()
    if success:
        print("\nThe old scan results have been cleared.")
        print("Please restart your Docker services and trigger a fresh scan to see the fix in effect.")
    else:
        print("\nFailed to clear old scan results.")