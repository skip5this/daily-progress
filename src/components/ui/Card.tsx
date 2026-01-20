import React from 'react';
import clsx from 'clsx';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, title, action }) => {
    return (
        <div
            className={clsx('rounded-xl p-4 mb-4 card-elevated', className)}
        >
            {(title || action) && (
                <div className="flex justify-between items-center mb-3">
                    {title && (
                        <h3
                            className="text-sm font-semibold uppercase tracking-wider"
                            style={{ color: 'var(--foreground)' }}
                        >
                            {title}
                        </h3>
                    )}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};
