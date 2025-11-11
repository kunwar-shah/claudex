import React from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from './ui/button'

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel", type = "info" }) => {
  if (!isOpen) return null

  const icons = {
    success: <CheckCircle className="w-12 h-12 text-[hsl(var(--success))]" />,
    warning: <AlertCircle className="w-12 h-12 text-[hsl(var(--warning))]" />,
    info: <AlertCircle className="w-12 h-12 text-[hsl(var(--info))]" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
      <div className="bg-[hsl(var(--surface))] rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
        {/* Icon Section */}
        <div className="flex justify-center pt-6 pb-4">
          {icons[type]}
        </div>

        {/* Content Section */}
        <div className="px-6 pb-6 text-center">
          <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))] mb-2">
            {title}
          </h3>
          <p className="text-sm text-[hsl(var(--text-secondary))] leading-relaxed">
            {message}
          </p>
        </div>

        {/* Actions Section */}
        <div className="flex items-center gap-3 px-6 pb-6">
          <Button
            onClick={onClose}
            variant="outline"
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            onClick={() => {
              onConfirm()
              onClose()
            }}
            className="flex-1 bg-[hsl(var(--primary))] text-white hover:bg-[hsl(var(--primary-hover))]"
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal
