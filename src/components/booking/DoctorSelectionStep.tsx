import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { User, Star, Clock, Check, Loader2, AlertCircle, Users } from 'lucide-react';
import { appointmentsAPI, staffAPI } from '../../services/api';

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
  isFullyBooked?: boolean;
  isOnDuty?: boolean;
  availableSlots?: number;
  totalSlots?: number;
  unavailabilityReason?: string;
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
  const [showFullyBooked, setShowFullyBooked] = useState(true); // Show all doctors by default

  useEffect(() => {
    if (data.date) {
      loadDoctorsOnDuty(data.date);
    }
  }, [data.date]);

  const loadDoctorsOnDuty = async (date: string) => {
    setLoading(true);
    setError('');
    
    try {
      // First, get ALL doctors (not just those on duty)
      const allDoctorsResponse = await staffAPI.getByRole('doctor');
      const allDoctors = allDoctorsResponse || [];
      
      console.log('🔍 API: Loaded all doctors:', allDoctors.length);
      
      // Then, check each doctor's availability for the selected date
      const doctorsWithAvailability = await Promise.all(
        allDoctors.map(async (doctor: Doctor) => {
          try {
            // Check if doctor is on duty (shift schedule)
            const shiftResponse = await appointmentsAPI.filterDoctorsByAvailability([doctor], date);
            const isOnDuty = shiftResponse.length > 0 && shiftResponse[0].isOnDuty;
            
            if (isOnDuty) {
              // If on duty, check time slot availability
              try {
                const slotsResponse = await appointmentsAPI.getAvailableSlotsByDoctor(doctor.id, date);
                const availableSlots = slotsResponse.availableSlots || slotsResponse || [];
                const totalSlots = availableSlots.length;
                const isFullyBooked = totalSlots === 0;
                
                return {
                  ...doctor,
                  isOnDuty: true,
                  isFullyBooked,
                  availableSlots: totalSlots,
                  totalSlots: totalSlots,
                  isAvailable: !isFullyBooked,
                  shiftStart: shiftResponse[0]?.shiftStart,
                  shiftEnd: shiftResponse[0]?.shiftEnd
                };
              } catch (slotError) {
                console.warn(`Could not check time slots for doctor ${doctor.id}:`, slotError);
                return {
                  ...doctor,
                  isOnDuty: true,
                  isFullyBooked: false,
                  availableSlots: 0,
                  totalSlots: 0,
                  isAvailable: true,
                  shiftStart: shiftResponse[0]?.shiftStart,
                  shiftEnd: shiftResponse[0]?.shiftEnd
                };
              }
            } else {
              // Doctor is not on duty
              return {
                ...doctor,
                isOnDuty: false,
                isFullyBooked: false,
                availableSlots: 0,
                totalSlots: 0,
                isAvailable: false,
                unavailabilityReason: "Not scheduled to work on this day"
              };
            }
          } catch (error) {
            console.warn(`Could not check availability for doctor ${doctor.id}:`, error);
            // If we can't check availability, assume they're not on duty
            return {
              ...doctor,
              isOnDuty: false,
              isFullyBooked: false,
              availableSlots: 0,
              totalSlots: 0,
              isAvailable: false,
              unavailabilityReason: "Unable to verify schedule"
            };
          }
        })
      );
      
      setDoctors(doctorsWithAvailability);
    } catch (error: any) {
      console.error('Error loading doctors:', error);
      // Don't show error for 401 - just show empty state
      if (error.response?.status !== 401) {
        setError('Failed to load doctors. Please try again.');
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

  // Categorize doctors for display purposes
  const availableDoctors = doctors.filter(doctor => doctor.isOnDuty && !doctor.isFullyBooked);
  const fullyBookedDoctors = doctors.filter(doctor => doctor.isOnDuty && doctor.isFullyBooked);
  const unavailableDoctors = doctors.filter(doctor => !doctor.isOnDuty);
  
  // Always show ALL doctors, but allow toggling between all and available only
  const displayedDoctors = showFullyBooked ? doctors : availableDoctors;

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
      ) : displayedDoctors.length === 0 ? (
        <div className="text-center py-8">
          {availableDoctors.length === 0 && fullyBookedDoctors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-orange-800">All Doctors Fully Booked</h3>
              <p className="text-muted-foreground mb-4">
                Unfortunately, all doctors are fully booked for {formatDate(data.date)}. 
                Please try a different date or contact us for assistance.
              </p>
              <div className="space-y-2">
                <Button variant="outline" onClick={onPrevious}>
                  Choose Different Date
                </Button>
                {fullyBookedDoctors.length > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowFullyBooked(!showFullyBooked)}
                    className="text-sm"
                  >
                    {showFullyBooked ? 'Hide' : 'Show'} Fully Booked Doctors ({fullyBookedDoctors.length})
                  </Button>
                )}
              </div>
            </div>
          ) : availableDoctors.length === 0 && unavailableDoctors.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-red-800">No Doctors On Duty</h3>
              <p className="text-muted-foreground mb-4">
                No doctors are scheduled to work on {formatDate(data.date)}. 
                Please choose a different date or contact us for assistance.
              </p>
              <div className="space-y-2">
                <Button variant="outline" onClick={onPrevious}>
                  Choose Different Date
                </Button>
                {unavailableDoctors.length > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setShowFullyBooked(!showFullyBooked)}
                    className="text-sm"
                  >
                    {showFullyBooked ? 'Hide' : 'Show'} Unavailable Doctors ({unavailableDoctors.length})
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-muted-foreground mb-4">
                No doctors are available on the selected date.
              </p>
              <Button variant="outline" onClick={onPrevious}>
                Choose Different Date
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Show toggle when there are unavailable doctors */}
          {(fullyBookedDoctors.length > 0 || unavailableDoctors.length > 0) && (
            <div className="flex items-center justify-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {availableDoctors.length} available
                  {fullyBookedDoctors.length > 0 && `, ${fullyBookedDoctors.length} fully booked`}
                  {unavailableDoctors.length > 0 && `, ${unavailableDoctors.length} not on duty`}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowFullyBooked(!showFullyBooked)}
              >
                {showFullyBooked ? 'Show Available Only' : 'Show All Doctors'}
              </Button>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {displayedDoctors.map(doctor => (
              <DoctorCard
                key={doctor.id}
                doctor={doctor}
                isSelected={selectedDoctor === doctor.id}
                onSelect={() => handleDoctorSelect(doctor.id)}
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
  const isFullyBooked = doctor.isFullyBooked;
  const isNotOnDuty = !doctor.isOnDuty;
  const isDisabled = (isFullyBooked || isNotOnDuty) && !isSelected;

  return (
    <Card 
      className={`transition-all duration-200 ${
        isDisabled
          ? 'opacity-60 cursor-not-allowed bg-muted/30'
          : isSelected 
          ? 'ring-2 ring-primary bg-primary/5 cursor-pointer hover:shadow-md' 
          : 'cursor-pointer hover:shadow-md hover:bg-muted/50'
      }`}
      onClick={isDisabled ? undefined : onSelect}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isNotOnDuty 
                ? 'bg-red-100' 
                : isFullyBooked 
                ? 'bg-orange-100' 
                : 'bg-primary/10'
            }`}>
              {isNotOnDuty ? (
                <AlertCircle className="h-6 w-6 text-red-600" />
              ) : isFullyBooked ? (
                <AlertCircle className="h-6 w-6 text-orange-600" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <h4 className={`font-semibold text-lg ${
                isDisabled ? 'text-muted-foreground' : ''
              }`}>
                Dr. {doctor.firstName} {doctor.lastName}
                {isNotOnDuty && (
                  <span className="ml-2 text-sm font-normal text-red-600">
                    (Not On Duty)
                  </span>
                )}
                {isFullyBooked && !isNotOnDuty && (
                  <span className="ml-2 text-sm font-normal text-orange-600">
                    (Fully Booked)
                  </span>
                )}
              </h4>
              {doctor.specialty && (
                <p className="text-sm text-muted-foreground mb-2">
                  {doctor.specialty}
                </p>
              )}
              
              {doctor.rating && !isDisabled && (
                <div className="flex items-center space-x-1 mb-2">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{doctor.rating}</span>
                </div>
              )}
              
              {doctor.shiftStart && doctor.shiftEnd && !isNotOnDuty && (
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

              {/* Show availability information */}
              {!isDisabled && doctor.availableSlots !== undefined && (
                <div className="mt-2 text-sm text-green-600 font-medium">
                  {doctor.availableSlots} slot{doctor.availableSlots !== 1 ? 's' : ''} available
                </div>
              )}

              {isNotOnDuty && (
                <div className="mt-2 text-sm text-red-600">
                  Not scheduled to work on this date
                </div>
              )}

              {isFullyBooked && !isNotOnDuty && (
                <div className="mt-2 text-sm text-orange-600">
                  No available slots for this date
                </div>
              )}
            </div>
          </div>
          
          {isSelected && !isDisabled && (
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
