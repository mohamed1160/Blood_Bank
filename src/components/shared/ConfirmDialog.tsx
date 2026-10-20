import React from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { AlertTriangle, Info } from 'lucide-react'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary'
  isLoading?: boolean
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={
        <div className="flex items-center gap-2">
          {variant === 'danger' && <AlertTriangle className="w-5 h-5 text-red-600" />}
          {variant === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-500" />}
          {variant === 'primary' && <Info className="w-5 h-5 text-navy-600" />}
          <span>{title}</span>
        </div>
      }
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="py-2">
        <p className="text-sm text-secondaryText leading-relaxed">{description}</p>
      </div>
    </Modal>
  )
}
