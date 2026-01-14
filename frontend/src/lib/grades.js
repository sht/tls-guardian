// grades.js - Utility functions for calculating SSL grades and scores

/**
 * Calculates the grade and score for an application based on its SSL scan results
 * @param {Object} application - The application object containing scan results
 * @returns {Object} - Grade information including overall grade and detailed scores
 */
export function calculateGrade(application) {
  // Initialize scores
  let protocolScore = 0;
  let keyExchangeScore = 0;
  let cipherScore = 0;
  let overallScore = 0;
  let grade = 'N/A';

  // Extract scan data if available
  const detailedInfo = application.detailed_ssl_info || {};
  
  // Calculate protocol score based on supported protocols
  if (detailedInfo.protocol_info) {
    const protocols = detailedInfo.protocol_info;

    // Check for TLS 1.3 support (excellent)
    if (protocols['TLS1_3'] && protocols['TLS1_3'].finding.toLowerCase().includes('offered')) {
      protocolScore += 30;
    }

    // Check for TLS 1.2 support (good)
    if (protocols['TLS1_2'] && protocols['TLS1_2'].finding.toLowerCase().includes('offered')) {
      protocolScore += 20;
    }

    // Penalize for TLS 1.0/1.1 support (bad)
    if (protocols['TLS1'] && protocols['TLS1'].finding.toLowerCase().includes('offered')) {
      protocolScore -= 20;
    }

    if (protocols['TLS1_1'] && protocols['TLS1_1'].finding.toLowerCase().includes('offered')) {
      protocolScore -= 15;
    }

    // Penalize for SSL 2.0/3.0 support (very bad)
    if (protocols['SSLv2'] && protocols['SSLv2'].finding.toLowerCase().includes('offered')) {
      protocolScore -= 30;
    }

    if (protocols['SSLv3'] && protocols['SSLv3'].finding.toLowerCase().includes('offered')) {
      protocolScore -= 25;
    }
  }
  
  // Calculate key exchange score based on certificate strength
  if (detailedInfo.certificate_info) {
    const certInfo = detailedInfo.certificate_info;

    // Check key size
    if (certInfo['cert_keySize']) {
      const keySizeMatch = certInfo['cert_keySize'].finding.match(/(\d+)\s*bits/);
      if (keySizeMatch) {
        const keySize = parseInt(keySizeMatch[1]);
        if (keySize >= 4096) {
          keyExchangeScore += 25;
        } else if (keySize >= 2048) {
          keyExchangeScore += 20;
        } else if (keySize >= 1024) {
          keyExchangeScore += 10;
        } else {
          keyExchangeScore -= 20; // Weak key size
        }
      }
    }

    // Check signature algorithm
    if (certInfo['cert_signatureAlgorithm']) {
      const sigAlg = certInfo['cert_signatureAlgorithm'].finding.toLowerCase();
      if (sigAlg.includes('sha256') || sigAlg.includes('sha384') || sigAlg.includes('sha512')) {
        keyExchangeScore += 15;
      } else if (sigAlg.includes('sha1')) {
        keyExchangeScore -= 10; // SHA-1 is deprecated
      }
    }
  }
  
  // Calculate cipher score based on supported ciphers
  if (detailedInfo.cipher_info) {
    const ciphers = detailedInfo.cipher_info;

    // Count strong ciphers
    let strongCiphers = 0;
    let weakCiphers = 0;

    for (const [key, value] of Object.entries(ciphers)) {
      const finding = value.finding.toLowerCase();

      if (key.includes('STRONG') && finding.includes('offered')) {
        strongCiphers++;
      }

      if (key.includes('weak') || key.includes('null') || key.includes('export') || key.includes('LOW') || key.includes('NULL') ||
          finding.includes('rc4') || finding.includes('3des') || finding.includes('idea')) {
        weakCiphers++;
      }
    }

    cipherScore += Math.min(strongCiphers * 5, 30); // Cap at 30 points
    cipherScore -= Math.min(weakCiphers * 10, 30); // Max penalty of 30 points
  }
  
  // Calculate overall score (ensure it's within bounds)
  overallScore = Math.max(0, Math.min(100, protocolScore + keyExchangeScore + cipherScore));
  
  // Determine grade based on overall score
  if (overallScore >= 90) {
    grade = 'A+';
  } else if (overallScore >= 80) {
    grade = 'A';
  } else if (overallScore >= 70) {
    grade = 'B+';
  } else if (overallScore >= 60) {
    grade = 'B';
  } else if (overallScore >= 50) {
    grade = 'C+';
  } else if (overallScore >= 40) {
    grade = 'C';
  } else if (overallScore >= 30) {
    grade = 'D';
  } else if (overallScore >= 20) {
    grade = 'E';
  } else if (overallScore >= 10) {
    grade = 'F';
  } else {
    grade = 'T';
  }
  
  return {
    grade: grade,
    score: overallScore,
    details: {
      protocolScore: Math.max(0, protocolScore),
      keyExchangeScore: Math.max(0, keyExchangeScore),
      cipherScore: Math.max(0, cipherScore)
    }
  };
}

/**
 * Gets grade color based on grade letter
 * @param {string} grade - The grade letter
 * @returns {string} - Tailwind CSS color class
 */
export function getGradeColor(grade) {
  switch (grade) {
    case 'A+':
    case 'A':
    case 'B+':
      return 'text-green-600 bg-green-100';
    case 'B':
    case 'C+':
      return 'text-blue-600 bg-blue-100';
    case 'C':
      return 'text-yellow-600 bg-yellow-100';
    case 'D':
      return 'text-orange-600 bg-orange-100';
    case 'E':
    case 'F':
    case 'T':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
}