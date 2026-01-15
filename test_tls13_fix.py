#!/usr/bin/env python3
"""
Test script to verify the TLS 1.3 detection fix in the rule engine.
"""
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rule_engine import evaluate_ssl_policy

def test_tls13_detection():
    """Test that TLS 1.3 detection works correctly with the new structure."""
    
    # Sample testssl.sh JSON output with TLS 1.3 enabled
    sample_json_with_tls13 = {
        "scanResult": [
            {
                "targetHost": "example.com",
                "ip": "104.18.27.120",
                "port": "443",
                "service": "HTTP",
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
                "cert_issuer": "Cloudflare",
                "cert_subject": "example.com",
                "cert_keysize": "RSA 2048 bits",
                "cert_sigalg": "SHA256 with RSA",
                "cert_validity": "62 days",
                "heartbleed": [
                    {
                        "id": "heartbleed",
                        "severity": "OK",
                        "finding": "not vulnerable"
                    }
                ],
                "client_simulation": [
                    {
                        "id": "Chrome 101 (Win 10)",
                        "severity": "INFO",
                        "finding": "TLS_AES_128_GCM_SHA256"
                    }
                ],
                "pretest": [
                    {
                        "id": "pre_128cipher",
                        "severity": "INFO",
                        "finding": "No 128 cipher limit bug"
                    }
                ]
            }
        ]
    }

    # Sample testssl.sh JSON output without TLS 1.3 enabled
    sample_json_without_tls13 = {
        "scanResult": [
            {
                "targetHost": "example.com",
                "ip": "104.18.27.120",
                "port": "443",
                "service": "HTTP",
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
                    }
                    # Note: No TLS1_3 entry here
                ],
                "cert_issuer": "Cloudflare",
                "cert_subject": "example.com",
                "cert_keysize": "RSA 2048 bits",
                "cert_sigalg": "SHA256 with RSA",
                "cert_validity": "62 days",
                "heartbleed": [
                    {
                        "id": "heartbleed",
                        "severity": "OK",
                        "finding": "not vulnerable"
                    }
                ],
                "client_simulation": [
                    {
                        "id": "Chrome 101 (Win 10)",
                        "severity": "INFO",
                        "finding": "TLS_AES_128_GCM_SHA256"
                    }
                ],
                "pretest": [
                    {
                        "id": "pre_128cipher",
                        "severity": "INFO",
                        "finding": "No 128 cipher limit bug"
                    }
                ]
            }
        ]
    }

    print("Testing TLS 1.3 detection with TLS 1.3 enabled...")
    status_with_tls13, findings_with_tls13, detailed_info_with_tls13 = evaluate_ssl_policy(sample_json_with_tls13)
    
    print(f"Status: {status_with_tls13.value}")
    print("Findings:")
    for finding in findings_with_tls13:
        print(f"  - {finding.name}: {finding.description} [{finding.severity.value}]")
    
    # Check if TLS_1.3_NOT_ENABLED warning is present
    tls13_not_enabled_warnings = [f for f in findings_with_tls13 if f.name == 'TLS_1.3_NOT_ENABLED']
    print(f"TLS_1.3_NOT_ENABLED warnings found: {len(tls13_not_enabled_warnings)}")
    if len(tls13_not_enabled_warnings) == 0:
        print("✓ CORRECT: No TLS_1.3_NOT_ENABLED warning when TLS 1.3 is enabled")
    else:
        print("✗ INCORRECT: Found TLS_1.3_NOT_ENABLED warning when TLS 1.3 is enabled")
    
    print("\n" + "="*50 + "\n")
    
    print("Testing TLS 1.3 detection with TLS 1.3 disabled...")
    status_without_tls13, findings_without_tls13, detailed_info_without_tls13 = evaluate_ssl_policy(sample_json_without_tls13)
    
    print(f"Status: {status_without_tls13.value}")
    print("Findings:")
    for finding in findings_without_tls13:
        print(f"  - {finding.name}: {finding.description} [{finding.severity.value}]")
    
    # Check if TLS_1.3_NOT_ENABLED warning is present
    tls13_not_enabled_warnings = [f for f in findings_without_tls13 if f.name == 'TLS_1.3_NOT_ENABLED']
    print(f"TLS_1.3_NOT_ENABLED warnings found: {len(tls13_not_enabled_warnings)}")
    if len(tls13_not_enabled_warnings) > 0:
        print("✓ CORRECT: Found TLS_1.3_NOT_ENABLED warning when TLS 1.3 is not enabled")
    else:
        print("✗ INCORRECT: No TLS_1.3_NOT_ENABLED warning when TLS 1.3 is not enabled")

if __name__ == "__main__":
    test_tls13_detection()