import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  glow?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, glow = true, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md px-3 py-2 text-sm',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-slate-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-300',
          glow
            ? 'input-glow focus-glow text-white'
            : 'bg-slate-800 border border-slate-700 text-white focus:border-cyber-pink focus:outline-none focus:ring-2 focus:ring-cyber-pink/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-dark',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  glow?: boolean;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, glow = true, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          'flex min-h-[80px] w-full rounded-md px-3 py-2 text-sm',
          'placeholder:text-slate-400',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-300',
          glow
            ? 'input-glow focus-glow text-white'
            : 'bg-slate-800 border border-slate-700 text-white focus:border-cyber-pink focus:outline-none focus:ring-2 focus:ring-cyber-pink/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-dark',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-sm font-medium text-slate-200 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

export interface CheckboxProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          'h-4 w-4 rounded border-cyber-pink/50 bg-cyber-dark text-cyber-pink',
          'focus:ring-2 focus:ring-cyber-pink focus:ring-offset-2 focus:ring-offset-cyber-dark',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink',
          'transition-all duration-200 tactile',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  glow?: boolean;
}

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, glow = true, children, ...props }, ref) => {
    return (
      <select
        className={cn(
          'flex h-10 w-full rounded-md px-3 py-2 text-sm',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-300',
          glow
            ? 'input-glow focus-glow text-white'
            : 'bg-slate-800 border border-slate-700 text-white focus:border-cyber-pink focus:outline-none focus:ring-2 focus:ring-cyber-pink/50',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink focus-visible:ring-offset-2 focus-visible:ring-offset-cyber-dark',
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export { Input, Textarea, Label, Checkbox, Select };
