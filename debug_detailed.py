#!/usr/bin/env python3
"""
More detailed debug script to test the rule engine and see what's happening with the detailed SSL info extraction.
"""
import json
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rule_engine import extract_detailed_ssl_info

def main():
    # Load a sample testssl.sh JSON output with the actual structure
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

    print("Sample JSON loaded with actual structure.")
    print("Running extract_detailed_ssl_info...")
    
    try:
        detailed_info = extract_detailed_ssl_info(sample_json)
        
        print(f"\nDetailed SSL Info:")
        print(f"Protocol Info: {detailed_info.protocol_info}")
        print(f"Cipher Info: {detailed_info.cipher_info}")
        print(f"Certificate Info: {detailed_info.certificate_info}")
        print(f"Vulnerabilities: {detailed_info.vulnerabilities}")
        print(f"Handshake Simulation: {detailed_info.handshake_simulation}")
        print(f"Misc Info: {detailed_info.misc_info}")
        
    except Exception as e:
        print(f"Error running extract_detailed_ssl_info: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()