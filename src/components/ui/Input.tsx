import React from 'react';
import clsx from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export const Input: React.FC<InputProps> = ({ label, className, style, ...props }) => {
    return (
        <div className="flex flex-col space-y-1 w-full">
            {label && (
                <label
                    className="text-xs font-medium"
                    style={{ color: 'var(--muted)' }}
                >
                    {label}
                </label>
            )}
            <input
                className={clsx(
                    'rounded-lg px-3 py-2 transition-all input-modern',
                    className
                )}
                style={{
                    color: 'var(--foreground)',
                    ...style,
                }}
                {...props}
            />
        </div>
    );
};
