import React, { useState } from 'react'
import { User } from 'lucide-react'
import { PatientProfileModal } from './PatientProfileModal'
import { cn } from '../../lib/utils'

export interface PatientNameLinkProps {
  patientName: string
  patientIdOrMrn?: string
  className?: string
  showIcon?: boolean
}

export const PatientNameLink: React.FC<PatientNameLinkProps> = ({
  patientName,
  patientIdOrMrn,
  className,
  showIcon = true,
}) => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
        className={cn(
          'inline-flex items-center gap-1.5 text-medical font-bold hover:underline hover:text-medical-800 text-left cursor-pointer transition-colors group select-text',
          className
        )}
        title="Click to view centralized clinical medical profile"
      >
        {showIcon && (
          <User className="w-3.5 h-3.5 text-medical-600 group-hover:scale-110 transition-transform flex-shrink-0" />
        )}
        <span>{patientName}</span>
      </button>

      <PatientProfileModal
        patientIdOrMrn={patientIdOrMrn || patientName}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  )
}
