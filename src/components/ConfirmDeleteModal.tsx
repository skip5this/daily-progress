import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfirmDeleteModalProps {
    isOpen: boolean;
    metricName: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
    isOpen,
    metricName,
    onConfirm,
    onCancel,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onCancel}
            />
            <div className="relative bg-[#1a1a1a] border border-gray-800 rounded-xl p-6 max-w-sm mx-4 w-full shadow-xl">
                <button
                    onClick={onCancel}
                    className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                >
                    <X size={20} />
                </button>
                <h3 className="text-lg font-semibold text-white mb-2">
                    Delete "{metricName}"?
                </h3>
                <p className="text-gray-400 text-sm mb-6">
                    This metric has historical data. Deleting it will permanently remove all associated data. This action cannot be undone.
                </p>
                <div className="flex gap-3">
                    <Button
                        variant="secondary"
                        className="flex-1"
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={onConfirm}
                    >
                        Delete
                    </Button>
                </div>
            </div>
        </div>
    );
};
