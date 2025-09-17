import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { User, Star, Clock, Check, Loader2 } from 'lucide-react';
import { appointmentsAPI } from '../../services/api';

interface BookingData {
  date: string;
  doctorId: string;
  serviceId: string;
  timeSlot: string;
  notes: string;
}

interface Doctor {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: string;
  rating?: number;
  shiftStart?: string;
  shiftEnd?: string;
  isAvailable?: boolean;
}

interface DoctorSelectionStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const DoctorSelectionStep: React.FC<DoctorSelectionStepProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onPrevious 
}) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(data.doctorId);
  const [error, setError] = useState('');

  useEffect(() => {
    if (data.date) {
      loadDoctorsOnDuty(data.date);
    }
  }, [data.date]);

  const loadDoctorsOnDuty = async (date: string) => {
    setLoading(true);
    setError('');
    
    try {
      const response = await appointmentsAPI.getDoctorsOnDuty(date);
      setDoctors(response.doctors || response || []);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      // Don't show error for 401 - just show empty state
      if (error.response?.status !== 401) {
        setError('Failed to load available doctors. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDoctorSelect = (doctorId: string) => {
    setSelectedDoctor(doctorId);
    onUpdate({ doctorId });
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

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mx-auto mb-4">
          <User className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Choose Your Doctor</h3>
        <p className="text-muted-foreground">
          Select from doctors available on {formatDate(data.date)}
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading available doctors...</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-sm text-destructive">{error}</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => loadDoctorsOnDuty(data.date)}
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      ) : doctors.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No doctors are available on the selected date.
          </p>
          <Button variant="outline" onClick={onPrevious}>
            Choose Different Date
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {doctors.map(doctor => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              isSelected={selectedDoctor === doctor.id}
              onSelect={() => handleDoctorSelect(doctor.id)}
            />
          ))}
        </div>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button 
          onClick={onNext} 
          disabled={!selectedDoctor}
          className="px-8"
        >
          Next: Pick Time
        </Button>
      </div>
    </div>
  );
};

interface DoctorCardProps {
  doctor: Doctor;
  isSelected: boolean;
  onSelect: () => void;
}

const DoctorCard: React.FC<DoctorCardProps> = ({ doctor, isSelected, onSelect }) => {
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
        isSelected 
          ? 'ring-2 ring-primary bg-primary/5' 
          : 'hover:bg-muted/50'
      }`}
      onClick={onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg">
                Dr. {doctor.firstName} {doctor.lastName}
              </h4>
              {doctor.specialty && (
                <p className="text-sm text-muted-foreground mb-2">
                  {doctor.specialty}
                </p>
              )}
              
              {doctor.rating && (
                <div className="flex items-center space-x-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{doctor.rating}</span>
                </div>
              )}
              
              {doctor.shiftStart && doctor.shiftEnd && (
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(`2000-01-01T${doctor.shiftStart}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })} - {new Date(`2000-01-01T${doctor.shiftEnd}`).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                      hour12: true
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {isSelected && (
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Check className="h-4 w-4 text-primary-foreground" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DoctorSelectionStep;
