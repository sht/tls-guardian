#!/usr/bin/env python3
"""
Debug script to test the rule engine and see what's happening with the detailed SSL info extraction.
"""
import json
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rule_engine import evaluate_ssl_policy

def main():
    # Load a sample testssl.sh JSON output
    sample_json = {
        "Invocation": "testssl.sh --fast --jsonfile-pretty /tmp/test.json https://example.com",
        "at": "fd01b2b8b374:/usr/bin/openssl",
        "version": "3.3dev ",
        "openssl": "OpenSSL 3.5.4 from Sat Nov 1 11:22:59 2025",
        "startTime": "1768248476",
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
                ]
            }
        ]
    }

    print("Sample JSON loaded.")
    print("Running evaluate_ssl_policy...")
    
    try:
        status, findings, detailed_info = evaluate_ssl_policy(sample_json)
        
        print(f"\nStatus: {status}")
        print(f"Number of findings: {len(findings)}")
        print(f"Findings: {findings}")
        
        print(f"\nDetailed SSL Info:")
        print(f"Protocol Info: {detailed_info.protocol_info}")
        print(f"Cipher Info: {detailed_info.cipher_info}")
        print(f"Certificate Info: {detailed_info.certificate_info}")
        print(f"Vulnerabilities: {detailed_info.vulnerabilities}")
        print(f"Handshake Simulation: {detailed_info.handshake_simulation}")
        print(f"Misc Info: {detailed_info.misc_info}")
        
    except Exception as e:
        print(f"Error running evaluate_ssl_policy: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()