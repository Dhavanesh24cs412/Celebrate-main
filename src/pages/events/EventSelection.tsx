import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { 
  Heart, 
  GlassWater, 
  Diamond, 
  CalendarHeart, 
  Cake, 
  Home, 
  Baby, 
  Smile, 
  Briefcase 
} from 'lucide-react';

const EVENT_TYPES = [
  { name: 'Wedding', icon: Heart, color: 'bg-rose-50 text-rose-500 border-rose-100' },
  { name: 'Reception', icon: GlassWater, color: 'bg-purple-50 text-purple-500 border-purple-100' },
  { name: 'Engagement', icon: Diamond, color: 'bg-blue-50 text-blue-500 border-blue-100' },
  { name: 'Anniversary', icon: CalendarHeart, color: 'bg-pink-50 text-pink-500 border-pink-100' },
  { name: 'Birthday Celebration', icon: Cake, color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
  { name: 'Housewarming', icon: Home, color: 'bg-green-50 text-green-500 border-green-100' },
  { name: 'Seemantham', icon: Baby, color: 'bg-teal-50 text-teal-500 border-teal-100' },
  { name: 'Naming Ceremony', icon: Smile, color: 'bg-orange-50 text-orange-500 border-orange-100' },
  { name: 'Corporate Event', icon: Briefcase, color: 'bg-gray-50 text-gray-600 border-gray-200' }
];

export const EventSelection = () => {
  const navigate = useNavigate();

  const handleSelect = (eventType: string) => {
    // URL-safe encoding
    navigate(`/client/events/create/${encodeURIComponent(eventType)}`);
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 pb-12">
      
      <div className="text-center mt-4 mb-4">
        <h1 className="text-3xl md:text-4xl font-poppins font-bold text-primary mb-3">What are we celebrating?</h1>
        <p className="text-text/70 font-inter text-lg">Select the type of event you want to plan</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {EVENT_TYPES.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.name}
              onClick={() => handleSelect(type.name)}
              className="text-left w-full focus:outline-none transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <Card className={`p-8 h-full flex flex-col items-center justify-center text-center border-2 border-transparent hover:border-primary/20 transition-all cursor-pointer group shadow-sm hover:shadow-md ${type.color.split(' ')[0]}`}>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${type.color} bg-white shadow-sm transition-transform group-hover:scale-110`}>
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-poppins font-semibold text-text">{type.name}</h3>
              </Card>
            </button>
          );
        })}
      </div>

    </div>
  );
};
