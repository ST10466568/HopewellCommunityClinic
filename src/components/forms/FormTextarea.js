import React from 'react';

const FormTextarea = ({ 
  label, 
  name, 
  value, 
  onChange, 
  onBlur,
  error, 
  placeholder, 
  required = false,
  disabled = false,
  rows = 4,
  className = '',
  ...props 
}) => {
  const inputId = `textarea-${name}`;

  return React.createElement('div', {
    className: `form-group ${className}`
  },
    label && React.createElement('label', {
      htmlFor: inputId,
      className: 'form-label'
    }, label, required && React.createElement('span', {
      className: 'text-error ml-1'
    }, '*')),
    React.createElement('textarea', {
      id: inputId,
      name: name,
      value: value || '',
      onChange: onChange,
      onBlur: onBlur,
      placeholder: placeholder,
      required: required,
      disabled: disabled,
      rows: rows,
      className: `form-input form-textarea ${error ? 'error' : ''}`,
      ...props
    }),
    error && React.createElement('div', {
      className: 'form-error'
    }, error)
  );
};

export default FormTextarea;


