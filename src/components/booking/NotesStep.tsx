import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent } from '../ui/card';
import { FileText, Clock, User, Stethoscope, Loader2 } from 'lucide-react';
import { appointmentsAPI, servicesAPI } from '../../services/api';

interface BookingData {
  date: string;
  doctorId: string;
  serviceId: string;
  timeSlot: string;
  notes: string;
}

interface NotesStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onPrevious: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const NotesStep: React.FC<NotesStepProps> = ({ 
  data, 
  onUpdate, 
  onPrevious, 
  onSubmit,
  isSubmitting 
}) => {
  const [notes, setNotes] = useState(data.notes);
  const [appointmentSummary, setAppointmentSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (data.serviceId) {
      loadAppointmentSummary();
    }
  }, [data.serviceId]);

  const loadAppointmentSummary = async () => {
    setLoading(true);
    try {
      // Get service details
      const servicesResponse = await servicesAPI.getAll();
      const service = servicesResponse.find((s: any) => s.id === data.serviceId);
      
      // Get doctor details
      const doctorsResponse = await appointmentsAPI.getDoctorsOnDuty(data.date);
      const doctor = doctorsResponse.doctors?.find((d: any) => d.id === data.doctorId);
      
      setAppointmentSummary({
        service,
        doctor
      });
    } catch (error) {
      console.error('Error loading appointment summary:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    onUpdate({ notes: value });
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
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Add Notes & Confirm</h3>
        <p className="text-muted-foreground">
          Add any additional notes for your doctor and review your appointment
        </p>
      </div>

      {/* Appointment Summary */}
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <h4 className="font-semibold text-lg mb-4">Appointment Summary</h4>
            
            {loading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span>Loading appointment details...</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date & Time</p>
                      <p className="font-medium">
                        {formatDate(data.date)} at {formatTime(data.timeSlot)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Doctor</p>
                      <p className="font-medium">
                        {appointmentSummary?.doctor 
                          ? `Dr. ${appointmentSummary.doctor.firstName} ${appointmentSummary.doctor.lastName}`
                          : 'Selected Doctor'
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <Stethoscope className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Service</p>
                      <p className="font-medium">
                        {appointmentSummary?.service?.name || 'Selected Service'}
                        {appointmentSummary?.service?.durationMinutes && 
                          ` (${appointmentSummary.service.durationMinutes} min)`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes Section */}
      <div className="max-w-2xl mx-auto">
        <div className="space-y-2">
          <label htmlFor="appointment-notes" className="text-sm font-medium">
            Additional Notes (Optional)
          </label>
          <Textarea
            id="appointment-notes"
            placeholder="Add any specific concerns, symptoms, or information you'd like your doctor to know about..."
            value={notes}
            onChange={(e) => handleNotesChange(e.target.value)}
            className="min-h-[100px] resize-none"
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {notes.length}/500 characters
          </p>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrevious} disabled={isSubmitting}>
          Previous
        </Button>
        <Button 
          onClick={onSubmit} 
          disabled={isSubmitting}
          className="px-8"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Booking Appointment...
            </>
          ) : (
            'Book Appointment'
          )}
        </Button>
      </div>
    </div>
  );
};

export default NotesStep;
