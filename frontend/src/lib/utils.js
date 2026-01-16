import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple class names into a single string using clsx and tailwind-merge
 * @param {...any} inputs - Class names or objects to combine
 * @returns {string} - Combined class names
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Categorizes vulnerabilities by CVSS severity
 * @param {string} severity - The severity level (CRITICAL, HIGH, MEDIUM, LOW, OK, INFO)
 * @returns {object} - Contains severity info, color, and priority
 */
export function getVulnerabilitySeverity(severity) {
  const severityMap = {
    'CRITICAL': {
      level: 'Critical',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-600',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      priority: 5,
      cvssRange: '9.0-10.0'
    },
    'HIGH': {
      level: 'High',
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-l-red-500',
      badgeBg: 'bg-red-100',
      badgeText: 'text-red-800',
      priority: 4,
      cvssRange: '7.0-8.9'
    },
    'MEDIUM': {
      level: 'Medium',
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-l-yellow-500',
      badgeBg: 'bg-yellow-100',
      badgeText: 'text-yellow-800',
      priority: 3,
      cvssRange: '4.0-6.9'
    },
    'LOW': {
      level: 'Low',
      color: 'orange',
      bgColor: 'bg-orange-50',
      borderColor: 'border-l-orange-500',
      badgeBg: 'bg-orange-100',
      badgeText: 'text-orange-700',
      priority: 2,
      cvssRange: '0.1-3.9'
    },
    'OK': {
      level: 'Pass',
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-l-green-500',
      badgeBg: 'bg-green-100',
      badgeText: 'text-green-800',
      priority: 0,
      cvssRange: 'N/A'
    },
    'INFO': {
      level: 'Info',
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-l-blue-500',
      badgeBg: 'bg-blue-100',
      badgeText: 'text-blue-800',
      priority: 1,
      cvssRange: 'N/A'
    }
  };

  return severityMap[severity?.toUpperCase()] || severityMap['INFO'];
}

/**
 * Categorizes vulnerabilities by type (e.g., Protocol, Cipher, SSL/TLS)
 * @param {string} name - The vulnerability name
 * @returns {object} - Contains category info
 */
export function getCVECategory(name) {
  const nameLower = name.toLowerCase();

  if (nameLower.includes('tls') || nameLower.includes('ssl') ||
      nameLower.includes('protocol') || nameLower.includes('sslv') ||
      nameLower.includes('tlsv')) {
    return { category: 'Protocol', color: 'blue', icon: '🔐' };
  }

  if (nameLower.includes('cipher') || nameLower.includes('rc4') ||
      nameLower.includes('des') || nameLower.includes('encryption')) {
    return { category: 'Cipher', color: 'yellow', icon: '🔑' };
  }

  if (nameLower.includes('heartbleed') || nameLower.includes('ccs_injection') ||
      nameLower.includes('ticketbleed') || nameLower.includes('opossum')) {
    return { category: 'Known CVE', color: 'red', icon: '🎯' };
  }

  if (nameLower.includes('robot') || nameLower.includes('crime') ||
      nameLower.includes('breach') || nameLower.includes('poodle') ||
      nameLower.includes('freak') || nameLower.includes('logjam') ||
      nameLower.includes('drown') || nameLower.includes('beast') ||
      nameLower.includes('lucky13')) {
    return { category: 'Known Attack', color: 'red', icon: '⚠️' };
  }

  if (nameLower.includes('renego') || nameLower.includes('renegotiation') ||
      nameLower.includes('session') || nameLower.includes('fallback') ||
      nameLower.includes('scsv')) {
    return { category: 'Handshake/Session', color: 'orange', icon: '🔄' };
  }

  return { category: 'Other', color: 'gray', icon: '📋' };
}