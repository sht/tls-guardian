import React from 'react';
import { cn } from '../lib/utils';

const gradeConfig = {
  'A+': { bg: 'bg-green-500', text: 'text-white', ring: 'ring-green-300' },
  'A': { bg: 'bg-green-500', text: 'text-white', ring: 'ring-green-300' },
  'A-': { bg: 'bg-green-400', text: 'text-white', ring: 'ring-green-200' },
  'B': { bg: 'bg-yellow-400', text: 'text-yellow-900', ring: 'ring-yellow-200' },
  'C': { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-300' },
  'D': { bg: 'bg-red-400', text: 'text-white', ring: 'ring-red-200' },
  'E': { bg: 'bg-red-500', text: 'text-white', ring: 'ring-red-300' },
  'F': { bg: 'bg-red-600', text: 'text-white', ring: 'ring-red-400' },
};

const sizeConfig = {
  sm: {
    container: 'w-10 h-10',
    text: 'text-lg',
  },
  md: {
    container: 'w-14 h-14',
    text: 'text-2xl',
  },
  lg: {
    container: 'w-20 h-20',
    text: 'text-4xl',
  },
  xl: {
    container: 'w-28 h-28',
    text: 'text-5xl',
  },
};

const GradeBadge = ({ grade, size = 'md', showLabel = false }) => {
  const config = gradeConfig[grade] || { bg: 'bg-gray-400', text: 'text-white', ring: 'ring-gray-200' };
  const sizeStyle = sizeConfig[size] || sizeConfig.md;

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          'rounded-2xl flex items-center justify-center font-bold shadow-lg ring-4 transition-transform hover:scale-105',
          config.bg,
          config.text,
          config.ring,
          sizeStyle.container,
          sizeStyle.text
        )}
      >
        {grade || '?'}
      </div>
      {showLabel && (
        <span className="mt-2 text-sm font-medium text-gray-500">
          {grade === 'A+' ? 'Excellent' :
           grade === 'A' || grade === 'A-' ? 'Good' :
           grade === 'B' ? 'Acceptable' :
           grade === 'C' ? 'Needs Improvement' :
           grade === 'D' || grade === 'E' ? 'Poor' :
           grade === 'F' ? 'Critical' : 'Unknown'}
        </span>
      )}
    </div>
  );
};

export default GradeBadge;
