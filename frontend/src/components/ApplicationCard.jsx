import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import GradeBadge from './GradeBadge';
import { RefreshCw, Trash2, Clock, AlertCircle } from 'lucide-react';

const ApplicationCard = ({ application, onRescan, onDelete }) => {
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

  return (
    <Card
      className="hover:shadow-lg transition-all duration-200 cursor-pointer border-l-4 border-l-transparent hover:border-l-blue-500"
      onClick={handleClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center gap-5">
          {/* Grade Badge */}
          <div className="flex-shrink-0">
            <GradeBadge grade={application.grade || application.status} size="lg" />
          </div>

          {/* Application Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-gray-900 truncate">
              {application.name}
            </h3>
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {application.url}
            </p>

            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center text-gray-500">
                <Clock className="w-4 h-4 mr-1.5" />
                {formatDate(application.last_scan_time)}
              </div>

              {application.issue_count !== undefined && (
                <div className={`flex items-center ${
                  application.issue_count > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  <AlertCircle className="w-4 h-4 mr-1.5" />
                  {application.issue_count} {application.issue_count === 1 ? 'issue' : 'issues'}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex-shrink-0 flex gap-2">
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
