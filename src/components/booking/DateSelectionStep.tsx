import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Calendar, Clock } from 'lucide-react';

interface BookingData {
  date: string;
  doctorId: string;
  serviceId: string;
  timeSlot: string;
  notes: string;
}

interface DateSelectionStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
}

const DateSelectionStep: React.FC<DateSelectionStepProps> = ({ 
  data, 
  onUpdate, 
  onNext 
}) => {
  const [selectedDate, setSelectedDate] = useState(data.date);
  const [isValid, setIsValid] = useState(false);

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    onUpdate({ date });
    
    // Validate date
    const isValidDate = validateDate(date);
    setIsValid(isValidDate);
  };

  const validateDate = (date: string): boolean => {
    if (!date) return false;
    
    const selected = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 30); // 30 days from today
    
    return selected >= today && selected <= maxDate;
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
          <Calendar className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Select Appointment Date</h3>
        <p className="text-muted-foreground">
          Choose your preferred date for the appointment
        </p>
      </div>

      <div className="max-w-md mx-auto">
        <div className="space-y-4">
          <div>
            <label htmlFor="appointment-date" className="block text-sm font-medium mb-2">
              Appointment Date
            </label>
            <input
              id="appointment-date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={getMinDate()}
              max={getMaxDate()}
              className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              required
            />
          </div>

          {selectedDate && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center space-x-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Selected Date:</span>
                <span>{formatDate(selectedDate)}</span>
              </div>
            </div>
          )}

          {selectedDate && !isValid && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">
                Please select a valid date between tomorrow and 30 days from now.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button 
          onClick={onNext} 
          disabled={!isValid}
          className="px-8"
        >
          Next: Choose Doctor
        </Button>
      </div>
    </div>
  );
};

export default DateSelectionStep;














