import React from 'react';
import clsx from 'clsx';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant = 'primary',
    size = 'md',
    style,
    ...props
}) => {
    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        md: 'px-4 py-2 text-sm',
        lg: 'px-6 py-3 text-base',
    };

    const getVariantStyles = (): React.CSSProperties => {
        switch (variant) {
            case 'primary':
                return {
                    background: 'var(--accent)',
                    color: '#ffffff',
                };
            case 'secondary':
                return {
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    color: 'var(--foreground)',
                };
            case 'danger':
                return {
                    background: 'var(--error)',
                    color: '#ffffff',
                };
            case 'ghost':
                return {
                    background: 'transparent',
                    color: 'var(--muted)',
                };
            default:
                return {};
        }
    };

    return (
        <button
            className={clsx(
                'rounded-lg font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed',
                sizes[size],
                className
            )}
            style={{
                ...getVariantStyles(),
                ...style,
            }}
            {...props}
        >
            {children}
        </button>
    );
};
