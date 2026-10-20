import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  MapPin,
  Phone,
  Clock,
  ShieldCheck,
  Calendar,
  Building2,
  ArrowLeft,
  Users,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { recordsService } from '../../services/recordsService'
import { DonationCenter, BloodType } from '../../types'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../hooks/useAuth'

export const CenterDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const [center, setCenter] = useState<DonationCenter | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [bookingModalOpen, setBookingModalOpen] = useState<boolean>(false)
  const [appointmentDate, setAppointmentDate] = useState<string>('')
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false)
  const { currentUser } = useAuth()

  useEffect(() => {
    if (id) {
      recordsService
        .getCenterById(id)
        .then((data) => setCenter(data))
        .finally(() => setIsLoading(false))
    }
  }, [id])

  if (isLoading) {
    return <LoadingState message="Fetching center profile..." />
  }

  if (!center) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-navy">Donation Center Not Found</h2>
        <p className="text-xs text-secondaryText">The requested donation center identifier does not exist or has been relocated.</p>
        <Link to="/centers">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Centers
          </Button>
        </Link>
      </div>
    )
  }

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault()
    setBookingSuccess(true)
    setTimeout(() => {
      setBookingModalOpen(false)
      setBookingSuccess(false)
    }, 2000)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader
        title={center.name}
        subtitle={`Verified blood collection facility in ${center.city}.`}
        breadcrumbs={[
          { label: 'Home', href: '/' },
          { label: 'Donation Centers', href: '/centers' },
          { label: center.name },
        ]}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Calendar className="w-4 h-4" />}
            onClick={() => setBookingModalOpen(true)}
          >
            Schedule Donation
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Details & Capacity */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-5">
            <h3 className="text-base font-bold text-navy border-b border-borderNeutral pb-3">Facility Specifications</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-surface rounded-xl border border-borderNeutral space-y-1">
                <span className="text-secondaryText uppercase tracking-wider font-semibold text-[10px]">Daily Capacity</span>
                <p className="text-lg font-bold text-primaryText">{center.capacityPerDay} Donors / day</p>
              </div>

              <div className="p-3.5 bg-surface rounded-xl border border-borderNeutral space-y-1">
                <span className="text-secondaryText uppercase tracking-wider font-semibold text-[10px]">Accreditation</span>
                <p className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4" />
                  Ministry & Red Cross Certified
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-secondaryText">
              <p className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-primaryText block">Address:</strong>
                  {center.address}, {center.city}
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-primaryText block">Contact Hotline:</strong>
                  {center.phone}
                </span>
              </p>
              <p className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>
                  <strong className="text-primaryText block">Operational Hours:</strong>
                  {center.openingHours}
                </span>
              </p>
            </div>

            {/* Accepting Blood Types */}
            <div className="pt-3 border-t border-borderNeutral">
              <h4 className="text-xs font-bold text-primaryText mb-2">Priority Blood Types Accepted</h4>
              <div className="flex flex-wrap gap-2">
                {center.availableBloodTypes.map((type) => (
                  <span
                    key={type}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-medical-50 text-medical border border-medical-200"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Map Visual */}
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-3">
            <h3 className="text-base font-bold text-navy">Geographic Location</h3>
            <div className="h-56 w-full rounded-xl bg-slate-100 border border-slate-200 relative overflow-hidden flex items-center justify-center">
              <div className="text-center p-4">
                <MapPin className="w-8 h-8 text-medical mx-auto mb-1 animate-bounce" />
                <p className="text-xs font-semibold text-primaryText">{center.name}</p>
                <p className="text-[11px] text-secondaryText">
                  Coordinates: {center.coordinates.lat.toFixed(4)}° N, {center.coordinates.lng.toFixed(4)}° W
                </p>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${center.coordinates.lat},${center.coordinates.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block mt-2 text-xs font-semibold text-medical hover:underline"
                >
                  Open in External GPS Map →
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pre-donation Guidelines */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4 text-xs text-secondaryText">
            <h3 className="text-sm font-bold text-primaryText border-b border-borderNeutral pb-2">
              Before You Donate
            </h3>
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Drink at least 500ml of water prior to your appointment.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Eat a wholesome meal within 2 to 3 hours before donation.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <span>Bring a valid government or student photo ID.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Minimum interval between whole blood donations is 56 days.</span>
              </li>
            </ul>

            <div className="pt-2">
              <Button
                variant="primary"
                size="md"
                className="w-full"
                onClick={() => setBookingModalOpen(true)}
              >
                Book Appointment Slot
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title="Schedule Donation Appointment"
        subtitle={center.name}
      >
        {bookingSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h4 className="text-base font-bold text-primaryText">Appointment Reserved!</h4>
            <p className="text-xs text-secondaryText">
              A confirmation and SMS notification have been prepared for {appointmentDate || 'your selected slot'}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleBooking} className="space-y-4">
            <Input
              label="Donor Full Name"
              defaultValue={currentUser?.fullName || 'Omar Farooq'}
              required
            />
            <Input
              label="Contact Phone"
              defaultValue={currentUser?.phone || '+1 (555) 019-2834'}
              required
            />
            <Input
              label="Preferred Appointment Date & Time"
              type="datetime-local"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              required
            />
            <div className="pt-3 flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setBookingModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Confirm Booking
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
