import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
}

export const StatCard = ({ title, value, icon, trend, trendUp }: StatCardProps) => {
  return (
    <Card className="p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-text/70 font-inter">{title}</h3>
          <p className="text-2xl font-poppins font-bold text-primary mt-1">{value}</p>
        </div>
        {icon && <div className="text-primary/50">{icon}</div>}
      </div>
      {trend && (
        <div className={`text-xs font-inter ${trendUp ? 'text-success' : 'text-warning'}`}>
          {trend}
        </div>
      )}
    </Card>
  );
};
