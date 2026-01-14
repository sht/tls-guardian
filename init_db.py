"""
Script to initialize the database with the correct schema.
"""
from api import app, db

def init_database():
    with app.app_context():
        # Drop all existing tables
        db.drop_all()
        
        # Create all tables with the updated schema
        db.create_all()
        
        print("Database initialized with the correct schema!")

if __name__ == "__main__":
    init_database()