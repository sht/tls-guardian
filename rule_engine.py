from typing import Dict, List, Tuple
from dataclasses import dataclass
from enum import Enum

class Severity(Enum):
    FAIL = "FAIL"
    WARN = "WARN"
    PASS = "PASS"
    INFO = "INFO"

@dataclass
class Finding:
    category: str
    name: str
    description: str
    severity: Severity
    details: str = ""

@dataclass
class DetailedSSLInfo:
    """Detailed SSL information similar to SSL Labs"""
    protocol_info: Dict
    cipher_info: Dict
    certificate_info: Dict
    vulnerabilities: Dict
    handshake_simulation: Dict
    misc_info: Dict

def evaluate_ssl_policy(scan_results: Dict) -> Tuple[Severity, List[Finding], DetailedSSLInfo]:
    """
    Evaluate SSL/TLS scan results against defined security policies.

    Args:
        scan_results: Parsed JSON output from testssl.sh

    Returns:
        Tuple of (overall_status, list_of_findings, detailed_ssl_info)
    """
    findings = []

    # Check for FAIL conditions
    findings.extend(_check_fail_conditions(scan_results))

    # Check for WARN conditions
    findings.extend(_check_warn_conditions(scan_results))

    # Determine overall status based on highest severity finding
    if any(f.severity == Severity.FAIL for f in findings):
        overall_status = Severity.FAIL
    elif any(f.severity == Severity.WARN for f in findings):
        overall_status = Severity.WARN
    else:
        overall_status = Severity.PASS

    # Extract detailed SSL information
    detailed_info = extract_detailed_ssl_info(scan_results)

    return overall_status, findings, detailed_info

def _check_fail_conditions(scan_results: Dict) -> List[Finding]:
    """Check for conditions that result in FAIL status."""
    findings = []

    # Handle the case where scanResults is an array (when multiple IPs are tested)
    # Just use the first result for now
    if 'scanResult' in scan_results and isinstance(scan_results['scanResult'], list):
        if len(scan_results['scanResult']) > 0:
            scan_data = scan_results['scanResult'][0]
        else:
            scan_data = {}
    else:
        scan_data = scan_results

    # Check for TLS 1.0 or TLS 1.1 enabled
    protocols_list = scan_data.get('protocols', [])
    for protocol_entry in protocols_list:
        protocol_id = protocol_entry.get('id', 'unknown')
        if protocol_entry.get('finding') and ('TLS1_0' in protocol_id or 'TLS1_1' in protocol_id or 'TLS1' in protocol_id):
            if protocol_entry.get('severity') in ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']:
                findings.append(Finding(
                    category='protocol',
                    name=protocol_id.upper(),
                    description=f'{protocol_id.upper()} is enabled and considered insecure',
                    severity=Severity.FAIL
                ))
    
    # Check for weak ciphers (RC4, 3DES, CBC-based suites)
    # Look for cipher-related entries in the scan data
    for key, value in scan_data.items():
        if 'cipher' in key.lower() or 'encryption' in key.lower():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and item.get('severity') in ['HIGH', 'CRITICAL']:
                        if 'RC4' in item.get('finding', '') or '3DES' in item.get('finding', ''):
                            findings.append(Finding(
                                category='cipher',
                                name=item.get('id', key),
                                description=f'Weak cipher suite detected: {item.get("finding", "")}',
                                severity=Severity.FAIL
                            ))
            elif isinstance(value, dict) and value.get('severity') in ['HIGH', 'CRITICAL']:
                if 'RC4' in value.get('finding', '') or '3DES' in value.get('finding', ''):
                    findings.append(Finding(
                        category='cipher',
                        name=value.get('id', key),
                        description=f'Weak cipher suite detected: {value.get("finding", "")}',
                        severity=Severity.FAIL
                    ))

    # Check for RSA key length < 2048 bits
    # Look for certificate-related entries in the scan data
    for key, value in scan_data.items():
        if 'cert' in key.lower() and 'rsa' in key.lower():
            # Check if value is a dictionary before calling .get()
            if isinstance(value, dict) and value.get('severity') in ['HIGH', 'CRITICAL']:
                if 'keySize' in value.get('finding', '').lower() or '2048' not in value.get('finding', '2048'):
                    findings.append(Finding(
                        category='certificate',
                        name='CERT_KEY_SIZE',
                        description='Certificate RSA key length is less than 2048 bits',
                        severity=Severity.FAIL
                    ))

    # Check for certificate expiration or invalidity
    # Look for certificate validity entries in the scan data
    for key, value in scan_data.items():
        if 'cert' in key.lower() and 'valid' in key.lower():
            # Check if value is a dictionary before calling .get()
            if isinstance(value, dict) and value.get('severity') in ['HIGH', 'CRITICAL']:
                if 'expired' in value.get('finding', '').lower():
                    findings.append(Finding(
                        category='certificate',
                        name='CERT_EXPIRED',
                        description='Certificate is expired',
                        severity=Severity.FAIL
                    ))
                elif 'not valid' in value.get('finding', '').lower():
                    findings.append(Finding(
                        category='certificate',
                        name='CERT_INVALID',
                        description='Certificate is invalid',
                        severity=Severity.FAIL
                    ))

    return findings

def _check_warn_conditions(scan_results: Dict) -> List[Finding]:
    """Check for conditions that result in WARN status."""
    findings = []

    # Handle the case where scanResults is an array (when multiple IPs are tested)
    # Just use the first result for now
    if 'scanResult' in scan_results and isinstance(scan_results['scanResult'], list):
        if len(scan_results['scanResult']) > 0:
            scan_data = scan_results['scanResult'][0]
        else:
            scan_data = {}
    else:
        scan_data = scan_results

    # Check if TLS 1.3 is not enabled
    protocols_list = scan_data.get('protocols', [])
    tls_13_enabled = False
    for protocol_entry in protocols_list:
        protocol_id = protocol_entry.get('id', 'unknown')
        if 'TLS1_3' in protocol_id and protocol_entry.get('severity') == 'OK':
            tls_13_enabled = True
            break

    if not tls_13_enabled:
        findings.append(Finding(
            category='protocol',
            name='TLS_1.3_NOT_ENABLED',
            description='TLS 1.3 is not enabled',
            severity=Severity.WARN
        ))

    # Check for missing OCSP stapling
    # Look for OCSP stapling entries in the scan data
    for key, value in scan_data.items():
        if 'ocsp' in key.lower():
            # Check if value is a dictionary before calling .get()
            if isinstance(value, dict) and value.get('severity') in ['LOW', 'MEDIUM']:
                findings.append(Finding(
                    category='configuration',
                    name='OCSP_STAPLING_MISSING',
                    description='OCSP stapling is not configured',
                    severity=Severity.WARN
                ))

    # Check for certificate expiring in < 30 days
    # Look for certificate expiration entries in the scan data
    for key, value in scan_data.items():
        if 'cert' in key.lower() and 'expir' in key.lower():
            # Check if value is a dictionary before calling .get()
            if isinstance(value, dict) and value.get('severity') in ['MEDIUM', 'HIGH']:
                if 'days' in value.get('finding', ''):
                    days_str = value['finding']
                    # Extract days from string like "Certificate expires in 15 days"
                    import re
                    match = re.search(r'(\d+)', days_str)
                    if match and int(match.group(1)) < 30:
                        findings.append(Finding(
                            category='certificate',
                            name='CERT_EXPIRING_SOON',
                            description=f'Certificate expires in {match.group(1)} days (< 30 days)',
                            severity=Severity.WARN
                        ))

    return findings


def extract_detailed_ssl_info(scan_results: Dict) -> DetailedSSLInfo:
    """
    Extract detailed SSL information similar to SSL Labs for display purposes.

    Args:
        scan_results: Parsed JSON output from testssl.sh

    Returns:
        DetailedSSLInfo object with categorized information
    """
    # Handle the case where scanResults is an array (when multiple IPs are tested)
    # Just use the first result for now
    if 'scanResult' in scan_results and isinstance(scan_results['scanResult'], list):
        if len(scan_results['scanResult']) > 0:
            scan_data = scan_results['scanResult'][0]
        else:
            scan_data = {}
    else:
        scan_data = scan_results

    # Extract protocol information
    protocol_info = extract_protocol_info(scan_data)

    # Extract cipher information
    cipher_info = extract_cipher_info(scan_data)

    # Extract certificate information
    certificate_info = extract_certificate_info(scan_data)

    # Extract vulnerability information
    vulnerabilities = extract_vulnerability_info(scan_data)

    # Extract handshake simulation info
    handshake_simulation = extract_handshake_simulation_info(scan_data)

    # Extract miscellaneous information
    misc_info = extract_misc_info(scan_data)

    return DetailedSSLInfo(
        protocol_info=protocol_info,
        cipher_info=cipher_info,
        certificate_info=certificate_info,
        vulnerabilities=vulnerabilities,
        handshake_simulation=handshake_simulation,
        misc_info=misc_info
    )


def extract_protocol_info(scan_data: Dict) -> Dict:
    """Extract protocol support information."""
    protocol_details = {}

    # Look for protocols in the scan data
    protocols_list = scan_data.get('protocols', [])
    for protocol_entry in protocols_list:
        protocol_id = protocol_entry.get('id', 'unknown')
        protocol_details[protocol_id] = {
            'supported': 'offered' in protocol_entry.get('finding', '').lower(),
            'severity': protocol_entry.get('severity', ''),
            'finding': protocol_entry.get('finding', ''),
            'id': protocol_entry.get('id', '')
        }

    return protocol_details


def extract_cipher_info(scan_data: Dict) -> Dict:
    """Extract cipher strength and support information."""
    cipher_details = {}

    # Look for cipher categories in the scan data
    cipher_categories = [
        'cipher_categories',
        'cipher-strengths',
        'cipher-suites',
        'cipher_order'
    ]

    # Look for cipher-related entries in the scan data
    for key, value in scan_data.items():
        if 'cipher' in key.lower() or 'encryption' in key.lower():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and 'id' in item:
                        cipher_details[item['id']] = {
                            'severity': item.get('severity', ''),
                            'finding': item.get('finding', ''),
                            'id': item.get('id', '')
                        }
            elif isinstance(value, dict) and 'id' in value:
                cipher_details[value['id']] = {
                    'severity': value.get('severity', ''),
                    'finding': value.get('finding', ''),
                    'id': value.get('id', '')
                }

    return cipher_details


def extract_certificate_info(scan_data: Dict) -> Dict:
    """Extract certificate information."""
    cert_details = {}

    # Look for certificate-related entries in the scan data
    for key, value in scan_data.items():
        if 'cert' in key.lower() or 'certificate' in key.lower() or 'sig' in key.lower():
            if isinstance(value, list):
                for i, item in enumerate(value):
                    if isinstance(item, dict) and 'id' in item:
                        cert_details[f"{key}_{i}_{item['id']}"] = {
                            'severity': item.get('severity', ''),
                            'finding': item.get('finding', ''),
                            'id': item.get('id', '')
                        }
            elif isinstance(value, dict) and 'id' in value:
                cert_details[key] = {
                    'severity': value.get('severity', ''),
                    'finding': value.get('finding', ''),
                    'id': value.get('id', '')
                }
            elif isinstance(value, str):
                cert_details[key] = {
                    'severity': 'INFO',
                    'finding': value,
                    'id': key
                }

    # Also look in the main scan data for certificate fields
    cert_fields = ['cert_issuer', 'cert_subject', 'cert_serial', 'cert_sigalg', 'cert_keysize', 'cert_validity']
    for field in cert_fields:
        if field in scan_data:
            cert_details[field] = {
                'severity': 'INFO',
                'finding': str(scan_data[field]),
                'id': field
            }

    return cert_details


def extract_vulnerability_info(scan_data: Dict) -> Dict:
    """Extract vulnerability information."""
    vuln_details = {}

    # Look for vulnerability-related entries in the scan data
    for key, value in scan_data.items():
        if any(vuln in key.lower() for vuln in ['heartbleed', 'ccs', 'ticketbleed', 'robot', 'crime', 'breach', 'poodle', 'freak', 'logjam', 'drown', 'fallback', 'beast', 'lucky', 'sweet32', 'opossum', 'renegotiation']):
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and 'id' in item:
                        vuln_details[item['id']] = {
                            'severity': item.get('severity', ''),
                            'finding': item.get('finding', ''),
                            'id': item.get('id', '')
                        }
            elif isinstance(value, dict) and 'id' in value:
                vuln_details[value['id']] = {
                    'severity': value.get('severity', ''),
                    'finding': value.get('finding', ''),
                    'id': value.get('id', '')
                }
            elif isinstance(value, str):
                vuln_details[key] = {
                    'severity': 'INFO',
                    'finding': value,
                    'id': key
                }

    return vuln_details


def extract_handshake_simulation_info(scan_data: Dict) -> Dict:
    """Extract handshake simulation information."""
    handshake_details = {}

    # Look for client simulation results
    for key, value in scan_data.items():
        if 'client' in key.lower() or 'simulation' in key.lower() or 'browser' in key.lower():
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and 'id' in item:
                        handshake_details[item['id']] = {
                            'severity': item.get('severity', ''),
                            'finding': item.get('finding', ''),
                            'id': item.get('id', '')
                        }
            elif isinstance(value, dict) and 'id' in value:
                handshake_details[value['id']] = {
                    'severity': value.get('severity', ''),
                    'finding': value.get('finding', ''),
                    'id': value.get('id', '')
                }
            elif isinstance(value, str):
                handshake_details[key] = {
                    'severity': 'INFO',
                    'finding': value,
                    'id': key
                }

    return handshake_details


def extract_misc_info(scan_data: Dict) -> Dict:
    """Extract miscellaneous information."""
    misc_details = {}

    # Get server defaults and other general info
    general_keys = ['targetHost', 'ip', 'port', 'service', 'version', 'openssl']
    for key in general_keys:
        if key in scan_data:
            misc_details[key] = {
                'severity': 'INFO',
                'finding': str(scan_data[key]),
                'id': key
            }

    # Look for other configuration checks
    for key, value in scan_data.items():
        if key not in ['protocols', 'pretest', 'cert_issuer', 'cert_subject', 'cert_serial', 'cert_sigalg', 'cert_keysize', 'cert_validity'] and not any(vuln in key.lower() for vuln in ['heartbleed', 'ccs', 'ticketbleed', 'robot', 'crime', 'breach', 'poodle', 'freak', 'logjam', 'drown', 'fallback', 'beast', 'lucky', 'sweet', 'freak', 'drown']):
            if isinstance(value, list):
                for item in value:
                    if isinstance(item, dict) and 'id' in item:
                        misc_details[item['id']] = {
                            'severity': item.get('severity', ''),
                            'finding': item.get('finding', ''),
                            'id': item.get('id', '')
                        }
            elif isinstance(value, dict) and 'id' in value:
                misc_details[value['id']] = {
                    'severity': value.get('severity', ''),
                    'finding': value.get('finding', ''),
                    'id': value.get('id', '')
                }
            elif isinstance(value, str) and key not in ['targetHost', 'ip', 'port', 'service', 'version', 'openssl']:
                misc_details[key] = {
                    'severity': 'INFO',
                    'finding': value,
                    'id': key
                }

    return misc_details

# Example usage:
def example_usage():
    # Example testssl.sh JSON output structure (updated to match actual structure)
    example_scan_results = {
        "scanResult": [
            {
                "targetHost": "example.com",
                "ip": "192.168.1.1",
                "port": "443",
                "service": "HTTP",
                "protocols": [
                    {
                        "id": "TLS1",
                        "severity": "HIGH",
                        "finding": "offered (deprecated)"
                    },
                    {
                        "id": "TLS1_1",
                        "severity": "MEDIUM",
                        "finding": "offered (deprecated)"
                    },
                    {
                        "id": "TLS1_2",
                        "severity": "OK",
                        "finding": "offered"
                    },
                    {
                        "id": "TLS1_3",
                        "severity": "OK",
                        "finding": "offered (final)"
                    }
                ],
                "cert_rsa_signature": [
                    {
                        "id": "cert_signatureAlgorithm",
                        "severity": "OK",
                        "finding": "SHA256 with RSA 2048 bit"
                    }
                ],
                "cert_validity": [
                    {
                        "id": "cert_notAfter",
                        "severity": "OK",
                        "finding": "2025-12-31"
                    }
                ],
                "ocsp_stapling": [
                    {
                        "id": "cert_ocspStapling",
                        "severity": "MEDIUM",
                        "finding": "not offered"
                    }
                ]
            }
        ]
    }

    status, findings, detailed_info = evaluate_ssl_policy(example_scan_results)
    print(f"Overall Status: {status.value}")
    for finding in findings:
        print(f"  - {finding.name}: {finding.description} [{finding.severity.value}]")

    print(f"Protocol Info: {detailed_info.protocol_info}")
    print(f"Cipher Info: {detailed_info.cipher_info}")
    print(f"Certificate Info: {detailed_info.certificate_info}")