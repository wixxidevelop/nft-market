import React, { useId } from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  error,
  className = '',
  id,
  ...props
}) => {
  const generatedId = useId();
  const checkboxId = id || `checkbox-${generatedId}`;
  
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id={checkboxId}
          className={`
            w-4 h-4 text-brand bg-white border-light-300 rounded
            focus:ring-brand focus:ring-2 focus:ring-offset-0
            ${error ? 'border-red-500' : ''}
            ${className}
          `}
          {...props}
        />
        {label && (
          <label htmlFor={checkboxId} className="text-sm text-charcoal cursor-pointer">
            {label}
          </label>
        )}
      </div>
      {error && (
        <span className="text-sm text-red-600">{error}</span>
      )}
    </div>
  );
};

export default Checkbox;