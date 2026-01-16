import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import ScoreBar from '../components/ScoreBar';
import { ArrowLeft, RefreshCw, Shield, Lock, AlertTriangle, CheckCircle, ExternalLink, Trash2, ChevronDown, X } from 'lucide-react';
import { calculateGrade, predictGradeImprovement } from '../lib/grades';
import { getVulnerabilitySeverity, getCVECategory } from '../lib/utils';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [selectedFixes, setSelectedFixes] = useState({
    protocol: false,
    cipher: false,
    certificate: false
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');

  const fetchApplicationDetail = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/applications/${id}`);
      const data = await response.json();
      setApplication(data);
    } catch (error) {
      console.error('Error fetching application detail:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchApplicationDetail();
  }, [fetchApplicationDetail]);

  useEffect(() => {
    if (application) {
      setEditedName(application.name);
    }
  }, [application]);

  const triggerRescan = async () => {
    try {
      setRescanning(true);
      const response = await fetch(`/api/scan/${id}`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Rescan initiated successfully. Results will be available shortly.');
        fetchApplicationDetail();
      } else {
        alert('Error initiating rescan');
      }
    } catch (error) {
      console.error('Error triggering rescan:', error);
      alert('Error initiating rescan');
    } finally {
      setRescanning(false);
    }
  };

  const handleNameEdit = async () => {
    try {
      const response = await fetch(`/api/applications/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editedName
        })
      });

      if (response.ok) {
        const updatedApp = await response.json();
        setApplication(prev => ({
          ...prev,
          name: updatedApp.name
        }));
        setIsEditingName(false);
        alert('Application name updated successfully');
      } else {
        const result = await response.json();
        alert(result.error || 'Error updating application name');
      }
    } catch (error) {
      console.error('Error updating application name:', error);
      alert('Error updating application name');
    }
  };

  const handleDeleteApplication = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this application? This will also delete all associated scan data.`
    );

    if (confirmDelete) {
      try {
        const response = await fetch(`/api/applications/${id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          navigate('/');
        } else {
          const result = await response.json();
          alert(result.error || 'Error deleting application');
        }
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Error deleting application');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6 px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-48"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Application Not Found</h2>
            <p className="text-gray-500 mb-4">The application you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Extract certificate expiration information
  const getCertExpirationInfo = () => {
    if (!application.detailed_ssl_info?.certificate_info) {
      return null;
    }

    const certInfo = application.detailed_ssl_info.certificate_info;
    for (const [key, value] of Object.entries(certInfo)) {
      if (key.toLowerCase().includes('not_after') ||
          key.toLowerCase().includes('expires') ||
          key.toLowerCase().includes('expiration')) {
        if (value.finding) {
          try {
            const expirationDate = new Date(value.finding);
            if (!isNaN(expirationDate.getTime())) {
              const now = new Date();
              const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));

              return {
                date: expirationDate,
                daysUntilExpiry: daysUntilExpiry,
                isExpired: daysUntilExpiry < 0,
                isCritical: daysUntilExpiry >= 0 && daysUntilExpiry <= 7,
                isWarning: daysUntilExpiry > 7 && daysUntilExpiry <= 30
              };
            }
          } catch (e) {
            // Continue
          }
        }
      }
    }
    return null;
  };

  const certExpirationInfo = getCertExpirationInfo();

  // Check if application has no scan data yet (initial scan in progress)
  const hasNoScanData = !application.last_scan_time &&
                       (!application.detailed_ssl_info || Object.keys(application.detailed_ssl_info).length === 0) &&
                       application.scan_history && application.scan_history.length === 0;

  if (hasNoScanData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-6 px-4">
          {/* Navigation */}
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-6 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{application.name}</h1>
                  <a
                    href={application.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                  >
                    {application.url}
                    <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex flex-wrap gap-4 mt-4 text-sm">
                    <div>
                      <span className="text-gray-500">Last Scanned:</span>
                      <span className="ml-2 font-medium">Never</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-2 font-medium text-yellow-600">Initial scan in progress...</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => fetchApplicationDetail()} disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Message */}
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Initial Scan in Progress</h2>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                The initial security scan for this application is currently in progress.
                Please check back later to see the detailed SSL/TLS analysis.
              </p>
              <p className="text-sm text-gray-500">
                This page will automatically refresh when scan results become available.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Calculate grade from scan data
  const gradeInfo = calculateGrade(application);
  const overallGrade = application.grade || gradeInfo.grade;
  const overallScore = application.score || gradeInfo.score;

  // Render detailed SSL information sections
  const renderDetailedSection = (sectionTitle, sectionData) => {
    if (!sectionData || Object.keys(sectionData).length === 0) {
      return (
        <div className="text-center py-12 text-gray-500">
          <Shield className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>No data available for {sectionTitle}.</p>
          <p className="text-sm mt-1">Run a scan to see detailed information.</p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Test</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Severity</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Finding</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Object.entries(sectionData).map(([key, value], index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    value.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    value.severity === 'HIGH' ? 'bg-red-100 text-red-700' :
                    value.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    value.severity === 'LOW' ? 'bg-orange-100 text-orange-700' :
                    value.severity === 'OK' ? 'bg-green-100 text-green-800' :
                    value.severity === 'INFO' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {value.severity || 'N/A'}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{value.finding || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Enhanced vulnerability rendering with severity grouping and categories
  const renderVulnerabilities = (vulnerabilityData) => {
    if (!vulnerabilityData || Object.keys(vulnerabilityData).length === 0) {
      return (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-400" />
          <p className="text-gray-700 font-semibold">No vulnerabilities found</p>
          <p className="text-sm text-gray-500 mt-1">This SSL/TLS configuration passed vulnerability assessments.</p>
        </div>
      );
    }

    // Group vulnerabilities by severity
    const grouped = {};
    Object.entries(vulnerabilityData).forEach(([key, value]) => {
      const severity = value.severity?.toUpperCase() || 'INFO';
      if (!grouped[severity]) grouped[severity] = [];
      grouped[severity].push({ key, ...value });
    });

    // Sort by severity priority
    const severityOrder = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFO: 1, OK: 0 };
    const sortedSeverities = Object.keys(grouped).sort((a, b) => (severityOrder[b] || 0) - (severityOrder[a] || 0));

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'OK'].map(sev => {
            const severityInfo = getVulnerabilitySeverity(sev);
            const count = grouped[sev]?.length || 0;
            return (
              <div key={sev} className={`p-3 rounded-lg border text-center ${
                severityInfo.bgColor
              }`}>
                <div className={`text-2xl font-bold ${severityInfo.badgeText}`}>
                  {count}
                </div>
                <div className={`text-xs font-medium ${severityInfo.badgeText}`}>
                  {severityInfo.level}
                </div>
              </div>
            );
          })}
        </div>

        {/* Vulnerabilities grouped by severity */}
        {sortedSeverities.map(severity => {
          const severityInfo = getVulnerabilitySeverity(severity);
          return (
            <div key={severity}>
              <h3 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${severityInfo.badgeText}`}>
                <div className={`w-3 h-3 rounded-full`} style={{backgroundColor: severityInfo.color === 'red' ? '#dc2626' : severityInfo.color === 'yellow' ? '#eab308' : severityInfo.color === 'orange' ? '#ea580c' : '#22c55e'}}></div>
                {severityInfo.level} ({grouped[severity].length})
              </h3>
              <div className="space-y-3">
                {grouped[severity].map((vuln, index) => {
                  const category = getCVECategory(vuln.key);
                  return (
                    <div key={index} className={`p-4 rounded-lg border-l-4 ${severityInfo.bgColor} ${severityInfo.borderColor}`}>
                      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${severityInfo.badgeBg} ${severityInfo.badgeText}`}>
                              {severityInfo.level}
                            </span>
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700">
                              {category.category}
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-1">
                            {vuln.key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </h4>
                          <p className="text-sm text-gray-600">{vuln.finding || 'No details available'}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-6 px-4">
        {/* Navigation */}
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
              <div>
                {isEditingName ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      className="text-2xl font-bold text-gray-900 border-b border-blue-500 bg-transparent focus:outline-none focus:border-b-2"
                      autoFocus
                    />
                    <Button size="sm" onClick={handleNameEdit} className="h-8">
                      Save
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setIsEditingName(false);
                        setEditedName(application.name);
                      }}
                      className="h-8"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">{application.name}</h1>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditingName(true)}
                      className="h-8"
                    >
                      Edit
                    </Button>
                  </div>
                )}
                <a
                  href={application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                >
                  {application.url}
                  <ExternalLink className="w-3 h-3" />
                </a>

                <div className="flex flex-wrap gap-4 mt-4 text-sm">
                  <div>
                    <span className="text-gray-500">Last Scanned:</span>
                    <span className="ml-2 font-medium">
                      {application.last_scan_time
                        ? new Date(application.last_scan_time).toLocaleString()
                        : 'Never'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Issues:</span>
                    <span className={`ml-2 font-medium ${
                      application.issue_count > 0 ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {application.issue_count ?? 0}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={triggerRescan} disabled={rescanning}>
                  <RefreshCw className={`w-4 h-4 mr-2 ${rescanning ? 'animate-spin' : ''}`} />
                  {rescanning ? 'Scanning...' : 'Rescan'}
                </Button>
                <Button variant="outline" onClick={handleDeleteApplication} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Score Bar */}
        <ScoreBar
          protocolScore={gradeInfo.details?.protocolScore || 0}
          keyExchangeScore={gradeInfo.details?.keyExchangeScore || 0}
          cipherScore={gradeInfo.details?.cipherScore || 0}
          overallScore={overallScore}
          grade={overallGrade}
        />

        {/* Detailed SSL Information Tabs */}
        <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          {/* Desktop Tab List */}
          <TabsList className="hidden md:flex w-full justify-start bg-white border rounded-lg p-1 flex-wrap">
            <TabsTrigger value="summary" className="data-[state=active]:bg-gray-100">Summary</TabsTrigger>
            <TabsTrigger value="protocols" className="data-[state=active]:bg-gray-100">Protocols</TabsTrigger>
            <TabsTrigger value="ciphers" className="data-[state=active]:bg-gray-100">Ciphers</TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-gray-100">Certificates</TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="data-[state=active]:bg-gray-100">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="scan-history" className="data-[state=active]:bg-gray-100">Scan History</TabsTrigger>
            <TabsTrigger value="misc" className="data-[state=active]:bg-gray-100">Miscellaneous</TabsTrigger>
          </TabsList>

          {/* Mobile Tab Menu */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-full flex items-center justify-between bg-white border border-gray-300 rounded-lg p-3 font-medium text-gray-900"
            >
              <span className="flex items-center gap-2">
                {activeTab === 'summary' && 'Summary'}
                {activeTab === 'protocols' && 'Protocols'}
                {activeTab === 'ciphers' && 'Ciphers'}
                {activeTab === 'certificates' && 'Certificates'}
                {activeTab === 'vulnerabilities' && 'Vulnerabilities'}
                {activeTab === 'scan-history' && 'Scan History'}
                {activeTab === 'misc' && 'Miscellaneous'}
              </span>
              {mobileMenuOpen ? (
                <X className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {mobileMenuOpen && (
              <div className="mt-2 bg-white border border-gray-300 rounded-lg overflow-hidden">
                {[
                  { value: 'summary', label: 'Summary' },
                  { value: 'protocols', label: 'Protocols' },
                  { value: 'ciphers', label: 'Ciphers' },
                  { value: 'certificates', label: 'Certificates' },
                  { value: 'vulnerabilities', label: 'Vulnerabilities' },
                  { value: 'scan-history', label: 'Scan History' },
                  { value: 'misc', label: 'Miscellaneous' }
                ].map(tab => (
                  <button
                    key={tab.value}
                    onClick={() => {
                      setActiveTab(tab.value);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 border-b last:border-b-0 ${
                      activeTab === tab.value
                        ? 'bg-gray-100 font-semibold text-blue-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scan Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Certificate Expiration Warning */}
                {certExpirationInfo && (
                  <div className={`mb-6 p-4 rounded-lg border-l-4 flex items-start gap-4 ${
                    certExpirationInfo.isExpired ? 'bg-red-50 border-l-red-600 border border-red-200' :
                    certExpirationInfo.isCritical ? 'bg-red-50 border-l-red-500 border border-red-200' :
                    'bg-yellow-50 border-l-yellow-500 border border-yellow-200'
                  }`}>
                    <AlertTriangle className={`w-6 h-6 flex-shrink-0 ${
                      certExpirationInfo.isExpired ? 'text-red-600' :
                      certExpirationInfo.isCritical ? 'text-red-600' :
                      'text-yellow-600'
                    }`} />
                    <div>
                      <h3 className={`font-semibold mb-1 ${
                        certExpirationInfo.isExpired ? 'text-red-900' :
                        certExpirationInfo.isCritical ? 'text-red-900' :
                        'text-yellow-900'
                      }`}>
                        {certExpirationInfo.isExpired
                          ? `Certificate Expired`
                          : certExpirationInfo.isCritical
                          ? `Critical: Certificate Expiring Soon`
                          : `Warning: Certificate Expiration`}
                      </h3>
                      <p className={`text-sm mb-2 ${
                        certExpirationInfo.isExpired ? 'text-red-800' :
                        certExpirationInfo.isCritical ? 'text-red-800' :
                        'text-yellow-800'
                      }`}>
                        {certExpirationInfo.isExpired
                          ? `This certificate expired ${Math.abs(certExpirationInfo.daysUntilExpiry)} day${Math.abs(certExpirationInfo.daysUntilExpiry) > 1 ? 's' : ''} ago on ${certExpirationInfo.date.toDateString()}.`
                          : `This certificate will expire in ${certExpirationInfo.daysUntilExpiry} day${certExpirationInfo.daysUntilExpiry > 1 ? 's' : ''} on ${certExpirationInfo.date.toDateString()}.`}
                      </p>
                      <p className={`text-xs ${
                        certExpirationInfo.isExpired ? 'text-red-700' :
                        certExpirationInfo.isCritical ? 'text-red-700' :
                        'text-yellow-700'
                      }`}>
                        Action required: Renew or replace the certificate to maintain secure connections.
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-blue-50 border border-blue-100 p-5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Shield className="w-8 h-8 text-blue-500" />
                      <div>
                        <p className="text-3xl font-bold text-blue-700">
                          {application.detailed_ssl_info?.protocol_info ?
                            Object.keys(application.detailed_ssl_info.protocol_info).filter(k =>
                              application.detailed_ssl_info.protocol_info[k]?.finding?.toLowerCase().includes('offered')
                            ).length : 0}
                        </p>
                        <p className="text-sm text-blue-600">Protocols Supported</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 border border-green-100 p-5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Lock className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="text-3xl font-bold text-green-700">
                          {application.detailed_ssl_info?.cipher_info ?
                            Object.keys(application.detailed_ssl_info.cipher_info).filter(k =>
                              application.detailed_ssl_info.cipher_info[k]?.finding?.toLowerCase().includes('offered') &&
                              (k.toLowerCase().includes('strong') || k.toLowerCase().includes('fs'))
                            ).length : 0}
                        </p>
                        <p className="text-sm text-green-600">Strong Ciphers</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-red-50 border border-red-100 p-5 rounded-xl">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-red-500" />
                      <div>
                        <p className="text-3xl font-bold text-red-700">
                          {application.detailed_ssl_info?.vulnerabilities ?
                            Object.keys(application.detailed_ssl_info.vulnerabilities).filter(k =>
                              !application.detailed_ssl_info.vulnerabilities[k]?.finding?.toLowerCase().includes('not vulnerable')
                            ).length : 0}
                        </p>
                        <p className="text-sm text-red-600">Vulnerabilities</p>
                      </div>
                    </div>
                  </div>
                </div>

                {application.findings && application.findings.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Security Findings</h3>
                    <div className="space-y-3">
                      {application.findings.map((finding, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-lg border-l-4 ${
                            finding.severity === 'FAIL'
                              ? 'border-red-500 bg-red-50'
                              : finding.severity === 'WARN'
                              ? 'border-yellow-500 bg-yellow-50'
                              : 'border-green-500 bg-green-50'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-gray-900">{finding.name}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              finding.severity === 'FAIL' ? 'bg-red-100 text-red-800' :
                              finding.severity === 'WARN' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {finding.severity}
                            </span>
                          </div>
                          <p className="text-gray-600 mt-2 text-sm">{finding.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-green-800 font-semibold">No Security Issues Found</p>
                    <p className="text-green-600 text-sm mt-1">This application has a clean SSL/TLS configuration.</p>
                  </div>
                )}

                {/* Grade Improvement Predictor */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Grade Improvement Roadmap</h3>
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6">
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-3">Select areas to improve and see your potential grade:</p>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200">
                          <input
                            type="checkbox"
                            checked={selectedFixes.protocol}
                            onChange={(e) => setSelectedFixes({ ...selectedFixes, protocol: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm font-medium">Fix Protocol Issues (disable TLS 1.0/1.1, enable TLS 1.3)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200">
                          <input
                            type="checkbox"
                            checked={selectedFixes.cipher}
                            onChange={(e) => setSelectedFixes({ ...selectedFixes, cipher: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm font-medium">Remove Weak Ciphers (RC4, 3DES, NULL)</span>
                        </label>
                        <label className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200">
                          <input
                            type="checkbox"
                            checked={selectedFixes.certificate}
                            onChange={(e) => setSelectedFixes({ ...selectedFixes, certificate: e.target.checked })}
                            className="w-4 h-4 rounded"
                          />
                          <span className="text-sm font-medium">Upgrade Certificate (stronger key size, SHA-256)</span>
                        </label>
                      </div>
                    </div>

                    {/* Show prediction */}
                    {(selectedFixes.protocol || selectedFixes.cipher || selectedFixes.certificate) && (() => {
                      const prediction = predictGradeImprovement(application, selectedFixes);
                      return (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                          <div className="grid grid-cols-3 gap-4">
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Current</p>
                              <div className="text-3xl font-bold text-blue-600">{prediction.currentGrade}</div>
                              <p className="text-xs text-gray-500 mt-1">{prediction.currentScore} pts</p>
                            </div>
                            <div className="flex items-center justify-center">
                              <div className="text-center">
                                <p className="text-2xl font-bold text-green-500">→</p>
                                <p className="text-xs text-green-600 font-semibold mt-1">
                                  +{prediction.totalImprovement}
                                </p>
                              </div>
                            </div>
                            <div className="text-center">
                              <p className="text-xs text-gray-600 mb-1">Potential</p>
                              <div className="text-3xl font-bold text-green-600">{prediction.predictedGrade}</div>
                              <p className="text-xs text-gray-500 mt-1">{prediction.predictedScore} pts</p>
                            </div>
                          </div>
                          {prediction.improvements.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-xs font-semibold text-gray-700 mb-2">Improvements by category:</p>
                              <div className="flex gap-2 flex-wrap">
                                {prediction.improvements.map(cat => (
                                  <span key={cat} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                                    {cat}: +{prediction.improvementDetails[cat]}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="protocols">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Protocol Support</CardTitle>
              </CardHeader>
              <CardContent>
                {renderDetailedSection('Protocol Support', application.detailed_ssl_info?.protocol_info)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ciphers">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cipher Information</CardTitle>
              </CardHeader>
              <CardContent>
                {renderDetailedSection('Cipher Information', application.detailed_ssl_info?.cipher_info)}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Certificate Information</CardTitle>
              </CardHeader>
              <CardContent>
                {renderDetailedSection('Certificate Information',
                  application.detailed_ssl_info?.certificate_info &&
                  Object.keys(application.detailed_ssl_info?.certificate_info).length > 0
                    ? application.detailed_ssl_info?.certificate_info
                    : (() => {
                        // Filter misc_info to only include certificate-related data
                        const miscInfo = application.detailed_ssl_info?.misc_info || {};
                        const certRelatedKeys = Object.keys(miscInfo).filter(key =>
                          key.toLowerCase().includes('cert') ||
                          key.toLowerCase().includes('certificate') ||
                          key.toLowerCase().includes('intermediate_cert')
                        );

                        const filteredCertInfo = {};
                        certRelatedKeys.forEach(key => {
                          filteredCertInfo[key] = miscInfo[key];
                        });

                        return filteredCertInfo;
                      })()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vulnerability Scan Results</CardTitle>
              </CardHeader>
              <CardContent>
                {renderVulnerabilities(
                  (() => {
                    // Combine vulnerabilities from vulnerabilities section with vulnerability-related data from misc_info
                    const vulns = { ...application.detailed_ssl_info?.vulnerabilities || {} };
                    const miscInfo = application.detailed_ssl_info?.misc_info || {};

                    // Look for vulnerability-related keys in misc_info
                    Object.keys(miscInfo).forEach(key => {
                      const entry = miscInfo[key];

                      // Check if this key relates to vulnerabilities
                      if (key.toLowerCase().includes('heartbleed') ||
                          key.toLowerCase().includes('robot') ||
                          key.toLowerCase().includes('crime') ||
                          key.toLowerCase().includes('breach') ||
                          key.toLowerCase().includes('poodle') ||
                          key.toLowerCase().includes('freak') ||
                          key.toLowerCase().includes('logjam') ||
                          key.toLowerCase().includes('drown') ||
                          key.toLowerCase().includes('beast') ||
                          key.toLowerCase().includes('lucky13') ||
                          key.toLowerCase().includes('opossum') ||
                          key.toLowerCase().includes('ticketbleed') ||
                          key.toLowerCase().includes('secure_client_renego') ||
                          key.toLowerCase().includes('secure_renego') ||
                          key.toLowerCase().includes('fallback_scsv') ||
                          key.toLowerCase().includes('sessionresumption') ||
                          key.toLowerCase().includes('early_data') ||
                          key.toLowerCase().includes('winshock') ||
                          key.toLowerCase().includes('rc4') ||
                          key.toLowerCase().includes('sweet32')) {

                        // Only add to vulnerabilities if it's actually a vulnerability (not OK/INFO)
                        if (entry.severity && !['OK', 'INFO'].includes(entry.severity.toUpperCase())) {
                          vulns[key] = entry;
                        }
                      }
                    });

                    return vulns;
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="scan-history">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scan History</CardTitle>
              </CardHeader>
              <CardContent>
                {application.scan_history && application.scan_history.length > 0 ? (
                  <div className="space-y-4">
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className="border-b border-gray-200">
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">#</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Started At</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Completed At</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {application.scan_history
                            .slice()
                            .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at)) // Sort by completed_at, most recent first
                            .map((scan, index) => {
                              // Calculate the actual rank (1 for most recent, 2 for second most recent, etc.)
                              const rank = index + 1;
                              return (
                                <tr key={scan.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{rank}</td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(scan.started_at).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3 text-sm text-gray-600">
                                    {new Date(scan.completed_at).toLocaleString()}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      scan.status === 'PASS' || scan.status === 'A' || scan.status === 'B' || scan.status === 'C' ? 'bg-green-100 text-green-800' :
                                      scan.status === 'WARN' || scan.status === 'C+' ? 'bg-yellow-100 text-yellow-800' :
                                      scan.status === 'FAIL' || scan.status === 'D' || scan.status === 'E' || scan.status === 'F' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {scan.status}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                    <div className="text-sm text-gray-500">
                      Showing {application.scan_history.length} scan{application.scan_history.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p>No scan history available.</p>
                    <p className="text-sm mt-1">Run a scan to see historical data.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="misc">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Miscellaneous Configuration</CardTitle>
              </CardHeader>
              <CardContent>
                {renderDetailedSection('Miscellaneous Configuration',
                  (() => {
                    // Filter misc_info to exclude certificate, protocol, cipher, and vulnerability data
                    const miscInfo = application.detailed_ssl_info?.misc_info || {};
                    const allKeys = Object.keys(miscInfo);

                    const filteredMiscInfo = {};
                    allKeys.forEach(key => {
                      // Exclude certificate-related keys
                      if (key.toLowerCase().includes('cert') || key.toLowerCase().includes('certificate') || key.toLowerCase().includes('intermediate_cert')) {
                        return;
                      }
                      // Exclude protocol-related keys
                      if (key.toLowerCase().includes('tls') || key.toLowerCase().includes('ssl') || key.toLowerCase().includes('protocol')) {
                        return;
                      }
                      // Exclude cipher-related keys
                      if (key.toLowerCase().includes('cipher') || key.toLowerCase().includes('encryption')) {
                        return;
                      }
                      // Handle vulnerability-related keys: only include if they have OK/INFO severity
                      if (key.toLowerCase().includes('heartbleed') || key.toLowerCase().includes('robot') || key.toLowerCase().includes('crime') ||
                          key.toLowerCase().includes('breach') || key.toLowerCase().includes('poodle') || key.toLowerCase().includes('freak') ||
                          key.toLowerCase().includes('logjam') || key.toLowerCase().includes('drown') || key.toLowerCase().includes('beast') ||
                          key.toLowerCase().includes('lucky13') || key.toLowerCase().includes('opossum') || key.toLowerCase().includes('ticketbleed') ||
                          key.toLowerCase().includes('secure_client_renego') || key.toLowerCase().includes('secure_renego') ||
                          key.toLowerCase().includes('fallback_scsv') || key.toLowerCase().includes('sessionresumption') ||
                          key.toLowerCase().includes('early_data') || key.toLowerCase().includes('winshock') ||
                          key.toLowerCase().includes('rc4') || key.toLowerCase().includes('sweet32')) {
                        // Only include vulnerability-related entries with OK/INFO severity in misc
                        const entry = miscInfo[key];
                        if (entry.severity && ['OK', 'INFO'].includes(entry.severity.toUpperCase())) {
                          filteredMiscInfo[key] = entry;
                        }
                        return; // Skip if not OK/INFO severity (they go to vulnerabilities tab)
                      }

                      // Include everything else as miscellaneous
                      filteredMiscInfo[key] = miscInfo[key];
                    });

                    return filteredMiscInfo;
                  })()
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ApplicationDetail;
