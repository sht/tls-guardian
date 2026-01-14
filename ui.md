# SSL Hygiene Monitor - UI Redesign Specification

## Overview

Redesign the SSL Hygiene Monitor frontend from Bootstrap 5 to a modern, SSL Labs-inspired UI using **shadcn/ui + Tailwind CSS**. The goal is to create a professional, visually appealing security dashboard that presents SSL/TLS scan results in a clear, actionable format.

## Current State

- **Framework**: React 18.2.0
- **Current UI**: Bootstrap 5.3.0 (via CDN)
- **Components**: SummaryDashboard, ApplicationDetail, ApplicationList, StatusBadge
- **API Endpoints**:
  - `GET /api/applications` - List all applications
  - `GET /api/applications/{id}` - Get application details
  - `GET /api/summary` - Get dashboard statistics
  - `POST /api/scan/{id}` - Trigger rescan
  - `POST /api/applications` - Add new application
  - `DELETE /api/applications/{id}` - Delete application

## Target Design

### Design Inspiration
- **Qualys SSL Labs** (https://www.ssllabs.com/ssltest/) - Letter grade system, detailed breakdowns
- **Linear.app** - Clean, modern aesthetic with subtle animations
- **Vercel Dashboard** - Minimalist, professional look

### Key Design Principles
1. **Grade-First Display**: Large, prominent letter grades (A+, A, B, C, D, F)
2. **Color-Coded Severity**: Consistent color system for PASS/WARN/FAIL states
3. **Progressive Disclosure**: Summary first, details on demand
4. **Dark Mode Support**: Full dark/light theme support
5. **Responsive Design**: Mobile-first, works on all screen sizes

## Technical Requirements

### Setup shadcn/ui + Tailwind

1. Install Tailwind CSS in the React project
2. Initialize shadcn/ui with the following components:
   - Card
   - Button
   - Badge
   - Table
   - Tabs
   - Dialog (Modal)
   - Input
   - Progress
   - Separator
   - Skeleton (loading states)
   - Collapsible
   - Accordion
   - Tooltip
   - Alert
   - DropdownMenu

3. Configure Tailwind with custom theme extending the default

### Color System

```javascript
// tailwind.config.js colors extension
colors: {
  grade: {
    'a-plus': '#22c55e',  // Green - A+
    'a': '#4ade80',       // Light green - A
    'b': '#facc15',       // Yellow - B
    'c': '#fb923c',       // Orange - C
    'd': '#f87171',       // Light red - D
    'f': '#dc2626',       // Red - F
  },
  severity: {
    'pass': '#22c55e',    // Green
    'warn': '#eab308',    // Yellow
    'fail': '#dc2626',    // Red
    'info': '#3b82f6',    // Blue
  }
}
```

## Component Specifications

### 1. Dashboard Page (`/`)

#### Header Section
- Application name/logo on left
- "Add Application" button on right
- Optional: Dark mode toggle

#### Statistics Cards Row
Four cards in a horizontal row:
```
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Total Apps  │ │   Passing   │ │  Warnings   │ │   Failing   │
│     12      │ │      8      │ │      3      │ │      1      │
│             │ │   ● Green   │ │  ● Yellow   │ │    ● Red    │
└─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘
```

#### Applications List
Card-based list (not table) with each application showing:
```
┌────────────────────────────────────────────────────────────────┐
│ ┌────┐                                                         │
│ │ A+ │  example.com                              [Rescan] [⋮]  │
│ └────┘  Last scanned: 2 hours ago • 0 issues                   │
│         Protocol: TLS 1.3 • Certificate expires in 45 days     │
└────────────────────────────────────────────────────────────────┘
```

Grade badge design:
- Large letter grade in colored circle/rounded square
- A+/A = Green background
- B = Yellow background
- C = Orange background
- D/F = Red background

#### Add Application Modal
Clean dialog with:
- URL input field with validation
- Optional name field
- Cancel and Add buttons
- Loading state during addition

### 2. Application Detail Page (`/application/:id`)

#### Header Section
```
┌────────────────────────────────────────────────────────────────────┐
│ ← Back to Dashboard                                                │
│                                                                    │
│ ┌──────────┐                                                       │
│ │          │   example.com                                         │
│ │    A+    │   https://example.com                                 │
│ │          │   Last scan: January 13, 2026 at 10:30 AM            │
│ └──────────┘                                                       │
│                                                                    │
│ [Rescan Now]  [Delete Application]                                 │
└────────────────────────────────────────────────────────────────────┘
```

#### Score Breakdown Bar (SSL Labs style)
Horizontal segmented bar showing sub-scores:
```
┌─────────────────────────────────────────────────────────────┐
│ Protocol    │    Cipher     │  Certificate  │ Vulnerabilities│
│    100      │      95       │      100      │      90        │
│   (green)   │    (green)    │    (green)    │   (green)      │
└─────────────────────────────────────────────────────────────┘
```

#### Tabbed Content Area

**Tab 1: Summary**
- Quick overview cards for each category
- Issue count badges
- Key findings highlighted

**Tab 2: Protocol Support**
Checklist style display:
```
┌────────────────────────────────────────┐
│ Protocol Support                       │
├────────────────────────────────────────┤
│ ✓ TLS 1.3                    Enabled   │
│ ✓ TLS 1.2                    Enabled   │
│ ✗ TLS 1.1                    Disabled  │ (Good - legacy)
│ ✗ TLS 1.0                    Disabled  │ (Good - legacy)
│ ✗ SSL 3.0                    Disabled  │ (Good - insecure)
│ ✗ SSL 2.0                    Disabled  │ (Good - insecure)
└────────────────────────────────────────┘
```

**Tab 3: Cipher Suites**
Grouped by strength:
```
┌────────────────────────────────────────────────────────────┐
│ Strong Ciphers (12)                                    [▼] │
├────────────────────────────────────────────────────────────┤
│ TLS_AES_256_GCM_SHA384                          ● Strong   │
│ TLS_CHACHA20_POLY1305_SHA256                    ● Strong   │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ Weak Ciphers (0)                                       [▼] │
├────────────────────────────────────────────────────────────┤
│ None detected                                              │
└────────────────────────────────────────────────────────────┘
```

**Tab 4: Certificate**
Certificate details in organized sections:
```
┌────────────────────────────────────────────────────────────┐
│ Certificate Information                                    │
├────────────────────────────────────────────────────────────┤
│ Subject        │ CN=example.com                            │
│ Issuer         │ Let's Encrypt Authority X3                │
│ Valid From     │ December 1, 2025                          │
│ Valid Until    │ March 1, 2026 (47 days remaining)         │
│ Key Algorithm  │ RSA 2048 bits                             │
│ Signature      │ SHA256withRSA                             │
├────────────────────────────────────────────────────────────┤
│ Subject Alternative Names                                  │
├────────────────────────────────────────────────────────────┤
│ example.com, www.example.com, api.example.com              │
└────────────────────────────────────────────────────────────┘
```

**Tab 5: Vulnerabilities**
Status indicators for each known vulnerability:
```
┌────────────────────────────────────────────────────────────┐
│ Vulnerability Assessment                                   │
├────────────────────────────────────────────────────────────┤
│ ✓ Heartbleed (CVE-2014-0160)              Not Vulnerable   │
│ ✓ POODLE (CVE-2014-3566)                  Not Vulnerable   │
│ ✓ DROWN (CVE-2016-0800)                   Not Vulnerable   │
│ ✓ BEAST (CVE-2011-3389)                   Not Vulnerable   │
│ ✓ FREAK (CVE-2015-0204)                   Not Vulnerable   │
│ ✓ Logjam (CVE-2015-4000)                  Not Vulnerable   │
│ ⚠ ROBOT                                   Potential Risk   │
│ ...                                                        │
└────────────────────────────────────────────────────────────┘
```

**Tab 6: Findings**
List of all findings with severity:
```
┌────────────────────────────────────────────────────────────┐
│ Findings (3)                                               │
├────────────────────────────────────────────────────────────┤
│ ● FAIL   TLS 1.0 is enabled - should be disabled           │
│          Recommendation: Disable TLS 1.0 in server config  │
├────────────────────────────────────────────────────────────┤
│ ● WARN   OCSP Stapling is not enabled                      │
│          Recommendation: Enable OCSP stapling              │
├────────────────────────────────────────────────────────────┤
│ ● WARN   Certificate expires in 25 days                    │
│          Recommendation: Renew certificate soon            │
└────────────────────────────────────────────────────────────┘
```

**Tab 7: Scan History**
Timeline or table of previous scans:
```
┌────────────────────────────────────────────────────────────┐
│ Scan History                                               │
├────────────────────────────────────────────────────────────┤
│ Jan 13, 2026 10:30 AM    A+    0 issues    [View Details]  │
│ Jan 12, 2026 02:00 AM    A+    0 issues    [View Details]  │
│ Jan 11, 2026 02:00 AM    B     2 issues    [View Details]  │
│ Jan 10, 2026 02:00 AM    B     2 issues    [View Details]  │
└────────────────────────────────────────────────────────────┘
```

### 3. Scanning State UI

When a scan is in progress, show:
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│     ◐ Scanning example.com...                              │
│                                                            │
│     ████████████░░░░░░░░░░░░░░░░  45%                     │
│                                                            │
│     Current step: Checking cipher suites                   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 4. Empty States

When no applications exist:
```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                    📋                                      │
│                                                            │
│          No applications monitored yet                     │
│                                                            │
│    Add your first application to start monitoring          │
│    its SSL/TLS security posture.                          │
│                                                            │
│              [+ Add Application]                           │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5. Loading States

Use shadcn Skeleton components for loading:
- Skeleton cards for dashboard stats
- Skeleton rows for application list
- Skeleton sections for detail page

## Grade Calculation Logic (SSL Labs Algorithm)

The grade calculation follows the official Qualys SSL Labs rating methodology (version 2009r).

### Final Score Formula

```
Final Score = (Protocol Score × 0.30) + (Key Exchange Score × 0.30) + (Cipher Strength Score × 0.40)
```

### Grade Mapping

| Score Range | Grade |
|-------------|-------|
| ≥ 80        | A     |
| ≥ 65        | B     |
| ≥ 50        | C     |
| ≥ 35        | D     |
| ≥ 20        | E     |
| < 20        | F     |

**Special Grades:**
- **A+** = A grade + no warnings + HSTS enabled (max-age ≥ 6 months) + TLS 1.3 support
- **A-** = A grade but with warnings (e.g., TLS 1.3 not supported)

### Category Scoring

#### Protocol Support Score (30% weight)

Calculate: `(best_protocol_score + worst_protocol_score) / 2`

| Protocol | Score |
|----------|-------|
| SSL 2.0  | 0%    |
| SSL 3.0  | 80%   |
| TLS 1.0  | 90%   |
| TLS 1.1  | 95%   |
| TLS 1.2  | 100%  |
| TLS 1.3  | 100%  |

#### Key Exchange Score (30% weight)

| Key Size / Type           | Score |
|---------------------------|-------|
| Weak or anonymous         | 0%    |
| DH < 512 bits             | 20%   |
| Exportable (≤512 bits)    | 40%   |
| DH < 1024 bits            | 40%   |
| DH < 2048 bits            | 80%   |
| DH < 4096 bits            | 90%   |
| DH ≥ 4096 bits            | 100%  |

#### Cipher Strength Score (40% weight)

Calculate: `(best_cipher_score + worst_cipher_score) / 2`

| Cipher Strength | Score |
|-----------------|-------|
| No encryption   | 0%    |
| < 128 bits      | 20%   |
| < 256 bits      | 80%   |
| ≥ 256 bits      | 100%  |

### Automatic Failures (Instant F Grade)

These conditions immediately result in an F grade:
- SSL 2.0 is enabled
- Certificate is invalid, expired, self-signed, or revoked
- Certificate uses insecure signature (MD2, MD5)
- Domain name mismatch
- Untrusted certificate authority
- Vulnerable to: Heartbleed, POODLE, DROWN, ROBOT
- DH parameters < 1024 bits
- Export cipher suites enabled
- Insecure renegotiation

### Grade Caps (Maximum Grade Limited)

**Capped to B:**
- TLS 1.0 or TLS 1.1 is enabled
- RC4 cipher support
- No Forward Secrecy support
- Weak DH parameters (< 2048 bits)
- No AEAD cipher support
- Incomplete certificate chain

**Capped to C:**
- No TLS 1.2 support
- Vulnerable to CRIME
- RC4 used with TLS 1.1+

### Implementation

```javascript
// src/lib/grades.js

const PROTOCOL_SCORES = {
  'SSL 2.0': 0,
  'SSL 3.0': 80,
  'TLS 1.0': 90,
  'TLS 1.1': 95,
  'TLS 1.2': 100,
  'TLS 1.3': 100,
};

const KEY_EXCHANGE_SCORES = {
  'weak': 0,
  'anonymous': 0,
  'dh_512': 20,
  'export': 40,
  'dh_1024': 40,
  'dh_2048': 80,
  'dh_4096': 90,
  'dh_4096_plus': 100,
};

const CIPHER_STRENGTH_SCORES = {
  'none': 0,
  'below_128': 20,
  'below_256': 80,
  '256_plus': 100,
};

// Vulnerabilities that cause instant F
const CRITICAL_VULNERABILITIES = [
  'heartbleed',
  'poodle',
  'drown',
  'robot',
  'ccs_injection',
  'insecure_renegotiation',
];

// Conditions that cap grade to B
const CAP_TO_B_CONDITIONS = [
  'tls_1_0_enabled',
  'tls_1_1_enabled',
  'rc4_enabled',
  'no_forward_secrecy',
  'weak_dh',
  'no_aead',
  'incomplete_chain',
];

// Conditions that cap grade to C
const CAP_TO_C_CONDITIONS = [
  'no_tls_1_2',
  'crime_vulnerable',
];

function calculateProtocolScore(protocols) {
  const enabledProtocols = protocols.filter(p => p.enabled);
  if (enabledProtocols.length === 0) return 0;

  const scores = enabledProtocols.map(p => PROTOCOL_SCORES[p.name] || 0);
  const best = Math.max(...scores);
  const worst = Math.min(...scores);

  return (best + worst) / 2;
}

function calculateKeyExchangeScore(keyExchange) {
  // Return score based on weakest key exchange supported
  // Implementation depends on scan data structure
  const dhBits = keyExchange.dhBits || 0;

  if (keyExchange.anonymous || keyExchange.weak) return 0;
  if (dhBits < 512) return 20;
  if (dhBits < 1024 || keyExchange.export) return 40;
  if (dhBits < 2048) return 80;
  if (dhBits < 4096) return 90;
  return 100;
}

function calculateCipherScore(ciphers) {
  const enabledCiphers = ciphers.filter(c => c.enabled);
  if (enabledCiphers.length === 0) return 0;

  const scores = enabledCiphers.map(c => {
    if (c.bits === 0) return 0;
    if (c.bits < 128) return 20;
    if (c.bits < 256) return 80;
    return 100;
  });

  const best = Math.max(...scores);
  const worst = Math.min(...scores);

  return (best + worst) / 2;
}

function checkCriticalVulnerabilities(vulnerabilities) {
  return CRITICAL_VULNERABILITIES.some(v => vulnerabilities[v] === true);
}

function getGradeCap(conditions) {
  if (CAP_TO_C_CONDITIONS.some(c => conditions[c])) return 'C';
  if (CAP_TO_B_CONDITIONS.some(c => conditions[c])) return 'B';
  return null;
}

function scoreToGrade(score) {
  if (score >= 80) return 'A';
  if (score >= 65) return 'B';
  if (score >= 50) return 'C';
  if (score >= 35) return 'D';
  if (score >= 20) return 'E';
  return 'F';
}

export function calculateGrade(scanResult) {
  // Check for instant F conditions
  if (scanResult.certificate?.invalid ||
      scanResult.certificate?.expired ||
      scanResult.certificate?.selfSigned ||
      scanResult.protocols?.ssl2Enabled ||
      checkCriticalVulnerabilities(scanResult.vulnerabilities || {})) {
    return { grade: 'F', score: 0, reason: 'Critical security issue detected' };
  }

  // Calculate component scores
  const protocolScore = calculateProtocolScore(scanResult.protocols?.list || []);
  const keyExchangeScore = calculateKeyExchangeScore(scanResult.keyExchange || {});
  const cipherScore = calculateCipherScore(scanResult.ciphers?.list || []);

  // Calculate final score with weights
  const finalScore = (protocolScore * 0.30) + (keyExchangeScore * 0.30) + (cipherScore * 0.40);

  // Determine base grade
  let grade = scoreToGrade(finalScore);

  // Apply grade caps
  const cap = getGradeCap(scanResult.conditions || {});
  if (cap && grade < cap) {
    // Grade is already lower than cap, keep it
  } else if (cap) {
    grade = cap;
  }

  // Check for A+ conditions
  if (grade === 'A') {
    const hasHSTS = scanResult.hsts?.enabled && scanResult.hsts?.maxAge >= 15768000; // 6 months
    const hasTLS13 = scanResult.protocols?.tls13Enabled;
    const hasWarnings = scanResult.warnings?.length > 0;

    if (hasHSTS && hasTLS13 && !hasWarnings) {
      grade = 'A+';
    } else if (hasWarnings || !hasTLS13) {
      grade = 'A-';
    }
  }

  return {
    grade,
    score: Math.round(finalScore),
    components: {
      protocol: Math.round(protocolScore),
      keyExchange: Math.round(keyExchangeScore),
      cipher: Math.round(cipherScore),
    }
  };
}

// Helper to get grade color
export function getGradeColor(grade) {
  const colors = {
    'A+': 'grade-a-plus',
    'A': 'grade-a',
    'A-': 'grade-a',
    'B': 'grade-b',
    'C': 'grade-c',
    'D': 'grade-d',
    'E': 'grade-f',
    'F': 'grade-f',
  };
  return colors[grade] || 'grade-f';
}
```

### Score Breakdown Display

The ScoreBar component should display the three category scores:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Protocol (30%)  │  Key Exchange (30%)  │  Cipher Strength (40%)   │
│       95         │         100          │          90              │
│     ████████     │      ██████████      │       ████████           │
└─────────────────────────────────────────────────────────────────────┘
                        Overall Score: 94 (A+)
```

## File Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   │   ├── button.jsx
│   │   │   ├── card.jsx
│   │   │   ├── badge.jsx
│   │   │   ├── table.jsx
│   │   │   ├── tabs.jsx
│   │   │   ├── dialog.jsx
│   │   │   ├── input.jsx
│   │   │   ├── progress.jsx
│   │   │   ├── skeleton.jsx
│   │   │   ├── collapsible.jsx
│   │   │   ├── accordion.jsx
│   │   │   ├── tooltip.jsx
│   │   │   ├── alert.jsx
│   │   │   └── dropdown-menu.jsx
│   │   ├── GradeBadge.jsx         # Letter grade display component
│   │   ├── ScoreBar.jsx           # Horizontal score breakdown bar
│   │   ├── StatCard.jsx           # Dashboard statistic card
│   │   ├── ApplicationCard.jsx    # Application list item card
│   │   ├── FindingItem.jsx        # Single finding display
│   │   ├── VulnerabilityList.jsx  # Vulnerability checklist
│   │   ├── CipherList.jsx         # Cipher suites grouped list
│   │   ├── CertificateInfo.jsx    # Certificate details display
│   │   ├── ProtocolSupport.jsx    # Protocol support checklist
│   │   ├── ScanProgress.jsx       # Scanning progress indicator
│   │   ├── EmptyState.jsx         # Empty state placeholder
│   │   └── Header.jsx             # App header with navigation
│   ├── pages/
│   │   ├── Dashboard.jsx          # Main dashboard page
│   │   └── ApplicationDetail.jsx  # Application detail page
│   ├── lib/
│   │   ├── utils.js               # Utility functions (cn, etc.)
│   │   └── grades.js              # Grade calculation logic
│   ├── hooks/
│   │   ├── useApplications.js     # Applications data hook
│   │   └── useScan.js             # Scan trigger hook
│   ├── App.jsx
│   ├── index.jsx
│   └── index.css                  # Tailwind imports + custom styles
├── tailwind.config.js
├── postcss.config.js
└── components.json                # shadcn configuration
```

## Implementation Steps

### Phase 1: Setup (Do this first)

1. Remove Bootstrap from `public/index.html`
2. Install Tailwind CSS:
   ```bash
   npm install -D tailwindcss postcss autoprefixer
   npx tailwindcss init -p
   ```
3. Configure `tailwind.config.js` with custom colors and content paths
4. Update `src/index.css` with Tailwind directives:
   ```css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;
   ```
5. Install shadcn/ui dependencies:
   ```bash
   npm install class-variance-authority clsx tailwind-merge lucide-react
   npm install @radix-ui/react-dialog @radix-ui/react-tabs @radix-ui/react-tooltip
   npm install @radix-ui/react-collapsible @radix-ui/react-accordion
   npm install @radix-ui/react-dropdown-menu @radix-ui/react-separator
   ```
6. Create `src/lib/utils.js` with cn helper function
7. Add shadcn component files to `src/components/ui/`

### Phase 2: Core Components

1. Create `GradeBadge.jsx` - The prominent letter grade display
2. Create `StatCard.jsx` - Dashboard statistics cards
3. Create `ApplicationCard.jsx` - Application list items
4. Create `Header.jsx` - Navigation header

### Phase 3: Dashboard Page

1. Rewrite `Dashboard.jsx` using new components
2. Implement statistics row with StatCard
3. Implement application list with ApplicationCard
4. Add "Add Application" dialog using shadcn Dialog
5. Add empty state component
6. Add loading skeletons

### Phase 4: Application Detail Page

1. Create header section with large GradeBadge
2. Create `ScoreBar.jsx` for score breakdown
3. Implement tabbed interface using shadcn Tabs
4. Create `ProtocolSupport.jsx` for Protocol tab
5. Create `CipherList.jsx` for Cipher tab
6. Create `CertificateInfo.jsx` for Certificate tab
7. Create `VulnerabilityList.jsx` for Vulnerabilities tab
8. Create `FindingItem.jsx` and findings list for Findings tab
9. Create scan history table/timeline

### Phase 5: Polish

1. Add `ScanProgress.jsx` for scanning state
2. Add loading skeletons to all pages
3. Add error states and error boundaries
4. Implement dark mode toggle (optional)
5. Add subtle animations and transitions
6. Test responsive design on mobile
7. Optimize performance

## API Response Handling

The existing API endpoints return data that needs to be transformed for display. Ensure components handle:

- Missing data gracefully (show "N/A" or "-")
- Loading states (show skeletons)
- Error states (show error message with retry option)
- Empty arrays (show appropriate empty state)

## Accessibility Requirements

1. All interactive elements must be keyboard accessible
2. Use proper ARIA labels
3. Maintain sufficient color contrast
4. Support screen readers
5. Focus management in modals

## Notes for Implementation

- Keep all existing API integration logic - only change the UI layer
- Maintain the same routing structure (`/` and `/application/:id`)
- Preserve all existing functionality (add, delete, rescan)
- The grade calculation may need to be added if not present in API
- Test with both populated and empty states
- Ensure the build still works with `npm run build`
