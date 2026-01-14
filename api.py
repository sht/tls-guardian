from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from typing import Dict, List, Optional

# Initialize Flask app
app = Flask(__name__)

# Use environment variable for database URL or default to SQLite
DATABASE_URL = os.environ.get('DATABASE_URL') or 'sqlite:///ssl_monitor.db'
app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Database Models
class Application(db.Model):
    __tablename__ = 'applications'
    
    id = db.Column(db.Integer, primary_key=True)
    url = db.Column(db.String(255), nullable=False, unique=True)
    name = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    scans = db.relationship('Scan', backref='application', lazy=True, cascade='all, delete-orphan')

import json

class Scan(db.Model):
    __tablename__ = 'scans'

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(db.Integer, db.ForeignKey('applications.id'), nullable=False)
    status = db.Column(db.String(10), nullable=False)  # PASS, WARN, FAIL
    started_at = db.Column(db.DateTime, nullable=False)
    completed_at = db.Column(db.DateTime)
    raw_output_path = db.Column(db.String(500))  # Optional reference to raw JSON scan output
    detailed_ssl_info = db.Column(db.Text)  # Store detailed SSL information as JSON

    findings = db.relationship('Finding', backref='scan', lazy=True, cascade='all, delete-orphan')

class Finding(db.Model):
    __tablename__ = 'findings'
    
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey('scans.id'), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # protocol, cipher, certificate, configuration
    severity = db.Column(db.String(10), nullable=False)  # FAIL, WARN, INFO
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    details = db.Column(db.Text)  # Additional details about the finding

# API Routes
@app.route('/api/applications', methods=['GET'])
def get_applications():
    """
    Get all applications with their latest scan status.
    Returns a list of applications with PASS/WARN/FAIL status.
    """
    from sqlalchemy import func

    # Subquery to get the latest scan ID for each application
    latest_scan_subq = db.session.query(
        Scan.application_id,
        func.max(Scan.id).label('latest_scan_id')
    ).group_by(Scan.application_id).subquery()

    # Join applications with their latest scan and count findings
    applications = db.session.query(
        Application.id,
        Application.url,
        Application.name,
        Scan.status,
        Scan.completed_at.label('last_scan_time'),
        func.count(Finding.id).label('issue_count')
    ).outerjoin(
        latest_scan_subq,
        Application.id == latest_scan_subq.c.application_id
    ).outerjoin(
        Scan,
        Scan.id == latest_scan_subq.c.latest_scan_id
    ).outerjoin(
        Finding,
        Finding.scan_id == Scan.id
    ).group_by(
        Application.id,
        Application.url,
        Application.name,
        Scan.status,
        Scan.completed_at
    ).all()

    result = []
    for app in applications:
        result.append({
            'id': app.id,
            'url': app.url,
            'name': app.name or app.url,
            'status': app.status or 'UNKNOWN',
            'last_scan_time': app.last_scan_time.isoformat() if app.last_scan_time else None,
            'issue_count': app.issue_count or 0
        })

    return jsonify(result)

@app.route('/api/applications/<int:app_id>', methods=['GET'])
def get_application_detail(app_id):
    """
    Get detailed information for a specific application.
    Includes scan history and findings.
    """
    application = Application.query.get_or_404(app_id)

    # Get the latest scan for this application
    latest_scan = Scan.query.filter_by(application_id=app_id).order_by(Scan.completed_at.desc()).first()

    if not latest_scan:
        return jsonify({
            'id': application.id,
            'url': application.url,
            'name': application.name or application.url,
            'status': 'UNKNOWN',
            'last_scan_time': None,
            'findings': [],
            'detailed_ssl_info': {},
            'scan_history': []
        })

    # Get findings for the latest scan
    findings = Finding.query.filter_by(scan_id=latest_scan.id).all()

    # Get recent scan history (last 10 scans)
    scan_history = Scan.query.filter_by(application_id=app_id).order_by(Scan.completed_at.desc()).limit(10).all()

    # Parse detailed SSL info if available
    detailed_ssl_info = {}
    if latest_scan.detailed_ssl_info:
        try:
            detailed_ssl_info = json.loads(latest_scan.detailed_ssl_info)
        except json.JSONDecodeError:
            detailed_ssl_info = {}

    return jsonify({
        'id': application.id,
        'url': application.url,
        'name': application.name or application.url,
        'status': latest_scan.status,
        'last_scan_time': latest_scan.completed_at.isoformat() if latest_scan.completed_at else None,
        'findings': [
            {
                'category': f.category,
                'severity': f.severity,
                'name': f.name,
                'description': f.description,
                'details': f.details
            } for f in findings
        ],
        'detailed_ssl_info': detailed_ssl_info,
        'scan_history': [
            {
                'id': scan.id,
                'status': scan.status,
                'started_at': scan.started_at.isoformat(),
                'completed_at': scan.completed_at.isoformat() if scan.completed_at else None
            } for scan in scan_history
        ]
    })

@app.route('/api/applications', methods=['POST'])
def add_application():
    """
    Add a new application to be monitored.
    """
    data = request.get_json()
    
    if not data or 'url' not in data:
        return jsonify({'error': 'URL is required'}), 400
    
    # Check if application already exists
    existing_app = Application.query.filter_by(url=data['url']).first()
    if existing_app:
        return jsonify({'error': 'Application already exists'}), 409
    
    # Create new application
    application = Application(
        url=data['url'],
        name=data.get('name', data['url'])
    )
    
    db.session.add(application)
    db.session.commit()
    
    return jsonify({
        'id': application.id,
        'url': application.url,
        'name': application.name
    }), 201

@app.route('/api/applications/<int:app_id>', methods=['PUT'])
def update_application(app_id):
    """
    Update an application's details (currently just name).
    """
    application = Application.query.get_or_404(app_id)
    data = request.get_json()

    try:
        if 'name' in data:
            application.name = data['name']
            application.updated_at = datetime.utcnow()

        db.session.commit()
        return jsonify({
            'id': application.id,
            'name': application.name,
            'url': application.url
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to update application: {str(e)}'}), 500


@app.route('/api/applications/<int:app_id>', methods=['DELETE'])
def delete_application(app_id):
    """
    Delete an application from monitoring.
    """
    application = Application.query.get_or_404(app_id)

    try:
        # Get all scans for this application
        scans = Scan.query.filter_by(application_id=app_id).all()

        # Delete all findings associated with these scans first
        for scan in scans:
            Finding.query.filter_by(scan_id=scan.id).delete()

        # Now delete the scans
        Scan.query.filter_by(application_id=app_id).delete()

        # Finally delete the application
        db.session.delete(application)
        db.session.commit()

        return jsonify({'message': 'Application deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Failed to delete application: {str(e)}'}), 500

@app.route('/api/scan/<int:app_id>', methods=['POST'])
def trigger_scan(app_id):
    """
    Manually trigger a scan for a specific application (runs asynchronously).
    """
    from scanner import TestSSLScanner
    from rule_engine import evaluate_ssl_policy
    import threading

    application = Application.query.get_or_404(app_id)

    def run_scan_async():
        with app.app_context():  # Ensure Flask application context is available
            try:
                # Initialize scanner
                scanner = TestSSLScanner()

                # Perform scan
                scan_start_time = datetime.utcnow()
                scan_results = scanner.scan_url(application.url)
                scan_end_time = datetime.utcnow()

                # Evaluate results using rule engine
                status, findings, detailed_info = evaluate_ssl_policy(scan_results)

                # Create scan record
                scan = Scan(
                    application_id=app_id,
                    status=status.value,
                    started_at=scan_start_time,
                    completed_at=scan_end_time,
                    detailed_ssl_info=json.dumps({
                        'protocol_info': detailed_info.protocol_info,
                        'cipher_info': detailed_info.cipher_info,
                        'certificate_info': detailed_info.certificate_info,
                        'vulnerabilities': detailed_info.vulnerabilities,
                        'handshake_simulation': detailed_info.handshake_simulation,
                        'misc_info': detailed_info.misc_info
                    })
                )

                db.session.add(scan)
                db.session.flush()  # Get the scan ID for findings

                # Create finding records
                for finding in findings:
                    db_finding = Finding(
                        scan_id=scan.id,
                        category=finding.category,
                        severity=finding.severity.value,
                        name=finding.name,
                        description=finding.description,
                        details=finding.details
                    )
                    db.session.add(db_finding)

                db.session.commit()
                print(f"Scan completed for {application.url} with status: {status.value}")

            except Exception as e:
                db.session.rollback()
                print(f"Error during scan of {application.url}: {str(e)}")

    # Start the scan in a background thread
    scan_thread = threading.Thread(target=run_scan_async)
    scan_thread.daemon = True
    scan_thread.start()

    return jsonify({
        'message': 'Scan initiated successfully',
        'application_id': app_id,
        'url': application.url
    })

@app.route('/api/summary', methods=['GET'])
def get_summary():
    """
    Get a summary of all applications by status.
    """
    from sqlalchemy import func

    # Subquery to get the latest scan for each application
    latest_scan_subq = db.session.query(
        Scan.application_id,
        func.max(Scan.id).label('latest_scan_id')
    ).group_by(Scan.application_id).subquery()

    # Count applications by their latest scan status
    status_counts = db.session.query(
        Scan.status,
        func.count(Application.id)
    ).select_from(Application).outerjoin(
        latest_scan_subq,
        Application.id == latest_scan_subq.c.application_id
    ).outerjoin(
        Scan,
        Scan.id == latest_scan_subq.c.latest_scan_id
    ).group_by(Scan.status).all()
    
    # Calculate total applications
    total_apps = Application.query.count()
    
    # Format counts
    counts = {status: count for status, count in status_counts if status}
    counts['TOTAL'] = total_apps
    counts['UNKNOWN'] = counts.get('UNKNOWN', 0) + (total_apps - sum(count for _, count in status_counts if count))
    
    # Calculate last scan time for the entire system
    latest_scan = db.session.query(db.func.max(Scan.completed_at)).scalar()
    
    return jsonify({
        'total_applications': total_apps,
        'status_counts': counts,
        'last_scan_time': latest_scan.isoformat() if latest_scan else None
    })

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=False, host='0.0.0.0', port=5000)