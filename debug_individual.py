#!/usr/bin/env python3
"""
Debug script to test individual extraction functions.
"""
import json
import sys
import os

# Add the current directory to the path so we can import modules
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rule_engine import extract_protocol_info, extract_vulnerability_info, extract_certificate_info, extract_handshake_simulation_info, extract_misc_info, extract_cipher_info

def main():
    # Sample data that matches the structure
    sample_data = {
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

    print("Sample data loaded.")
    print(f"Keys in sample data: {list(sample_data.keys())}")
    
    print("\nTesting extract_protocol_info...")
    protocol_result = extract_protocol_info(sample_data)
    print(f"Protocol result: {protocol_result}")
    
    print("\nTesting extract_vulnerability_info...")
    vuln_result = extract_vulnerability_info(sample_data)
    print(f"Vulnerability result: {vuln_result}")
    
    print("\nTesting extract_certificate_info...")
    cert_result = extract_certificate_info(sample_data)
    print(f"Certificate result: {cert_result}")
    
    print("\nTesting extract_handshake_simulation_info...")
    handshake_result = extract_handshake_simulation_info(sample_data)
    print(f"Handshake simulation result: {handshake_result}")
    
    print("\nTesting extract_misc_info...")
    misc_result = extract_misc_info(sample_data)
    print(f"Misc result: {misc_result}")
    
    print("\nTesting extract_cipher_info...")
    cipher_result = extract_cipher_info(sample_data)
    print(f"Cipher result: {cipher_result}")

if __name__ == "__main__":
    main()