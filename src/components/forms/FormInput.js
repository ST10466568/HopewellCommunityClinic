import React from 'react';

const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  onBlur,
  error, 
  placeholder, 
  required = false,
  disabled = false,
  className = '',
  ...props 
}) => {
  const inputId = `input-${name}`;

  return React.createElement('div', {
    className: `form-group ${className}`
  },
    label && React.createElement('label', {
      htmlFor: inputId,
      className: 'form-label'
    }, label, required && React.createElement('span', {
      className: 'text-error ml-1'
    }, '*')),
    React.createElement('input', {
      id: inputId,
      type: type,
      name: name,
      value: value || '',
      onChange: onChange,
      onBlur: onBlur,
      placeholder: placeholder,
      required: required,
      disabled: disabled,
      className: `form-input ${error ? 'error' : ''}`,
      ...props
    }),
    error && React.createElement('div', {
      className: 'form-error'
    }, error)
  );
};

export default FormInput;


