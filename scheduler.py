# scheduler.py
from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime
import json
import logging
import sys
import os

# Add the project root to the Python path so we can import our modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from scanner import TestSSLScanner
from rule_engine import evaluate_ssl_policy
from api import db, Application, Scan, Finding

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler('/tmp/scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class SSLScanScheduler:
    """
    Scheduler for automated SSL/TLS scans every 24 hours.
    """
    
    def __init__(self):
        self.scheduler = BlockingScheduler()
        self.scanner = TestSSLScanner()
        
    def scan_all_applications(self):
        """
        Scan all applications in the database.
        """
        logger.info("Starting scheduled scan of all applications")
        
        try:
            # Get all applications from the database
            applications = Application.query.all()
            
            if not applications:
                logger.info("No applications found to scan")
                return
            
            logger.info(f"Found {len(applications)} applications to scan")
            
            for app in applications:
                try:
                    logger.info(f"Scanning {app.url}")
                    
                    # Record scan start time
                    scan_start_time = datetime.utcnow()
                    
                    # Perform the scan
                    scan_results = self.scanner.scan_url(app.url)
                    scan_end_time = datetime.utcnow()
                    
                    # Evaluate the results
                    status, findings, detailed_info = evaluate_ssl_policy(scan_results)

                    # Create scan record
                    scan = Scan(
                        application_id=app.id,
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
                    
                    logger.info(f"Completed scan for {app.url} with status: {status.value}")
                    
                except Exception as e:
                    logger.error(f"Error scanning {app.url}: {str(e)}")
                    # Create a failed scan record
                    scan = Scan(
                        application_id=app.id,
                        status='FAIL',
                        started_at=datetime.utcnow(),
                        completed_at=datetime.utcnow()
                    )
                    db.session.add(scan)
                    db.session.flush()  # Get the scan ID for findings
                    db_finding = Finding(
                        scan_id=scan.id,
                        category='scan',
                        severity='FAIL',
                        name='SCAN_ERROR',
                        description=f'Scan failed: {str(e)}',
                        details=str(e)
                    )
                    db.session.add(db_finding)
            
            # Commit all changes to the database
            db.session.commit()
            logger.info("Scheduled scan completed for all applications")
            
        except Exception as e:
            logger.error(f"Error during scheduled scan: {str(e)}")
            db.session.rollback()
    
    def start(self):
        """
        Start the scheduler with a cron job for daily scans.
        By default, runs at 2:00 AM every day.
        """
        logger.info("Starting SSL scan scheduler")
        
        # Schedule the scan to run every day at 2:00 AM
        self.scheduler.add_job(
            self.scan_all_applications,
            CronTrigger(hour=2, minute=0),  # Daily at 2:00 AM
            id='daily_ssl_scan',
            name='Daily SSL/TLS scan of all applications',
            replace_existing=True
        )
        
        logger.info("Scheduler job added: Daily SSL scan at 2:00 AM")
        
        try:
            logger.info("Scheduler started. Waiting for jobs...")
            self.scheduler.start()
        except KeyboardInterrupt:
            logger.info("Scheduler interrupted by user")
            self.scheduler.shutdown()
    
    def add_application_scan(self, app_id):
        """
        Add a one-time scan for a specific application.
        """
        def scan_single_application():
            try:
                app = Application.query.get(app_id)
                if not app:
                    logger.error(f"Application with ID {app_id} not found")
                    return
                
                logger.info(f"Manually scanning {app.url}")
                
                scan_start_time = datetime.utcnow()
                scan_results = self.scanner.scan_url(app.url)
                scan_end_time = datetime.utcnow()
                
                status, findings, detailed_info = evaluate_ssl_policy(scan_results)

                scan = Scan(
                    application_id=app.id,
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
                db.session.flush()
                
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
                logger.info(f"Manual scan completed for {app.url}")
                
            except Exception as e:
                logger.error(f"Error in manual scan for app {app_id}: {str(e)}")
                db.session.rollback()
        
        # Add the job to run immediately
        self.scheduler.add_job(
            scan_single_application,
            'date',
            run_date=datetime.utcnow(),
            id=f'manual_scan_{app_id}_{datetime.utcnow().timestamp()}',
            replace_existing=True
        )

# Example usage
if __name__ == "__main__":
    # Import the app from api module to get the application context
    from api import app

    # Initialize the database
    with app.app_context():
        db.create_all()

    # Create and start the scheduler
    scheduler = SSLScanScheduler()
    scheduler.start()