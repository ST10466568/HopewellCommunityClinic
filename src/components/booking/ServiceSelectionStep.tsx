import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Stethoscope, Clock, Check } from 'lucide-react';

interface BookingData {
  date: string;
  doctorId: string;
  serviceId: string;
  timeSlot: string;
  notes: string;
}

interface Service {
  id: string;
  name: string;
  description?: string;
  durationMinutes: number;
  price?: number;
}

interface ServiceSelectionStepProps {
  data: BookingData;
  onUpdate: (data: Partial<BookingData>) => void;
  onNext: () => void;
  onPrevious: () => void;
  services: Service[];
}

const ServiceSelectionStep: React.FC<ServiceSelectionStepProps> = ({ 
  data, 
  onUpdate, 
  onNext, 
  onPrevious,
  services 
}) => {
  const [selectedService, setSelectedService] = useState(data.serviceId);

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
    onUpdate({ serviceId });
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
          <Stethoscope className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Select Service</h3>
        <p className="text-muted-foreground">
          Choose the service you need for your appointment
        </p>
      </div>

      {/* Appointment Summary */}
      <div className="max-w-md mx-auto p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2">Appointment Summary</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDate(data.date)}</span>
          </div>
          <div className="flex justify-between">
            <span>Time:</span>
            <span>{formatTime(data.timeSlot)}</span>
          </div>
        </div>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">
            No services are currently available.
          </p>
          <Button variant="outline" onClick={onPrevious}>
            Go Back
          </Button>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {services.map(service => (
              <ServiceCard
                key={service.id}
                service={service}
                isSelected={selectedService === service.id}
                onSelect={() => handleServiceSelect(service.id)}
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
          disabled={!selectedService}
          className="px-8"
        >
          Next: Add Notes
        </Button>
      </div>
    </div>
  );
};

interface ServiceCardProps {
  service: Service;
  isSelected: boolean;
  onSelect: () => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, isSelected, onSelect }) => {
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
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-lg mb-1">
                {service.name}
              </h4>
              {service.description && (
                <p className="text-sm text-muted-foreground mb-2">
                  {service.description}
                </p>
              )}
              
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{service.durationMinutes} minutes</span>
                </div>
                {service.price && (
                  <div className="font-medium text-primary">
                    ${service.price}
                  </div>
                )}
              </div>
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

export default ServiceSelectionStep;
