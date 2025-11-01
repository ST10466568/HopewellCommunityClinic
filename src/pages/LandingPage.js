import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  const services = [
    {
      title: 'General Consultation',
      description: 'Comprehensive health check-ups and consultations with our experienced doctors.',
      icon: '🩺'
    },
    {
      title: 'Emergency Care',
      description: '24/7 emergency medical services for urgent health situations.',
      icon: '🚨'
    },
    {
      title: 'Specialist Care',
      description: 'Expert care from specialists in various medical fields.',
      icon: '👨‍⚕️'
    },
    {
      title: 'Preventive Care',
      description: 'Regular check-ups and preventive measures to maintain your health.',
      icon: '💊'
    }
  ];

  const staff = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Medical Officer',
      specialty: 'Internal Medicine',
      image: '👩‍⚕️'
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Senior Physician',
      specialty: 'Cardiology',
      image: '👨‍⚕️'
    },
    {
      name: 'Dr. James Wilson',
      role: 'Senior Physician',
      specialty: 'Pediatrics',
      image: '👨‍⚕️'
    }
  ];

  return React.createElement('div', {
    className: 'min-h-screen'
  },
    // Hero Section
    React.createElement('section', {
      className: 'bg-gradient-to-br from-primary to-blue-600 text-white py-20'
    },
      React.createElement('div', {
        className: 'container mx-auto px-6 text-center'
      },
        React.createElement('div', {
          className: 'flex justify-center mb-8'
        },
          React.createElement('div', {
            className: 'w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-4xl'
          }, '💚')
        ),
        React.createElement('h1', {
          className: 'text-5xl font-bold mb-6'
        }, 'Welcome to Hopewell Clinic'),
        React.createElement('p', {
          className: 'text-xl mb-8 max-w-2xl mx-auto opacity-90'
        }, 'Your trusted healthcare partner providing comprehensive medical services with compassion and excellence.'),
        React.createElement('div', {
          className: 'flex flex-col sm:flex-row gap-4 justify-center'
        },
          React.createElement(Link, {
            to: '/auth',
            className: 'btn btn-lg bg-white text-primary hover:bg-gray-100'
          }, 'Get Started'),
          React.createElement('button', {
            className: 'btn btn-lg border-2 border-white text-white hover:bg-white hover:text-primary'
          }, 'Learn More')
        )
      )
    ),

    // Services Section
    React.createElement('section', {
      className: 'py-20 bg-white'
    },
      React.createElement('div', {
        className: 'container mx-auto px-6'
      },
        React.createElement('div', {
          className: 'text-center mb-16'
        },
          React.createElement('h2', {
            className: 'text-4xl font-bold text-primary mb-4'
          }, 'Our Services'),
          React.createElement('p', {
            className: 'text-xl text-secondary max-w-2xl mx-auto'
          }, 'We offer a comprehensive range of medical services to meet all your healthcare needs.')
        ),
        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'
        },
          services.map((service, index) =>
            React.createElement('div', {
              key: index,
              className: 'card text-center hover:shadow-lg transition-all duration-300'
            },
              React.createElement('div', {
                className: 'card-body'
              },
                React.createElement('div', {
                  className: 'text-4xl mb-4'
                }, service.icon),
                React.createElement('h3', {
                  className: 'text-xl font-semibold text-primary mb-3'
                }, service.title),
                React.createElement('p', {
                  className: 'text-secondary'
                }, service.description)
              )
            )
          )
        )
      )
    ),

    // Staff Section
    React.createElement('section', {
      className: 'py-20 bg-light'
    },
      React.createElement('div', {
        className: 'container mx-auto px-6'
      },
        React.createElement('div', {
          className: 'text-center mb-16'
        },
          React.createElement('h2', {
            className: 'text-4xl font-bold text-primary mb-4'
          }, 'Meet Our Team'),
          React.createElement('p', {
            className: 'text-xl text-secondary max-w-2xl mx-auto'
          }, 'Our dedicated healthcare professionals are committed to providing you with the best possible care.')
        ),
        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-3 gap-8'
        },
          staff.map((member, index) =>
            React.createElement('div', {
              key: index,
              className: 'card text-center'
            },
              React.createElement('div', {
                className: 'card-body'
              },
                React.createElement('div', {
                  className: 'text-6xl mb-4'
                }, member.image),
                React.createElement('h3', {
                  className: 'text-xl font-semibold text-primary mb-2'
                }, member.name),
                React.createElement('p', {
                  className: 'text-secondary font-medium mb-1'
                }, member.role),
                React.createElement('p', {
                  className: 'text-sm text-light'
                }, member.specialty)
              )
            )
          )
        )
      )
    ),

    // CTA Section
    React.createElement('section', {
      className: 'py-20 bg-primary text-white'
    },
      React.createElement('div', {
        className: 'container mx-auto px-6 text-center'
      },
        React.createElement('h2', {
          className: 'text-4xl font-bold mb-6'
        }, 'Ready to Take Care of Your Health?'),
        React.createElement('p', {
          className: 'text-xl mb-8 opacity-90 max-w-2xl mx-auto'
        }, 'Join thousands of satisfied patients who trust Hopewell Clinic for their healthcare needs.'),
        React.createElement(Link, {
          to: '/auth',
          className: 'btn btn-lg bg-white text-primary hover:bg-gray-100'
        }, 'Book Your Appointment Today')
      )
    ),

    // Footer
    React.createElement('footer', {
      className: 'bg-gray-800 text-white py-12'
    },
      React.createElement('div', {
        className: 'container mx-auto px-6'
      },
        React.createElement('div', {
          className: 'grid grid-cols-1 md:grid-cols-3 gap-8'
        },
          React.createElement('div', null,
            React.createElement('div', {
              className: 'flex items-center gap-2 mb-4'
            },
              React.createElement('span', {
                className: 'text-2xl'
              }, '💚'),
              React.createElement('h3', {
                className: 'text-xl font-semibold'
              }, 'Hopewell Clinic')
            ),
            React.createElement('p', {
              className: 'text-gray-300'
            }, 'Your trusted healthcare partner providing comprehensive medical services with compassion and excellence.')
          ),
          React.createElement('div', null,
            React.createElement('h4', {
              className: 'text-lg font-semibold mb-4'
            }, 'Quick Links'),
            React.createElement('ul', {
              className: 'space-y-2'
            },
              React.createElement('li', null,
                React.createElement(Link, {
                  to: '/auth',
                  className: 'text-gray-300 hover:text-white transition-colors'
                }, 'Patient Portal')
              ),
              React.createElement('li', null,
                React.createElement('a', {
                  href: '#services',
                  className: 'text-gray-300 hover:text-white transition-colors'
                }, 'Our Services')
              ),
              React.createElement('li', null,
                React.createElement('a', {
                  href: '#contact',
                  className: 'text-gray-300 hover:text-white transition-colors'
                }, 'Contact Us')
              )
            )
          ),
          React.createElement('div', null,
            React.createElement('h4', {
              className: 'text-lg font-semibold mb-4'
            }, 'Contact Info'),
            React.createElement('div', {
              className: 'space-y-2 text-gray-300'
            },
              React.createElement('p', null, '123 Healthcare Ave'),
              React.createElement('p', null, 'Medical City, MC 12345'),
              React.createElement('p', null, 'Phone: (555) 123-4567'),
              React.createElement('p', null, 'Email: info@hopewellclinic.com')
            )
          )
        ),
        React.createElement('div', {
          className: 'border-t border-gray-700 mt-8 pt-8 text-center text-gray-300'
        },
          React.createElement('p', null, '© 2024 Hopewell Clinic. All rights reserved.')
        )
      )
    )
  );
};

export default LandingPage;


