import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsAPI, servicesAPI, patientsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import FormSelect from '../components/forms/FormSelect';
import FormInput from '../components/forms/FormInput';
import FormTextarea from '../components/forms/FormTextarea';

const PatientDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [patientId, setPatientId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingData, setBookingData] = useState({
    serviceId: '',
    appointmentDate: '',
    startTime: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // First, get the Patient ID from the ApplicationUser ID
      const patient = await patientsAPI.getByUserId(user.id);
      setPatientId(patient.id);
      
      const [appointmentsData, servicesData] = await Promise.all([
        appointmentsAPI.getByPatient(patient.id),
        servicesAPI.getAll()
      ]);
      setAppointments(appointmentsData);
      setServices(servicesData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));
    setBookingError('');

    // Load available slots when date is selected
    if (name === 'appointmentDate' && value) {
      loadAvailableSlots(value);
    }
  };

  const loadAvailableSlots = async (date) => {
    try {
      const slots = await appointmentsAPI.getAvailable(date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if (!bookingData.serviceId || !bookingData.appointmentDate || !bookingData.startTime) {
      setBookingError('Please fill in all required fields');
      return;
    }

    setIsBooking(true);
    setBookingError('');

    try {
      // Calculate end time based on service duration
      const selectedService = services.find(s => s.id === bookingData.serviceId);
      
      // Ensure startTime is in HH:mm:ss format
      const startTimeFormatted = bookingData.startTime.includes(':') && bookingData.startTime.split(':').length === 2 
        ? bookingData.startTime + ':00' 
        : bookingData.startTime;
      
      const startTime = new Date(`2000-01-01T${startTimeFormatted}`);
      const endTime = new Date(startTime.getTime() + (selectedService?.durationMinutes || 30) * 60000);
      
      const endTimeString = endTime.toTimeString().slice(0, 8); // Format as HH:mm:ss
      
      await appointmentsAPI.create({
        patientId: patientId,
        serviceId: bookingData.serviceId,
        appointmentDate: bookingData.appointmentDate,
        startTime: startTimeFormatted,
        endTime: endTimeString,
        notes: bookingData.notes || ''
      });

      // Refresh appointments
      await loadDashboardData();
      
      // Close modal and reset form
      setShowBookingModal(false);
      setBookingData({
        serviceId: '',
        appointmentDate: '',
        startTime: '',
        notes: ''
      });
      setAvailableSlots([]);
      
      alert('Appointment booked successfully!');
    } catch (error) {
      setBookingError(error.error || error.message || 'Failed to book appointment');
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelAppointment = async (appointmentId) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await appointmentsAPI.delete(appointmentId);
      await loadDashboardData();
      alert('Appointment cancelled successfully!');
    } catch (error) {
      alert('Failed to cancel appointment: ' + (error.error || error.message));
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'text-success';
      case 'scheduled': return 'text-primary';
      case 'cancelled': return 'text-error';
      case 'completed': return 'text-secondary';
      default: return 'text-secondary';
    }
  };

  const upcomingAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) >= new Date() && 
    apt.status !== 'cancelled' && 
    apt.status !== 'completed'
  );

  const pastAppointments = appointments.filter(apt => 
    new Date(apt.appointmentDate) < new Date() || 
    apt.status === 'cancelled' || 
    apt.status === 'completed'
  );

  if (isLoading) {
    return React.createElement(LoadingSpinner, {
      size: 'lg',
      text: 'Loading your dashboard...'
    });
  }

  return React.createElement('div', {
    className: 'space-y-6'
  },
    // Welcome section
    React.createElement('div', {
      className: 'bg-white rounded-lg shadow-md p-6'
    },
      React.createElement('h1', {
        className: 'text-3xl font-bold text-primary mb-2'
      }, `Welcome back, ${user.firstName}!`),
      React.createElement('p', {
        className: 'text-secondary'
      }, 'Here\'s an overview of your appointments and health information.')
    ),

    // Quick stats
    React.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-3 gap-6'
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-primary mb-2'
        }, upcomingAppointments.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Upcoming Appointments')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-success mb-2'
        }, pastAppointments.filter(apt => apt.status === 'completed').length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Completed Visits')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-warning mb-2'
        }, appointments.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Total Appointments')
      )
    ),

    // Book new appointment button
    React.createElement('div', {
      className: 'text-center'
    },
      React.createElement('button', {
        className: 'btn btn-primary btn-lg',
        onClick: () => setShowBookingModal(true)
      }, '📅 Book New Appointment')
    ),

    // Upcoming appointments
    React.createElement('div', {
      className: 'bg-white rounded-lg shadow-md'
    },
      React.createElement('div', {
        className: 'p-6 border-b border-light'
      },
        React.createElement('h2', {
          className: 'text-2xl font-semibold text-primary'
        }, 'Upcoming Appointments')
      ),
      React.createElement('div', {
        className: 'p-6'
      },
        upcomingAppointments.length === 0 ? 
          React.createElement('p', {
            className: 'text-secondary text-center py-8'
          }, 'No upcoming appointments. Book one now!') :
          React.createElement('div', {
            className: 'space-y-4'
          },
            upcomingAppointments.map(appointment =>
              React.createElement('div', {
                key: appointment.id,
                className: 'border border-light rounded-lg p-4 hover:shadow-md transition-shadow'
              },
                React.createElement('div', {
                  className: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4'
                },
                  React.createElement('div', null,
                    React.createElement('h3', {
                      className: 'text-lg font-semibold text-primary'
                    }, appointment.service?.name || 'Service'),
                    React.createElement('p', {
                      className: 'text-secondary'
                    }, formatDate(appointment.appointmentDate)),
                    React.createElement('p', {
                      className: 'text-secondary'
                    }, formatTime(appointment.startTime)),
                    appointment.staff && React.createElement('p', {
                      className: 'text-secondary'
                    }, `Dr. ${appointment.staff.firstName} ${appointment.staff.lastName}`)
                  ),
                  React.createElement('div', {
                    className: 'flex flex-col md:items-end gap-2'
                  },
                    React.createElement('span', {
                      className: `font-medium capitalize ${getStatusColor(appointment.status)}`
                    }, appointment.status),
                    React.createElement('button', {
                      className: 'btn btn-danger btn-sm',
                      onClick: () => handleCancelAppointment(appointment.id)
                    }, 'Cancel')
                  )
                )
              )
            )
          )
      )
    ),

    // Past appointments
    pastAppointments.length > 0 && React.createElement('div', {
      className: 'bg-white rounded-lg shadow-md'
    },
      React.createElement('div', {
        className: 'p-6 border-b border-light'
      },
        React.createElement('h2', {
          className: 'text-2xl font-semibold text-primary'
        }, 'Appointment History')
      ),
      React.createElement('div', {
        className: 'p-6'
      },
        React.createElement('div', {
          className: 'space-y-4'
        },
          pastAppointments.slice(0, 5).map(appointment =>
            React.createElement('div', {
              key: appointment.id,
              className: 'border border-light rounded-lg p-4'
            },
              React.createElement('div', {
                className: 'flex flex-col md:flex-row md:items-center md:justify-between gap-4'
              },
                React.createElement('div', null,
                  React.createElement('h3', {
                    className: 'text-lg font-semibold text-primary'
                  }, appointment.service?.name || 'Service'),
                  React.createElement('p', {
                    className: 'text-secondary'
                  }, formatDate(appointment.appointmentDate)),
                  React.createElement('p', {
                    className: 'text-secondary'
                  }, formatTime(appointment.startTime))
                ),
                React.createElement('span', {
                  className: `font-medium capitalize ${getStatusColor(appointment.status)}`
                }, appointment.status)
              )
            )
          )
        )
      )
    ),

    // Booking modal
    React.createElement(Modal, {
      isOpen: showBookingModal,
      onClose: () => setShowBookingModal(false),
      title: 'Book New Appointment',
      size: 'lg'
    },
      React.createElement('form', {
        onSubmit: handleBookAppointment
      },
        bookingError && React.createElement('div', {
          className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6'
        }, bookingError),

        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
        },
          React.createElement(FormSelect, {
            label: 'Service',
            name: 'serviceId',
            value: bookingData.serviceId,
            onChange: handleBookingInputChange,
            options: services.map(service => ({
              value: service.id,
              label: service.name
            })),
            required: true
          }),
          React.createElement(FormInput, {
            label: 'Date',
            name: 'appointmentDate',
            type: 'date',
            value: bookingData.appointmentDate,
            onChange: handleBookingInputChange,
            required: true,
            min: new Date().toISOString().split('T')[0]
          })
        ),

        bookingData.appointmentDate && availableSlots.length > 0 && React.createElement(FormSelect, {
          label: 'Available Time',
          name: 'startTime',
          value: bookingData.startTime,
          onChange: handleBookingInputChange,
          options: availableSlots.map(slot => ({
            value: slot.startTime,
            label: formatTime(slot.startTime),
            key: slot.id || slot.startTime // Use slot ID as key to avoid duplicates
          })),
          required: true
        }),

        React.createElement(FormTextarea, {
          label: 'Notes (Optional)',
          name: 'notes',
          value: bookingData.notes,
          onChange: handleBookingInputChange,
          placeholder: 'Any additional information or concerns...'
        }),

        React.createElement('div', {
          className: 'flex gap-4 justify-end mt-6'
        },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onClick: () => setShowBookingModal(false)
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary',
            disabled: isBooking
          },
            isBooking && React.createElement('div', {
              className: 'loading-spinner w-4 h-4 mr-2'
            }),
            isBooking ? 'Booking...' : 'Book Appointment'
          )
        )
      )
    )
  );
};

export default PatientDashboard;
