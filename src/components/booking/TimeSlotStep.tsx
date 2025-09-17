import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Clock, Loader2 } from 'lucide-react';
import { appointmentsAPI } from '../../services/api';

interface BookingData {
  date: string;
  doctorId: string;
  serviceId: string;
  timeSlot: string;
  notes: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  duration: number;
  isAvailable: boolean;
}

interface TimeSlotStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const TimeSlotStep: React.FC<TimeSlotStepProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onPrevious 
}) => {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState(data.timeSlot);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data.doctorId && data.date) {
      loadAvailableSlots(data.doctorId, data.date);
    }
  }, [data.doctorId, data.date]);

  const loadAvailableSlots = async (doctorId: string, date: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await appointmentsAPI.getAvailableSlotsByDoctor(doctorId, date);
      setTimeSlots(response.availableSlots || response || []);
    } catch (error: any) {
      console.error('Error loading time slots:', error);
      setError('Failed to load available time slots. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSlotSelect = (slot: string) => {
    setSelectedSlot(slot);
    onUpdate({ timeSlot: slot });
  };

  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate time slots if none are available from API
  const generateTimeSlots = () => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    const slotDuration = 30; // 30 minutes

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        const startTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const endTime = minute + slotDuration >= 60 
          ? `${(hour + 1).toString().padStart(2, '0')}:${((minute + slotDuration) % 60).toString().padStart(2, '0')}`
          : `${hour.toString().padStart(2, '0')}:${(minute + slotDuration).toString().padStart(2, '0')}`;

        slots.push({
          startTime,
          endTime,
          duration: slotDuration,
          isAvailable: true
        });
      }
    }

    return slots;
  };

  const availableSlots = timeSlots.length > 0 ? timeSlots : generateTimeSlots();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
          <Clock className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Select Time Slot</h3>
        <p className="text-muted-foreground">
          Choose from available times for your selected doctor on {formatDate(data.date)}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading available time slots...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadAvailableSlots(data.doctorId, data.date)}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      ) : availableSlots.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No time slots are available for the selected doctor on this date.
          </p>
          <Button variant="outline" onClick={onPrevious}>
            Choose Different Doctor
          </Button>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {availableSlots.map((slot, index) => (
              <TimeSlotButton
                key={`${slot.startTime}-${index}`}
                slot={slot}
                isSelected={selectedSlot === slot.startTime}
                onSelect={() => handleSlotSelect(slot.startTime)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!selectedSlot}
          className="px-8"
        >
          Next: Select Service
        </Button>
      </div>
    </div>
  );
};

interface TimeSlotButtonProps {
  slot: TimeSlot;
  isSelected: boolean;
  onSelect: () => void;
}

const TimeSlotButton: React.FC<TimeSlotButtonProps> = ({ slot, isSelected, onSelect }) => {
  const formatTime = (timeString: string) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <button
      className={`p-3 rounded-lg border text-center transition-all duration-200 ${
        !slot.isAvailable
          ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          : isSelected
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-background hover:bg-muted hover:border-primary/50 cursor-pointer'
      }`}
      onClick={onSelect}
      disabled={!slot.isAvailable}
    >
      <div className="text-sm font-medium">
        {formatTime(slot.startTime)}
      </div>
      <div className="text-xs text-muted-foreground">
        {slot.duration} min
      </div>
    </button>
  );
};

export default TimeSlotStep;


