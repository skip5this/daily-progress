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
        <div className={clsx('bg-[#2a2a2a] rounded-xl p-4 shadow-sm mb-4', className)}>
            {(title || action) && (
                <div className="flex justify-between items-center mb-3">
                    {title && <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            )}
            {children}
        </div>
    );
};
