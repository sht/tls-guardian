#!/usr/bin/env python3
"""
Debug script to check what's happening with TLS 1.3 detection in the rule engine.
"""
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rule_engine import evaluate_ssl_policy

def debug_tls13_detection():
    """Debug TLS 1.3 detection with realistic testssl.sh output."""
    
    # Create a realistic testssl.sh output that has TLS 1.3 enabled
    # This mimics what would come from an actual scan
    realistic_scan_result = {
        "scanResult": [
            {
                "targetHost": "example.com",
                "ip": "93.184.216.34",
                "port": "443",
                "service": "HTTP",
                "startTime": "2023-12-01 10:30:00",
                "timestamp": "2023-12-01 10:30:05",
                "protocols": [
                    {
                        "id": "SSLv2",
                        "severity": "OK",
                        "finding": "not offered"
                    },
                    {
                        "id": "SSLv3",
                        "severity": "OK",
                        "finding": "not offered"
                    },
                    {
                        "id": "TLS1",
                        "severity": "LOW",
                        "finding": "offered (deprecated)"
                    },
                    {
                        "id": "TLS1_1",
                        "severity": "LOW",
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
                "serverDefaults": {
                    "ip": "93.184.216.34",
                    "port": 443,
                    "hostname": "example.com"
                },
                "cert_chain_trust": [
                    {
                        "id": "cert_trust",
                        "severity": "OK",
                        "finding": "trusted"
                    }
                ],
                "cert_dates": [
                    {
                        "id": "cert_notBefore",
                        "severity": "INFO",
                        "finding": "Sep 20 00:00:00 2023 GMT"
                    },
                    {
                        "id": "cert_notAfter",
                        "severity": "INFO",
                        "finding": "Dec 19 23:59:59 2024 GMT"
                    }
                ],
                "cert_sigalg": [
                    {
                        "id": "cert_signatureAlgorithm",
                        "severity": "OK",
                        "finding": "SHA256 with RSA"
                    }
                ],
                "cert_subject": [
                    {
                        "id": "cert_subject",
                        "severity": "INFO",
                        "finding": "/CN=www.example.org"
                    }
                ],
                "cert_issuer": [
                    {
                        "id": "cert_issuer",
                        "severity": "INFO",
                        "finding": "/C=US/O=Example Inc./CN=Example Organization"
                    }
                ],
                "cert_keySize": [
                    {
                        "id": "cert_pubkeySize",
                        "severity": "OK",
                        "finding": "RSA 2048 bits"
                    }
                ],
                "heartbleed": [
                    {
                        "id": "heartbleed_vulnerable",
                        "severity": "OK",
                        "finding": "not vulnerable"
                    }
                ],
                "client_sim": [
                    {
                        "id": "Chrome 119 (Win 10)",
                        "severity": "INFO",
                        "finding": "TLS_AES_128_GCM_SHA256, 256 bit ECDH (P-256)"
                    }
                ]
            }
        ]
    }

    print("Testing rule engine with realistic scan result that has TLS 1.3 enabled...")
    print("="*70)
    
    # Run the evaluation
    status, findings, detailed_info = evaluate_ssl_policy(realistic_scan_result)
    
    print(f"Overall Status: {status.value}")
    print("\nFindings:")
    for finding in findings:
        print(f"  - {finding.name}: {finding.description} [{finding.severity.value}]")
    
    print(f"\nProtocol Info (from detailed_info):")
    for proto_id, proto_data in detailed_info.protocol_info.items():
        if 'TLS' in proto_id or 'SSL' in proto_id:
            print(f"  - {proto_id}: {proto_data['finding']} (severity: {proto_data['severity']})")
    
    # Check specifically for TLS 1.3
    tls13_entries = [(k, v) for k, v in detailed_info.protocol_info.items() if 'TLS1_3' in k]
    print(f"\nTLS 1.3 entries found: {len(tls13_entries)}")
    for proto_id, proto_data in tls13_entries:
        print(f"  - {proto_id}: {proto_data['finding']} (severity: {proto_data['severity']})")
    
    # Check for TLS_1.3_NOT_ENABLED warning
    tls13_warnings = [f for f in findings if f.name == 'TLS_1.3_NOT_ENABLED']
    print(f"\nTLS_1.3_NOT_ENABLED warnings: {len(tls13_warnings)}")
    
    if len(tls13_warnings) > 0:
        print("❌ PROBLEM: Still detecting TLS_1.3_NOT_ENABLED even when TLS 1.3 is enabled!")
        print("Let's debug the _check_warn_conditions function...")
        
        # Debug the specific check
        scan_data = realistic_scan_result['scanResult'][0] if 'scanResult' in realistic_scan_result and len(realistic_scan_result['scanResult']) > 0 else realistic_scan_result
        protocols_list = scan_data.get('protocols', [])
        
        print(f"\nProtocols found in scan data: {len(protocols_list)}")
        for protocol_entry in protocols_list:
            protocol_id = protocol_entry.get('id', 'unknown')
            severity = protocol_entry.get('severity', 'unknown')
            finding = protocol_entry.get('finding', 'unknown')
            print(f"  - {protocol_id}: severity={severity}, finding='{finding}'")
            if 'TLS1_3' in protocol_id:
                print(f"    ↑ This is TLS 1.3 - severity={severity}, finding='{finding}'")
        
        tls_13_enabled = False
        for protocol_entry in protocols_list:
            protocol_id = protocol_entry.get('id', 'unknown')
            if 'TLS1_3' in protocol_id and protocol_entry.get('severity') == 'OK':
                tls_13_enabled = True
                print(f"    ✓ TLS 1.3 is enabled: {protocol_id} has severity OK")
                break
        
        print(f"Final TLS 1.3 enabled determination: {tls_13_enabled}")
    else:
        print("✅ GOOD: No TLS_1.3_NOT_ENABLED warning when TLS 1.3 is enabled")


if __name__ == "__main__":
    debug_tls13_detection()