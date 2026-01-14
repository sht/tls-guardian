import React from 'react';
import { Card, CardContent } from './ui/card';
import { cn } from '../lib/utils';

const StatCard = ({ title, value, icon, variant = 'default' }) => {
  const variantClasses = {
    default: 'bg-white border-gray-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    danger: 'bg-red-50 border-red-200'
  };

  return (
    <Card className={cn(
      "border",
      variantClasses[variant] || variantClasses.default
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className="p-3 bg-gray-100 rounded-full">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;