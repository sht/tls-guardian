import subprocess
import json
import tempfile
import os
from typing import Dict, Optional
from pathlib import Path

class TestSSLScanner:
    """
    Integration with testssl.sh for SSL/TLS scanning.
    """
    
    def __init__(self, testssl_path: str = "/usr/local/bin/testssl.sh"):
        """
        Initialize the scanner.
        
        Args:
            testssl_path: Path to the testssl.sh executable
        """
        self.testssl_path = testssl_path
        if not os.path.exists(testssl_path):
            raise FileNotFoundError(f"testssl.sh not found at {testssl_path}")
    
    def scan_url(self, url: str) -> Dict:
        """
        Scan a URL using testssl.sh and return parsed JSON results.

        Args:
            url: The URL to scan (e.g., "https://example.com")

        Returns:
            Parsed JSON results from testssl.sh
        """
        # Create a temporary file to store JSON output
        with tempfile.NamedTemporaryFile(mode='w+', suffix='.json', delete=False) as tmp_file:
            json_output_path = tmp_file.name

        try:
            # Prepare the command with faster options - URL must come last
            cmd = [
                self.testssl_path,
                '--fast',  # Speed up scan by skipping some tests
                '--openssl-timeout', '45',  # Reduce timeout for individual OpenSSL calls
                '--jsonfile-pretty', json_output_path,  # Output in JSON format to file
                '--warnings', 'off',  # Disable interactive warnings
                url
            ]

            # Execute the scan
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=1200  # 20 minute timeout to allow for complete scan
            )

            # Check if the command had a true failure (return codes 100+ are actual errors)
            # Return codes 1-9 typically indicate various levels of vulnerabilities found
            if result.returncode >= 100:
                # Return more detailed error information
                error_msg = f"testssl.sh failed with return code {result.returncode}"
                if result.stdout:
                    error_msg += f": stdout={result.stdout}"
                if result.stderr:
                    error_msg += f", stderr={result.stderr}"
                raise RuntimeError(error_msg)
            elif result.returncode > 0:
                # Log that the scan completed with vulnerabilities/warnings but continue processing
                print(f"testssl.sh scan completed with return code {result.returncode} (indicating vulnerabilities found)")

            # Read and parse the JSON output
            with open(json_output_path, 'r') as f:
                json_data = json.load(f)

            return json_data

        finally:
            # Clean up the temporary file
            if os.path.exists(json_output_path):
                os.remove(json_output_path)

    def scan_url_to_file(self, url: str, output_path: str) -> Dict:
        """
        Scan a URL using testssl.sh and save results to a specified file.

        Args:
            url: The URL to scan (e.g., "https://example.com")
            output_path: Path where JSON output should be saved

        Returns:
            Parsed JSON results from testssl.sh
        """
        cmd = [
            self.testssl_path,
            '--fast',
            '--openssl-timeout', '45',  # Reduce timeout for individual OpenSSL calls
            '--jsonfile-pretty', output_path,
            '--warnings', 'off',  # Disable interactive warnings
            url
        ]

        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=1200  # 20 minute timeout to allow for complete scan
        )

        if result.returncode != 0:
            # Return more detailed error information
            error_msg = f"testssl.sh failed with return code {result.returncode}"
            if result.stdout:
                error_msg += f": stdout={result.stdout}"
            if result.stderr:
                error_msg += f", stderr={result.stderr}"
            raise RuntimeError(error_msg)

        with open(output_path, 'r') as f:
            json_data = json.load(f)

        return json_data

# Example usage
def example_usage():
    # Initialize scanner (assuming testssl.sh is installed in default location)
    scanner = TestSSLScanner()

    # Scan a URL
    try:
        results = scanner.scan_url("https://example.com")
        print(f"Scan completed for example.com")
        print(f"Server: {results.get('serverDefaults', {}).get('hostname', 'Unknown')}")

        # Example of accessing specific results
        tls_protocols = results.get('tls-protocols', {})
        for protocol, data in tls_protocols.items():
            print(f"  {protocol}: {data.get('finding', 'N/A')}")

        return results
    except Exception as e:
        print(f"Error during scan: {e}")
        return None

if __name__ == "__main__":
    example_usage()