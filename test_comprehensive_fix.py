#!/usr/bin/env python3
"""
Comprehensive test to verify the fix for the TLS 1.3 contradiction issue.
"""
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rule_engine import evaluate_ssl_policy, extract_detailed_ssl_info

def test_contradiction_fix():
    """Test that verifies the contradiction between protocol tab and summary page is fixed."""
    
    # Simulate the scenario described in the issue:
    # Protocol tab shows "TLS1 3 OK offered with final" meaning TLS 1.3 is enabled
    # But summary page showed "TLS_1.3_NOT_ENABLED" warning
    sample_json = {
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
                        "severity": "OK",  # Changed to OK to simulate better config
                        "finding": "offered"
                    },
                    {
                        "id": "TLS1_1",
                        "severity": "OK",  # Changed to OK to simulate better config
                        "finding": "offered"
                    },
                    {
                        "id": "TLS1_2",
                        "severity": "OK",
                        "finding": "offered"
                    },
                    {
                        "id": "TLS1_3",
                        "severity": "OK",
                        "finding": "offered (final)"  # This indicates TLS 1.3 is enabled
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

    print("Testing the contradiction fix...")
    print("Scenario: Protocol tab shows 'TLS1_3 OK offered (final)' meaning TLS 1.3 is enabled")
    print("Expected: No 'TLS_1.3_NOT_ENABLED' warning in summary\n")

    # Run the rule evaluation
    status, findings, detailed_info = evaluate_ssl_policy(sample_json)

    print(f"Overall Status: {status.value}")
    print("Findings:")
    for finding in findings:
        print(f"  - {finding.name}: {finding.description} [{finding.severity.value}]")

    # Extract protocol info for the protocol tab view
    protocol_info = detailed_info.protocol_info
    print(f"\nProtocol Tab Data:")
    for proto_id, proto_data in protocol_info.items():
        if 'TLS' in proto_id or 'SSL' in proto_id:
            print(f"  - {proto_id}: {proto_data['finding']} ({proto_data['severity']})")

    # Check for the contradiction
    tls13_not_enabled_warnings = [f for f in findings if f.name == 'TLS_1.3_NOT_ENABLED']
    tls13_found_in_protocol_tab = 'TLS1_3' in protocol_info and protocol_info['TLS1_3']['finding'] == 'offered (final)'

    print(f"\nContradiction Analysis:")
    print(f"- TLS 1.3 found in protocol tab: {tls13_found_in_protocol_tab}")
    print(f"- TLS_1.3_NOT_ENABLED warning in summary: {len(tls13_not_enabled_warnings) > 0}")

    if tls13_found_in_protocol_tab and len(tls13_not_enabled_warnings) > 0:
        print("❌ ISSUE STILL EXISTS: Contradiction between protocol tab and summary!")
        return False
    elif not tls13_found_in_protocol_tab and len(tls13_not_enabled_warnings) == 0:
        print("❌ UNEXPECTED: No TLS 1.3 in protocol tab but no warning either!")
        return False
    elif tls13_found_in_protocol_tab and len(tls13_not_enabled_warnings) == 0:
        print("✅ FIXED: No contradiction - TLS 1.3 enabled in protocol tab AND no warning in summary!")
        return True
    else:
        print("✅ CORRECT: No TLS 1.3 in protocol tab AND warning in summary (expected behavior)")
        return True

def test_original_bug_scenario():
    """Test the original bug scenario with a configuration that doesn't have TLS 1.3."""
    
    print("\n" + "="*60)
    print("Testing original bug scenario without TLS 1.3 enabled...")
    
    sample_json_no_tls13 = {
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
                        "severity": "OK",
                        "finding": "offered"
                    },
                    {
                        "id": "TLS1_1",
                        "severity": "OK",
                        "finding": "offered"
                    },
                    {
                        "id": "TLS1_2",
                        "severity": "OK",
                        "finding": "offered"
                    }
                    # No TLS1_3 entry - simulating missing TLS 1.3
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
                ]
            }
        ]
    }

    status, findings, detailed_info = evaluate_ssl_policy(sample_json_no_tls13)
    protocol_info = detailed_info.protocol_info
    
    print(f"Overall Status: {status.value}")
    print("Findings:")
    for finding in findings:
        print(f"  - {finding.name}: {finding.description} [{finding.severity.value}]")

    tls13_not_enabled_warnings = [f for f in findings if f.name == 'TLS_1.3_NOT_ENABLED']
    tls13_found_in_protocol_tab = 'TLS1_3' in protocol_info

    print(f"\nContradiction Analysis:")
    print(f"- TLS 1.3 found in protocol tab: {tls13_found_in_protocol_tab}")
    print(f"- TLS_1.3_NOT_ENABLED warning in summary: {len(tls13_not_enabled_warnings) > 0}")

    if not tls13_found_in_protocol_tab and len(tls13_not_enabled_warnings) > 0:
        print("✅ CORRECT: No TLS 1.3 in protocol tab AND warning in summary (expected behavior)")
        return True
    else:
        print("❌ PROBLEM: Unexpected behavior when TLS 1.3 is not enabled")
        return False

if __name__ == "__main__":
    success1 = test_contradiction_fix()
    success2 = test_original_bug_scenario()
    
    print(f"\n{'='*60}")
    if success1 and success2:
        print("🎉 ALL TESTS PASSED! The contradiction issue has been fixed.")
    else:
        print("❌ SOME TESTS FAILED! The issue may not be fully resolved.")