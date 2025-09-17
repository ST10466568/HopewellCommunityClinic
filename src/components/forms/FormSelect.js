import React from 'react';

const FormSelect = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur,
  error, 
  options = [], 
  placeholder = 'Select an option',
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const inputId = `select-${name}`;

  return React.createElement('div', {
    className: `form-group ${className}`
  },
    label && React.createElement('label', {
      htmlFor: inputId,
      className: 'form-label'
    }, label, required && React.createElement('span', {
      className: 'text-error ml-1'
    }, '*')),
    React.createElement('select', {
      id: inputId,
      name: name,
      value: value || '',
      onChange: onChange,
      onBlur: onBlur,
      required: required,
      disabled: disabled,
      className: `form-input form-select ${error ? 'error' : ''}`,
      ...props
    },
      React.createElement('option', {
        value: '',
        disabled: true
      }, placeholder),
      options.map((option, index) => {
        if (typeof option === 'string') {
          return React.createElement('option', {
            key: index,
            value: option
          }, option);
        }
        return React.createElement('option', {
          key: option.key || option.value || index,
          value: option.value
        }, option.label || option.name || option.value);
      })
    ),
    error && React.createElement('div', {
      className: 'form-error'
    }, error)
  );
};

export default FormSelect;
