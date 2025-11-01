import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI, servicesAPI, appointmentsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import FormInput from '../components/forms/FormInput';
import FormSelect from '../components/forms/FormSelect';
import FormTextarea from '../components/forms/FormTextarea';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [appointmentStats, setAppointmentStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    role: 'patient'
  });
  const [serviceData, setServiceData] = useState({
    name: '',
    description: '',
    durationMinutes: 30
  });
  const [reportData, setReportData] = useState({
    startDate: '',
    endDate: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setIsLoading(true);
      const [usersData, servicesData, statsData] = await Promise.all([
        adminAPI.getUsers(),
        servicesAPI.getAll(),
        adminAPI.getAppointmentStats()
      ]);
      setUsers(usersData);
      setServices(servicesData);
      setAppointmentStats(statsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserInputChange = (e) => {
    const { name, value } = e.target;
    setUserData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleServiceInputChange = (e) => {
    const { name, value } = e.target;
    setServiceData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    
    if (!userData.firstName || !userData.lastName || !userData.email || !userData.password) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (userData.role === 'patient') {
        await adminAPI.createStaff({
          ...userData,
          phone: '000-000-0000', // Default phone for staff
          dateOfBirth: '1990-01-01', // Default date for staff
          address: 'N/A' // Default address for staff
        });
      } else {
        await adminAPI.createStaff(userData);
      }

      await loadDashboardData();
      setShowUserModal(false);
      setUserData({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        role: 'patient'
      });
      alert('User created successfully!');
    } catch (error) {
      setError(error.error || error.message || 'Failed to create user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    
    if (!serviceData.name || !serviceData.description || !serviceData.durationMinutes) {
      setError('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await servicesAPI.create(serviceData);
      await loadDashboardData();
      setShowServiceModal(false);
      setServiceData({
        name: '',
        description: '',
        durationMinutes: 30
      });
      alert('Service created successfully!');
    } catch (error) {
      setError(error.error || error.message || 'Failed to create service');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUserStatus = async (userId, isActive) => {
    try {
      await adminAPI.updateUserStatus(userId, isActive);
      await loadDashboardData();
      alert(`User ${isActive ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      alert('Failed to update user status: ' + (error.error || error.message));
    }
  };

  const handleUpdateUserRole = async (userId, newRole) => {
    try {
      await adminAPI.updateUserRole(userId, newRole);
      await loadDashboardData();
      alert('User role updated successfully!');
    } catch (error) {
      alert('Failed to update user role: ' + (error.error || error.message));
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (!confirm('Are you sure you want to delete this service?')) {
      return;
    }

    try {
      await servicesAPI.delete(serviceId);
      await loadDashboardData();
      alert('Service deleted successfully!');
    } catch (error) {
      alert('Failed to delete service: ' + (error.error || error.message));
    }
  };

  const handleGenerateReport = async (e) => {
    e.preventDefault();
    
    if (!reportData.startDate || !reportData.endDate) {
      setError('Please select start and end dates');
      return;
    }

    try {
      const stats = await adminAPI.getAppointmentStats(reportData.startDate, reportData.endDate);
      setAppointmentStats(stats);
      alert('Report generated successfully!');
    } catch (error) {
      setError('Failed to generate report: ' + (error.error || error.message));
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'patient': return 'Patient';
      case 'doctor': return 'Doctor';
      case 'admin': return 'Administrator';
      default: return role;
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-success' : 'text-error';
  };

  const getStatusBadgeColor = (isActive) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

  if (isLoading) {
    return React.createElement(LoadingSpinner, {
      size: 'lg',
      text: 'Loading admin dashboard...'
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
      }, 'Manage the clinic system, users, and services.')
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
        }, users.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Total Users')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-success mb-2'
        }, users.filter(u => u.isActive).length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Active Users')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-warning mb-2'
        }, services.length),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Services')
      ),
      React.createElement('div', {
        className: 'bg-white rounded-lg shadow-md p-6 text-center'
      },
        React.createElement('div', {
          className: 'text-3xl font-bold text-error mb-2'
        }, appointmentStats?.totalAppointments || 0),
        React.createElement('p', {
          className: 'text-secondary'
        }, 'Total Appointments')
      )
    ),

    // Action buttons
    React.createElement('div', {
      className: 'flex flex-wrap gap-4'
    },
      React.createElement('button', {
        className: 'btn btn-primary',
        onClick: () => setShowUserModal(true)
      }, '👤 Create User'),
      React.createElement('button', {
        className: 'btn btn-success',
        onClick: () => setShowServiceModal(true)
      }, '🏥 Create Service'),
      React.createElement('button', {
        className: 'btn btn-secondary',
        onClick: () => setShowReportsModal(true)
      }, '📊 Generate Reports'),
      React.createElement('button', {
        className: 'btn btn-secondary',
        onClick: loadDashboardData
      }, '🔄 Refresh')
    ),

    // Users management
    React.createElement('div', {
      className: 'bg-white rounded-lg shadow-md'
    },
      React.createElement('div', {
        className: 'p-6 border-b border-light'
      },
        React.createElement('h2', {
          className: 'text-2xl font-semibold text-primary'
        }, 'User Management')
      ),
      React.createElement('div', {
        className: 'p-6'
      },
        React.createElement('div', {
          className: 'overflow-x-auto'
        },
          React.createElement('table', {
            className: 'w-full'
          },
            React.createElement('thead', null,
              React.createElement('tr', {
                className: 'border-b border-light'
              },
                React.createElement('th', {
                  className: 'text-left py-3 px-4 font-medium text-primary'
                }, 'Name'),
                React.createElement('th', {
                  className: 'text-left py-3 px-4 font-medium text-primary'
                }, 'Email'),
                React.createElement('th', {
                  className: 'text-left py-3 px-4 font-medium text-primary'
                }, 'Role'),
                React.createElement('th', {
                  className: 'text-left py-3 px-4 font-medium text-primary'
                }, 'Status'),
                React.createElement('th', {
                  className: 'text-left py-3 px-4 font-medium text-primary'
                }, 'Actions')
              )
            ),
            React.createElement('tbody', null,
              users.map(user =>
                React.createElement('tr', {
                  key: user.id,
                  className: 'border-b border-light hover:bg-gray-50'
                },
                  React.createElement('td', {
                    className: 'py-3 px-4'
                  }, `${user.firstName} ${user.lastName}`),
                  React.createElement('td', {
                    className: 'py-3 px-4'
                  }, user.email),
                  React.createElement('td', {
                    className: 'py-3 px-4'
                  },
                    React.createElement('select', {
                      className: 'form-input form-select',
                      value: user.roles?.[0] || 'patient',
                      onChange: (e) => handleUpdateUserRole(user.id, e.target.value)
                    },
                      React.createElement('option', { value: 'patient' }, 'Patient'),
                      React.createElement('option', { value: 'doctor' }, 'Doctor'),
                      React.createElement('option', { value: 'admin' }, 'Admin')
                    )
                  ),
                  React.createElement('td', {
                    className: 'py-3 px-4'
                  },
                    React.createElement('span', {
                      className: `px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(user.isActive)}`
                    }, user.isActive ? 'Active' : 'Inactive')
                  ),
                  React.createElement('td', {
                    className: 'py-3 px-4'
                  },
                    React.createElement('button', {
                      className: `btn btn-sm ${user.isActive ? 'btn-danger' : 'btn-success'}`,
                      onClick: () => handleUpdateUserStatus(user.id, !user.isActive)
                    }, user.isActive ? 'Deactivate' : 'Activate')
                  )
                )
              )
            )
          )
        )
      )
    ),

    // Services management
    React.createElement('div', {
      className: 'bg-white rounded-lg shadow-md'
    },
      React.createElement('div', {
        className: 'p-6 border-b border-light'
      },
        React.createElement('h2', {
          className: 'text-2xl font-semibold text-primary'
        }, 'Services Management')
      ),
      React.createElement('div', {
        className: 'p-6'
      },
        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
        },
          services.map(service =>
            React.createElement('div', {
              key: service.id,
              className: 'border border-light rounded-lg p-4 hover:shadow-md transition-shadow'
            },
              React.createElement('h3', {
                className: 'text-lg font-semibold text-primary mb-2'
              }, service.name),
              React.createElement('p', {
                className: 'text-secondary mb-3'
              }, service.description),
              React.createElement('p', {
                className: 'text-sm text-light mb-4'
              }, `Duration: ${service.durationMinutes} minutes`),
              React.createElement('button', {
                className: 'btn btn-danger btn-sm w-full',
                onClick: () => handleDeleteService(service.id)
              }, 'Delete Service')
            )
          )
        )
      )
    ),

    // Create user modal
    React.createElement(Modal, {
      isOpen: showUserModal,
      onClose: () => setShowUserModal(false),
      title: 'Create New User',
      size: 'lg'
    },
      React.createElement('form', {
        onSubmit: handleCreateUser
      },
        error && React.createElement('div', {
          className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6'
        }, error),

        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
        },
          React.createElement(FormInput, {
            label: 'First Name',
            name: 'firstName',
            value: userData.firstName,
            onChange: handleUserInputChange,
            required: true
          }),
          React.createElement(FormInput, {
            label: 'Last Name',
            name: 'lastName',
            value: userData.lastName,
            onChange: handleUserInputChange,
            required: true
          })
        ),

        React.createElement(FormInput, {
          label: 'Email',
          name: 'email',
          type: 'email',
          value: userData.email,
          onChange: handleUserInputChange,
          required: true
        }),

        React.createElement(FormInput, {
          label: 'Password',
          name: 'password',
          type: 'password',
          value: userData.password,
          onChange: handleUserInputChange,
          required: true
        }),

        React.createElement(FormSelect, {
          label: 'Role',
          name: 'role',
          value: userData.role,
          onChange: handleUserInputChange,
          options: [
            { value: 'patient', label: 'Patient' },
            { value: 'doctor', label: 'Doctor' },
            { value: 'admin', label: 'Administrator' }
          ],
          required: true
        }),

        React.createElement('div', {
          className: 'flex gap-4 justify-end mt-6'
        },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onClick: () => setShowUserModal(false)
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary',
            disabled: isSubmitting
          },
            isSubmitting && React.createElement('div', {
              className: 'loading-spinner w-4 h-4 mr-2'
            }),
            isSubmitting ? 'Creating...' : 'Create User'
          )
        )
      )
    ),

    // Create service modal
    React.createElement(Modal, {
      isOpen: showServiceModal,
      onClose: () => setShowServiceModal(false),
      title: 'Create New Service',
      size: 'lg'
    },
      React.createElement('form', {
        onSubmit: handleCreateService
      },
        error && React.createElement('div', {
          className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6'
        }, error),

        React.createElement(FormInput, {
          label: 'Service Name',
          name: 'name',
          value: serviceData.name,
          onChange: handleServiceInputChange,
          required: true
        }),

        React.createElement(FormTextarea, {
          label: 'Description',
          name: 'description',
          value: serviceData.description,
          onChange: handleServiceInputChange,
          required: true,
          rows: 3
        }),

        React.createElement(FormInput, {
          label: 'Duration (minutes)',
          name: 'durationMinutes',
          type: 'number',
          value: serviceData.durationMinutes,
          onChange: handleServiceInputChange,
          required: true,
          min: 1
        }),

        React.createElement('div', {
          className: 'flex gap-4 justify-end mt-6'
        },
          React.createElement('button', {
            type: 'button',
            className: 'btn btn-secondary',
            onClick: () => setShowServiceModal(false)
          }, 'Cancel'),
          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary',
            disabled: isSubmitting
          },
            isSubmitting && React.createElement('div', {
              className: 'loading-spinner w-4 h-4 mr-2'
            }),
            isSubmitting ? 'Creating...' : 'Create Service'
          )
        )
      )
    ),

    // Reports modal
    React.createElement(Modal, {
      isOpen: showReportsModal,
      onClose: () => setShowReportsModal(false),
      title: 'Generate Reports',
      size: 'lg'
    },
      React.createElement('div', null,
        React.createElement('form', {
          onSubmit: handleGenerateReport
        },
          error && React.createElement('div', {
            className: 'bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6'
          }, error),

          React.createElement('div', {
            className: 'grid grid-cols-1 md:grid-cols-2 gap-4'
          },
            React.createElement(FormInput, {
              label: 'Start Date',
              name: 'startDate',
              type: 'date',
              value: reportData.startDate,
              onChange: (e) => setReportData(prev => ({ ...prev, startDate: e.target.value }))
            }),
            React.createElement(FormInput, {
              label: 'End Date',
              name: 'endDate',
              type: 'date',
              value: reportData.endDate,
              onChange: (e) => setReportData(prev => ({ ...prev, endDate: e.target.value }))
            })
          ),

          React.createElement('button', {
            type: 'submit',
            className: 'btn btn-primary w-full mt-4'
          }, 'Generate Report')
        ),

        appointmentStats && React.createElement('div', {
          className: 'mt-6 p-4 bg-gray-50 rounded-lg'
        },
          React.createElement('h3', {
            className: 'text-lg font-semibold text-primary mb-4'
          }, 'Appointment Statistics'),
          React.createElement('div', {
            className: 'grid grid-cols-2 md:grid-cols-4 gap-4'
          },
            React.createElement('div', {
              className: 'text-center'
            },
              React.createElement('div', {
                className: 'text-2xl font-bold text-primary'
              }, appointmentStats.totalAppointments || 0),
              React.createElement('p', {
                className: 'text-sm text-secondary'
              }, 'Total Appointments')
            ),
            React.createElement('div', {
              className: 'text-center'
            },
              React.createElement('div', {
                className: 'text-2xl font-bold text-success'
              }, appointmentStats.completedAppointments || 0),
              React.createElement('p', {
                className: 'text-sm text-secondary'
              }, 'Completed')
            ),
            React.createElement('div', {
              className: 'text-center'
            },
              React.createElement('div', {
                className: 'text-2xl font-bold text-warning'
              }, appointmentStats.confirmedAppointments || 0),
              React.createElement('p', {
                className: 'text-sm text-secondary'
              }, 'Confirmed')
            ),
            React.createElement('div', {
              className: 'text-center'
            },
              React.createElement('div', {
                className: 'text-2xl font-bold text-error'
              }, appointmentStats.cancelledAppointments || 0),
              React.createElement('p', {
                className: 'text-sm text-secondary'
              }, 'Cancelled')
            )
          )
        )
      )
    )
  );
};

export default AdminDashboard;


















