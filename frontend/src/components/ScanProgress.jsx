import React from 'react';
import { Card, CardContent } from './ui/card';

const ScanProgress = ({ status, progress, currentStep }) => {
  if (!status || status.toLowerCase() !== 'scanning') {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium">Active Scan in Progress</h3>
          <span className="text-sm font-medium text-blue-600">{progress}%</span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
          <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        <p className="text-sm text-gray-600">
          Current step: {currentStep || 'Initializing scan...'}
        </p>
      </CardContent>
    </Card>
  );
};

export default ScanProgress;