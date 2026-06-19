import React from 'react';
import { EventStatus } from '../../types';

interface EventStatusBadgeProps {
  status: EventStatus | string;
}

export const EventStatusBadge: React.FC<EventStatusBadgeProps> = ({ status }) => {
  const getStatusStyles = (s: string) => {
    switch (s) {
      case 'Open':
        return 'bg-green-100 text-green-800';
      case 'Booked':
        return 'bg-blue-100 text-blue-800';
      case 'Completed':
        return 'bg-gray-100 text-gray-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium font-inter ${getStatusStyles(status)}`}>
      {status}
    </span>
  );
};
