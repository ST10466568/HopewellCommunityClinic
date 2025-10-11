import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import DateSelectionStep from './booking/DateSelectionStep';
import DoctorSelectionStep from './booking/DoctorSelectionStep';
import TimeSlotStep from './booking/TimeSlotStep';
import ServiceSelectionStep from './booking/ServiceSelectionStep';
import NotesStep from './booking/NotesStep';
import { appointmentsAPI } from '../services/api';

interface BookingData {
  date: string;
  doctorId: string;
  serviceId: string;
  timeSlot: string;
  notes: string;
}

interface BookingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  services: any[];
  patientId: string | null;
}

const BookingWizard: React.FC<BookingWizardProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  services,
  patientId
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [bookingData, setBookingData] = useState<BookingData>({
    date: '',
    doctorId: '',
    serviceId: '',
    timeSlot: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const steps = [
    { id: 1, title: 'Select Date', description: 'Choose your preferred date' },
    { id: 2, title: 'Choose Doctor', description: 'Select from available doctors' },
    { id: 3, title: 'Pick Time', description: 'Choose your time slot' },
    { id: 4, title: 'Select Service', description: 'Choose the service you need' },
    { id: 5, title: 'Add Notes', description: 'Add any additional notes' }
  ];

  const updateBookingData = (data: Partial<BookingData>) => {
    setBookingData(prev => ({ ...prev, ...data }));
    setError('');
  };

  const resetBooking = () => {
    setCurrentStep(1);
    setBookingData({
      date: '',
      doctorId: '',
      serviceId: '',
      timeSlot: '',
      notes: ''
    });
    setError('');
  };

  const handleClose = () => {
    resetBooking();
    onClose();
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Helper function to calculate end time based on start time and service duration
  const calculateEndTime = (startTime: string, serviceId: string): string => {
    const selectedService = services.find(service => service.id === serviceId);
    if (!selectedService || !selectedService.durationMinutes) {
      // Default to 30 minutes if service not found or no duration
      const durationMinutes = 30;
      const [hours, minutes] = startTime.split(':').map(Number);
      const startDate = new Date();
      startDate.setHours(hours, minutes, 0, 0);
      const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
      return endDate.toTimeString().slice(0, 5);
    }

    const durationMinutes = selectedService.durationMinutes;
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
    return endDate.toTimeString().slice(0, 5);
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setError('');

      // Validate all required fields
      if (!bookingData.date || !bookingData.doctorId || !bookingData.serviceId || !bookingData.timeSlot) {
        setError('Please complete all required fields');
        return;
      }

      // Validate patientId
      if (!patientId) {
        setError('Patient ID is required. Please contact support - your account may not be properly linked to a patient record.');
        return;
      }

      // Calculate end time
      const endTime = calculateEndTime(bookingData.timeSlot, bookingData.serviceId);

      // Create appointment
      const appointmentData = {
        patientId: patientId, // Use the actual patient ID
        staffId: bookingData.doctorId,
        serviceId: bookingData.serviceId,
        appointmentDate: bookingData.date,
        startTime: bookingData.timeSlot,
        endTime: endTime, // Add calculated end time
        notes: bookingData.notes
      };

      console.log('Sending appointment data:', appointmentData);
      await appointmentsAPI.create(appointmentData);
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating appointment:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      setError(error.response?.data?.error || error.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepComponent = () => {
    switch (currentStep) {
      case 1:
        return (
          <DateSelectionStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={handleNext}
          />
        );
      case 2:
        return (
          <DoctorSelectionStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 3:
        return (
          <TimeSlotStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        );
      case 4:
        return (
          <ServiceSelectionStep
            data={bookingData}
            onUpdate={updateBookingData}
            onNext={handleNext}
            onPrevious={handlePrevious}
            services={services}
          />
        );
      case 5:
        return (
          <NotesStep
            data={bookingData}
            onUpdate={updateBookingData}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
          />
        );
      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Book New Appointment</CardTitle>
            <p className="text-sm text-muted-foreground">
              Step {currentStep} of 5: {steps[currentStep - 1].description}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        {/* Progress Bar */}
        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-2">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    step.id <= currentStep
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.id < currentStep ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    step.id
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-12 h-0.5 mx-2 ${
                      step.id < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            {steps.map(step => (
              <span key={step.id} className="text-center max-w-16">
                {step.title}
              </span>
            ))}
          </div>
        </div>

        <CardContent className="px-6 pb-6 overflow-y-auto max-h-[60vh]">
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {getStepComponent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default BookingWizard;
