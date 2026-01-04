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
          'flex h-12 w-full rounded-xl px-4 py-3 text-base',
          'file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'placeholder:text-slate-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-300',
          'backdrop-blur-xl',
          glow
            ? 'bg-nebula-indigo/40 border border-cyber-pink/30 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:bg-nebula-indigo/60 focus:border-cyber-pink focus:shadow-[0_0_0_3px_rgba(255,0,170,0.2),0_0_20px_rgba(255,0,170,0.3),inset_0_2px_4px_rgba(0,0,0,0.3)]'
            : 'bg-slate-800 border border-slate-700 text-white focus:border-cyber-pink focus:outline-none focus:ring-2 focus:ring-cyber-pink/50',
          'focus-visible:outline-none',
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
          'flex min-h-[120px] w-full rounded-xl px-4 py-3 text-base',
          'placeholder:text-slate-500',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-300',
          'backdrop-blur-xl',
          glow
            ? 'bg-nebula-indigo/40 border border-cyber-pink/30 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:bg-nebula-indigo/60 focus:border-cyber-pink focus:shadow-[0_0_0_3px_rgba(255,0,170,0.2),0_0_20px_rgba(255,0,170,0.3),inset_0_2px_4px_rgba(0,0,0,0.3)]'
            : 'bg-slate-800 border border-slate-700 text-white focus:border-cyber-pink focus:outline-none focus:ring-2 focus:ring-cyber-pink/50',
          'focus-visible:outline-none',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-base font-semibold text-slate-200 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 tracking-wide',
          className
        )}
        {...props}
      />
    );
  }
);
Label.displayName = 'Label';

const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        className={cn(
          'h-5 w-5 rounded-md border-2 border-cyber-pink/50 bg-nebula-indigo/40 text-cyber-pink backdrop-blur-xl',
          'focus:ring-2 focus:ring-cyber-pink focus:ring-offset-2 focus:ring-offset-nebula-indigo',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyber-pink',
          'transition-all duration-200 tactile',
          'shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)]',
          'checked:shadow-[0_0_10px_rgba(255,0,170,0.5)]',
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
          'flex h-12 w-full rounded-xl px-4 py-3 text-base',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-300',
          'backdrop-blur-xl',
          glow
            ? 'bg-nebula-indigo/40 border border-cyber-pink/30 text-white shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] focus:bg-nebula-indigo/60 focus:border-cyber-pink focus:shadow-[0_0_0_3px_rgba(255,0,170,0.2),0_0_20px_rgba(255,0,170,0.3),inset_0_2px_4px_rgba(0,0,0,0.3)]'
            : 'bg-slate-800 border border-slate-700 text-white focus:border-cyber-pink focus:outline-none focus:ring-2 focus:ring-cyber-pink/50',
          'focus-visible:outline-none',
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
