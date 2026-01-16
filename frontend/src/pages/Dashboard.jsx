import React, { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import StatCard from '../components/StatCard';
import ApplicationCard from '../components/ApplicationCard';
import { Shield, AlertTriangle, CheckCircle, XCircle, Plus } from 'lucide-react';
import EditApplicationDialog from '../components/EditApplicationDialog';

const Dashboard = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newAppUrl, setNewAppUrl] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [adding, setAdding] = useState(false);
  const [editingApplication, setEditingApplication] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddApplication = async (e) => {
    e.preventDefault();
    setAdding(true);

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: newAppUrl,
          name: newAppName || newAppUrl
        }),
      });

      if (response.ok) {
        const newAppData = await response.json();

        setShowAddDialog(false);
        setNewAppUrl('');
        setNewAppName('');

        // Trigger an immediate scan for the newly added application
        const scanResponse = await fetch(`/api/scan/${newAppData.id}`, {
          method: 'POST',
        });

        if (scanResponse.ok) {
          console.log('Initial scan initiated for new application');
        } else {
          console.error('Failed to initiate initial scan for new application');
        }

        // Refresh the applications list
        fetchApplications();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to add application');
      }
    } catch (error) {
      console.error('Error adding application:', error);
      alert('Error adding application');
    } finally {
      setAdding(false);
    }
  };

  const handleRescan = async (appId) => {
    try {
      const response = await fetch(`/api/scan/${appId}`, {
        method: 'POST',
      });

      if (response.ok) {
        alert('Rescan initiated successfully');
        fetchApplications();
      } else {
        alert('Failed to initiate rescan');
      }
    } catch (error) {
      console.error('Error initiating rescan:', error);
      alert('Error initiating rescan');
    }
  };

  const handleDeleteApplication = async (appId, appName) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${appName}"? This will also delete all associated scan data.`
    );

    if (confirmDelete) {
      try {
        const response = await fetch(`/api/applications/${appId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchApplications();
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

  const handleUpdateApplication = async (appId, newName) => {
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newName }),
      });

      if (response.ok) {
        setShowEditDialog(false);
        fetchApplications();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update application');
      }
    } catch (error) {
      console.error('Error updating application:', error);
      alert('Error updating application');
    }
  };

  const openEditDialog = (application) => {
    setEditingApplication(application);
    setShowEditDialog(true);
  };

  // Filter applications
  const filteredApplications = applications.filter(app => {
    // Search filter (by name or URL)
    const matchesSearch = searchQuery === '' ||
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.url.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (filterStatus !== 'all') {
      const status = app.status?.toLowerCase() || '';

      if (filterStatus === 'pass') {
        matchesStatus = status === 'pass' || status.startsWith('a') || status === 'b';
      } else if (filterStatus === 'warn') {
        matchesStatus = status === 'warn' || status === 'c';
      } else if (filterStatus === 'fail') {
        matchesStatus = status === 'fail' || status === 'd' || status === 'e' || status === 'f';
      }
    }

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const totalApps = applications.length;
  const passingApps = applications.filter(app =>
    app.status && (
      app.status.toLowerCase() === 'pass' ||
      app.status.toLowerCase().startsWith('a') ||
      app.status.toLowerCase() === 'b'
    )
  ).length;
  const warningApps = applications.filter(app =>
    app.status && (
      app.status.toLowerCase() === 'warn' ||
      app.status.toLowerCase() === 'c'
    )
  ).length;
  const failingApps = applications.filter(app =>
    app.status && (
      app.status.toLowerCase() === 'fail' ||
      app.status.toLowerCase() === 'd' ||
      app.status.toLowerCase() === 'e' ||
      app.status.toLowerCase() === 'f'
    )
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-8 px-4">
          <div className="animate-pulse space-y-8">
            <div className="flex justify-between items-center">
              <div className="h-10 bg-gray-200 rounded w-64"></div>
              <div className="h-10 bg-gray-200 rounded w-40"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">TLS Guardian</h1>
            <p className="text-gray-500 mt-1">Monitor SSL/TLS security posture of your applications</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="lg" className="shadow-md">
                <Plus className="w-5 h-5 mr-2" />
                Add Application
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Application</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddApplication}>
                <div className="space-y-4 py-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                      Application Name
                    </label>
                    <Input
                      id="name"
                      value={newAppName}
                      onChange={(e) => setNewAppName(e.target.value)}
                      placeholder="e.g., My Website"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                      URL <span className="text-red-500">*</span>
                    </label>
                    <Input
                      id="url"
                      value={newAppUrl}
                      onChange={(e) => setNewAppUrl(e.target.value)}
                      placeholder="https://example.com"
                      required
                      className="w-full"
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={adding}>
                    {adding ? 'Adding...' : 'Add Application'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Applications"
            value={totalApps}
            icon={<Shield className="w-6 h-6 text-blue-600" />}
          />
          <StatCard
            title="Passing"
            value={passingApps}
            icon={<CheckCircle className="w-6 h-6 text-green-600" />}
            variant="success"
          />
          <StatCard
            title="Warnings"
            value={warningApps}
            icon={<AlertTriangle className="w-6 h-6 text-yellow-600" />}
            variant="warning"
          />
          <StatCard
            title="Failing"
            value={failingApps}
            icon={<XCircle className="w-6 h-6 text-red-600" />}
            variant="danger"
          />
        </div>

        {/* Applications List */}
        <div>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Applications
              {applications.length > 0 && (
                <span className="text-gray-400 font-normal ml-2">({filteredApplications.length}/{applications.length})</span>
              )}
            </h2>

            {/* Search and Filter Controls */}
            {applications.length > 0 && (
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative flex-1 md:flex-none">
                  <Input
                    type="text"
                    placeholder="Search by name or URL..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">All Statuses</option>
                  <option value="pass">Passing</option>
                  <option value="warn">Warnings</option>
                  <option value="fail">Failing</option>
                </select>
              </div>
            )}
          </div>

          {applications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No applications monitored yet
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  Get started by adding your first application to monitor its SSL/TLS security posture.
                </p>
                <Button onClick={() => setShowAddDialog(true)} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Application
                </Button>
              </CardContent>
            </Card>
          ) : filteredApplications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-16 text-center">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No applications found
                </h3>
                <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                  {searchQuery || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria.'
                    : 'No applications match your filters.'}
                </p>
                {(searchQuery || filterStatus !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery('');
                      setFilterStatus('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map((app) => (
                <ApplicationCard
                  key={app.id}
                  application={app}
                  onRescan={handleRescan}
                  onDelete={handleDeleteApplication}
                  onEdit={openEditDialog}
                />
              ))}
            </div>
          )}
        </div>
      </div>
      {editingApplication && (
        <EditApplicationDialog
          application={editingApplication}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSave={handleUpdateApplication}
        />
      )}
    </div>
  );
};

export default Dashboard;
