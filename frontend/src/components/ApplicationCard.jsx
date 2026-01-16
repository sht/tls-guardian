import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import GradeBadge from './GradeBadge';
import { RefreshCw, Trash2, Clock, AlertCircle, Pencil, AlertTriangle } from 'lucide-react';

const ApplicationCard = ({ application, onRescan, onDelete, onEdit }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/application/${application.id}`);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never scanned';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Check certificate expiration
  const certExpirationStatus = useMemo(() => {
    if (!application.detailed_ssl_info?.certificate_info) {
      return null;
    }

    const certInfo = application.detailed_ssl_info.certificate_info;
    let expirationDate = null;

    // Look for certificate expiration date in the cert info
    for (const [key, value] of Object.entries(certInfo)) {
      if (key.toLowerCase().includes('not_after') ||
          key.toLowerCase().includes('expires') ||
          key.toLowerCase().includes('expiration')) {
        if (value.finding) {
          try {
            const parsed = new Date(value.finding);
            if (!isNaN(parsed.getTime())) {
              expirationDate = parsed;
              break;
            }
          } catch (e) {
            // Continue searching
          }
        }
      }
    }

    if (!expirationDate) {
      return null;
    }

    const now = new Date();
    const daysUntilExpiry = Math.floor((expirationDate - now) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { status: 'expired', days: Math.abs(daysUntilExpiry) };
    } else if (daysUntilExpiry <= 7) {
      return { status: 'critical', days: daysUntilExpiry };
    } else if (daysUntilExpiry <= 30) {
      return { status: 'warning', days: daysUntilExpiry };
    }

    return null;
  }, [application]);

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 ${
        certExpirationStatus?.status === 'expired' ? 'border-l-red-600 hover:border-l-red-600' :
        certExpirationStatus?.status === 'critical' ? 'border-l-red-500 hover:border-l-red-500' :
        certExpirationStatus?.status === 'warning' ? 'border-l-yellow-500 hover:border-l-yellow-500' :
        'border-l-transparent hover:border-l-blue-500'
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-5">
        {/* Certificate Expiration Warning Banner */}
        {certExpirationStatus && (
          <div className={`mb-4 p-3 rounded-lg flex items-start gap-3 ${
            certExpirationStatus.status === 'expired' ? 'bg-red-50 border border-red-200' :
            certExpirationStatus.status === 'critical' ? 'bg-red-50 border border-red-200' :
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
              certExpirationStatus.status === 'expired' ? 'text-red-600' :
              certExpirationStatus.status === 'critical' ? 'text-red-600' :
              'text-yellow-600'
            }`} />
            <div>
              <p className={`text-sm font-semibold ${
                certExpirationStatus.status === 'expired' ? 'text-red-800' :
                certExpirationStatus.status === 'critical' ? 'text-red-800' :
                'text-yellow-800'
              }`}>
                {certExpirationStatus.status === 'expired'
                  ? `Certificate expired ${certExpirationStatus.days} day${certExpirationStatus.days > 1 ? 's' : ''} ago`
                  : certExpirationStatus.status === 'critical'
                  ? `Certificate expires in ${certExpirationStatus.days} day${certExpirationStatus.days > 1 ? 's' : ''}`
                  : `Certificate expires in ${certExpirationStatus.days} day${certExpirationStatus.days > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          {/* Status Badge */}
          <div className="flex-shrink-0">
            <GradeBadge grade={application.status} size="lg" />
          </div>

          {/* Application Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base sm:text-lg text-gray-900 truncate">
              {application.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 truncate mt-0.5">
              {application.url}
            </p>

            <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3 text-xs sm:text-sm flex-wrap">
              <div className="flex items-center text-gray-500">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                {formatDate(application.last_scan_time)}
              </div>

              {application.issue_count !== undefined && (
                <div className={`flex items-center ${
                  application.issue_count > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                  {application.issue_count} {application.issue_count === 1 ? 'issue' : 'issues'}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex gap-1 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(application);
              }}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                onRescan(application.id);
              }}
              title="Rescan"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(application.id, application.name);
              }}
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationCard;
