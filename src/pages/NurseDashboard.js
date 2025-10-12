import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { appointmentsAPI, patientsAPI, servicesAPI, staffAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import FormSelect from '../components/forms/FormSelect';
import FormInput from '../components/forms/FormInput';
import FormTextarea from '../components/forms/FormTextarea';

const NurseDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [services, setServices] = useState([]);
  const [staff, setStaff] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [bookingData, setBookingData] = useState({
    patientId: '',
    staffId: '',
    serviceId: '',
    appointmentDate: '',
    startTime: '',
    notes: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [appointmentsData, servicesData, staffData] = await Promise.all([
        appointmentsAPI.getToday(),
        servicesAPI.getAll(),
        staffAPI.getAll()
      ]);
      setAppointments(appointmentsData);
      setServices(servicesData);
      setStaff(staffData);
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
    setError('');

    // Load available slots when date and staff are selected
    if ((name === 'appointmentDate' || name === 'staffId') && bookingData.appointmentDate && bookingData.staffId) {
      loadAvailableSlots(bookingData.appointmentDate, value === 'staffId' ? value : bookingData.staffId);
    }
  };

  const loadAvailableSlots = async (date, staffId) => {
    try {
      const slots = await staffAPI.getAvailability(staffId, date);
      setAvailableSlots(slots);
    } catch (error) {
      console.error('Error loading available slots:', error);
    }
  };

  const handleSearchPatients = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const results = await patientsAPI.search(query);
      setSearchResults(results);
    } catch (error) {
      console.error('Error searching patients:', error);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    
    if (!bookingData.patientId || !bookingData.serviceId || 
        !bookingData.appointmentDate || !bookingData.startTime) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await appointmentsAPI.bookForPatient({
        patientId: bookingData.patientId,
        staffId: bookingData.staffId,
        serviceId: bookingData.serviceId,
        appointmentDate: bookingData.appointmentDate,
        startTime: bookingData.startTime,
        notes: bookingData.notes
      });

      // Refresh appointments
      await loadDashboardData();
      
      // Close modal and reset form
      setShowBookingModal(false);
      setBookingData({
        patientId: '',
        staffId: '',
        serviceId: '',
        appointmentDate: '',
        startTime: '',
        notes: ''
      });
      setAvailableSlots([]);
      
      alert('Appointment booked successfully!');
    } catch (error) {
      setError(error.error || error.message || 'Failed to book appointment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status) => {
    try {
      await appointmentsAPI.updateStatus(appointmentId, status);
      await loadDashboardData();
      alert(`Appointment status updated to ${status}!`);
    } catch (error) {
      alert('Failed to update appointment status: ' + (error.error || error.message));
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
      case 'in-progress': return 'text-warning';
      default: return 'text-secondary';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const confirmedAppointments = appointments.filter(apt => apt.status === 'confirmed');
  const inProgressAppointments = appointments.filter(apt => apt.status === 'in-progress');
  const completedAppointments = appointments.filter(apt => apt.status === 'completed');

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
      }, `Welcome, ${user.firstName}!`),
      React.createElement('p', {
        className: 'text-secondary'
      }, 'Manage today\'s appointments and patient flow.')
    ),

    // Quick stats
    React.createElement('div', {
      className: 'grid grid-cols-1 md:grid-cols-4 gap-6'
    },
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-primary mb-2'
        }, appointments.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Total Appointments')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-success mb-2'
        }, confirmedAppointments.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Confirmed')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-warning mb-2'
        }, inProgressAppointments.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'In Progress')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-secondary mb-2'
        }, completedAppointments.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Completed')
      )
    ),

    // Action buttons
    React.createElement('div', {
      className: 'flex flex-wrap gap-4'
    },
      React.createElement('button', {
        className: 'btn btn-primary',
        onClick: () => setShowBookingModal(true)
      }, '📅 Book Appointment'),
      React.createElement('button', {
        className: 'btn btn-secondary',
        onClick: () => setShowPatientSearch(true)
      }, '🔍 Search Patients'),
      React.createElement('button', {
        className: 'btn btn-secondary',
        onClick: loadDashboardData
      }, '🔄 Refresh')
    ),

    // Today's appointments
    React.createElement('div', {
      className: 'bg-white rounded-lg shadow-md'
    },
      React.createElement('div', {
        className: 'p-6 border-b border-light'
      },
        React.createElement('h2', {
          className: 'text-2xl font-semibold text-primary'
        }, 'Today\'s Appointments')
      ),
      React.createElement('div', {
        className: 'p-6'
      },
        appointments.length === 0 ? 
          React.createElement('p', {
            className: 'text-secondary text-center py-8'
          }, 'No appointments scheduled for today.') :
          React.createElement('div', {
            className: 'space-y-4'
          },
            appointments.map(appointment =>
              React.createElement('div', {
                key: appointment.id,
                className: 'border border-light rounded-lg p-4 hover:shadow-md transition-shadow'
              },
                React.createElement('div', {
                  className: 'flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'
                },
                  React.createElement('div', {
                    className: 'flex-1'
                  },
                    React.createElement('div', {
                      className: 'flex items-center gap-3 mb-2'
                    },
                      React.createElement('h3', {
                        className: 'text-lg font-semibold text-primary'
                      }, appointment.service?.name || 'Service'),
                      React.createElement('span', {
                        className: `px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(appointment.status)}`
                      }, appointment.status)
                    ),
                    React.createElement('p', {
                      className: 'text-secondary mb-1'
                    }, `Patient: ${appointment.patient?.firstName} ${appointment.patient?.lastName}`),
                    React.createElement('p', {
                      className: 'text-secondary mb-1'
                    }, `Time: ${formatTime(appointment.startTime)} - ${formatTime(appointment.endTime)}`),
                    appointment.staff && React.createElement('p', {
                      className: 'text-secondary mb-1'
                    }, `Doctor: Dr. ${appointment.staff.firstName} ${appointment.staff.lastName}`),
                    appointment.notes && React.createElement('p', {
                      className: 'text-secondary text-sm'
                    }, `Notes: ${appointment.notes}`)
                  ),
                  React.createElement('div', {
                    className: 'flex flex-wrap gap-2'
                  },
                    appointment.status === 'scheduled' && React.createElement('button', {
                      className: 'btn btn-success btn-sm',
                      onClick: () => handleUpdateAppointmentStatus(appointment.id, 'confirmed')
                    }, 'Confirm'),
                    appointment.status === 'confirmed' && React.createElement('button', {
                      className: 'btn btn-warning btn-sm',
                      onClick: () => handleUpdateAppointmentStatus(appointment.id, 'in-progress')
                    }, 'Start'),
                    appointment.status === 'in-progress' && React.createElement('button', {
                      className: 'btn btn-success btn-sm',
                      onClick: () => handleUpdateAppointmentStatus(appointment.id, 'completed')
                    }, 'Complete')
                  )
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
      title: 'Book Appointment for Patient',
      size: 'lg'
    },
      React.createElement('form', {
        onSubmit: handleBookAppointment
      },
        error && React.createElement('div', {
          className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6'
        }, error),

        React.createElement('div', {
          className: 'mb-4'
        },
          React.createElement('label', {
            className: 'form-label'
          }, 'Search Patient'),
          React.createElement('input', {
            type: 'text',
            className: 'form-input',
            placeholder: 'Search by name or phone...',
            value: searchQuery,
            onChange: (e) => {
              setSearchQuery(e.target.value);
              handleSearchPatients(e.target.value);
            }
          }),
          searchResults.length > 0 && React.createElement('div', {
            className: 'mt-2 border border-light rounded-md max-h-40 overflow-y-auto'
          },
            searchResults.map(patient =>
              React.createElement('div', {
                key: patient.id,
                className: 'p-3 hover:bg-gray-50 cursor-pointer border-b border-light last:border-b-0',
                onClick: () => {
                  setBookingData(prev => ({ ...prev, patientId: patient.id }));
                  setSearchQuery(`${patient.firstName} ${patient.lastName}`);
                  setSearchResults([]);
                }
              },
                React.createElement('p', {
                  className: 'font-medium'
                }, `${patient.firstName} ${patient.lastName}`),
                React.createElement('p', {
                  className: 'text-sm text-secondary'
                }, patient.phone)
              )
            )
          )
        ),

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
          React.createElement(FormSelect, {
            label: 'Doctor (Optional)',
            name: 'staffId',
            value: bookingData.staffId,
            onChange: handleBookingInputChange,
            options: staff.filter(s => s.role === 'doctor').map(doctor => ({
              value: doctor.id,
              label: `Dr. ${doctor.firstName} ${doctor.lastName}`
            }))
          })
        ),

        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
        },
          React.createElement(FormInput, {
            label: 'Date',
            name: 'appointmentDate',
            type: 'date',
            value: bookingData.appointmentDate,
            onChange: handleBookingInputChange,
            required: true,
            min: new Date().toISOString().split('T')[0]
          }),
          bookingData.appointmentDate && bookingData.staffId && availableSlots.length > 0 && React.createElement(FormSelect, {
            label: 'Available Time',
            name: 'startTime',
            value: bookingData.startTime,
            onChange: handleBookingInputChange,
            options: availableSlots.map(slot => ({
              value: slot.startTime,
              label: formatTime(slot.startTime)
            })),
            required: true
          })
        ),

        React.createElement(FormTextarea, {
          label: 'Notes (Optional)',
          name: 'notes',
          value: bookingData.notes,
          onChange: handleBookingInputChange,
          placeholder: 'Any additional information...'
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
            disabled: isSubmitting
          },
            isSubmitting && React.createElement('div', {
              className: 'loading-spinner w-4 h-4 mr-2'
            }),
            isSubmitting ? 'Booking...' : 'Book Appointment'
          )
        )
      )
    ),

    // Patient search modal
    React.createElement(Modal, {
      isOpen: showPatientSearch,
      onClose: () => setShowPatientSearch(false),
      title: 'Search Patients',
      size: 'lg'
    },
      React.createElement('div', null,
        React.createElement('div', {
          className: 'mb-4'
        },
          React.createElement('input', {
            type: 'text',
            className: 'form-input',
            placeholder: 'Search by name or phone...',
            value: searchQuery,
            onChange: (e) => {
              setSearchQuery(e.target.value);
              handleSearchPatients(e.target.value);
            }
          })
        ),
        React.createElement('div', {
          className: 'space-y-2 max-h-96 overflow-y-auto'
        },
          searchResults.length === 0 && searchQuery.length >= 2 ? 
            React.createElement('p', {
              className: 'text-secondary text-center py-4'
            }, 'No patients found.') :
            searchResults.map(patient =>
              React.createElement('div', {
                key: patient.id,
                className: 'border border-light rounded-lg p-4 hover:shadow-md transition-shadow'
              },
                React.createElement('h3', {
                  className: 'text-lg font-semibold text-primary'
                }, `${patient.firstName} ${patient.lastName}`),
                React.createElement('p', {
                  className: 'text-secondary'
                }, `Phone: ${patient.phone}`),
                patient.email && React.createElement('p', {
                  className: 'text-secondary'
                }, `Email: ${patient.email}`)
              )
            )
        )
      )
    )
  );
};

export default NurseDashboard;


















