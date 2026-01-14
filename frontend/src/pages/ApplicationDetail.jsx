import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import ScoreBar from '../components/ScoreBar';
import { ArrowLeft, RefreshCw, Shield, Lock, AlertTriangle, CheckCircle, ExternalLink, Trash2 } from 'lucide-react';
import { calculateGrade } from '../lib/grades';

const ApplicationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rescanning, setRescanning] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

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
        <Tabs defaultValue="summary" className="space-y-4">
          <TabsList className="w-full justify-start bg-white border rounded-lg p-1 flex-wrap">
            <TabsTrigger value="summary" className="data-[state=active]:bg-gray-100">Summary</TabsTrigger>
            <TabsTrigger value="protocols" className="data-[state=active]:bg-gray-100">Protocols</TabsTrigger>
            <TabsTrigger value="ciphers" className="data-[state=active]:bg-gray-100">Ciphers</TabsTrigger>
            <TabsTrigger value="certificates" className="data-[state=active]:bg-gray-100">Certificates</TabsTrigger>
            <TabsTrigger value="vulnerabilities" className="data-[state=active]:bg-gray-100">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="misc" className="data-[state=active]:bg-gray-100">Miscellaneous</TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scan Summary</CardTitle>
              </CardHeader>
              <CardContent>
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
                {renderDetailedSection('Vulnerability Scan Results', application.detailed_ssl_info?.vulnerabilities)}
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
                      // Exclude vulnerability-related keys
                      if (key.toLowerCase().includes('heartbleed') || key.toLowerCase().includes('robot') || key.toLowerCase().includes('crime') ||
                          key.toLowerCase().includes('breach') || key.toLowerCase().includes('poodle') || key.toLowerCase().includes('freak') ||
                          key.toLowerCase().includes('logjam') || key.toLowerCase().includes('drown') || key.toLowerCase().includes('beast') ||
                          key.toLowerCase().includes('lucky13') || key.toLowerCase().includes('opossum') || key.toLowerCase().includes('ticketbleed')) {
                        return;
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
