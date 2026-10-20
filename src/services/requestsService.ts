import { isSupabaseConfigured, supabase } from './supabase'
import { INITIAL_REQUESTS } from './mockData'
import { BloodRequest, RequestStatus, RequestPriority, BloodType, ComponentType, UserProfile } from '../types'

class RequestsService {
  private requests: BloodRequest[] = [...INITIAL_REQUESTS]

  async getRequests(user?: UserProfile | null): Promise<BloodRequest[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('blood_requests').select('*')
      if (user?.role === 'patient') {
        query = query.eq('patient_id', user.id)
      } else if (user?.role === 'hospital' && user.hospitalId) {
        query = query.eq('hospital_id', user.hospitalId)
      } else if (user?.role === 'doctor') {
        query = query.eq('doctor_id', user.id)
      }
      const { data, error } = await query.order('created_at', { ascending: false })
      if (!error && data) return data as BloodRequest[]
    }

    if (!user) return [...this.requests]

    switch (user.role) {
      case 'patient':
        return this.requests.filter((r) => r.patientId === user.id)
      case 'doctor':
        return this.requests.filter((r) => r.doctorId === user.id || r.hospitalId === user.hospitalId)
      case 'hospital':
        return this.requests.filter((r) => r.hospitalId === user.hospitalId || !user.hospitalId)
      case 'admin':
      default:
        return [...this.requests]
    }
  }

  async getRequestById(id: string): Promise<BloodRequest | null> {
    const list = await this.getRequests()
    return list.find((r) => r.id === id) || null
  }

  async createRequest(
    data: {
      patientName: string
      patientMrn?: string
      patientId?: string
      bloodType: BloodType
      component: ComponentType
      quantityUnits: number
      priority: RequestPriority
      neededByDate: string
      reason: string
      clinicalNotes?: string
      hospitalId?: string
      hospitalName?: string
    },
    user?: UserProfile | null
  ): Promise<BloodRequest> {
    const requestNumber = `REQ-${new Date().getFullYear()}-${String(this.requests.length + 91).padStart(3, '0')}`
    const now = new Date().toISOString()

    const newRequest: BloodRequest = {
      id: `req-${Date.now()}`,
      requestNumber,
      patientId: data.patientId || user?.id || 'usr-pat-guest',
      patientName: data.patientName,
      patientMrn: data.patientMrn || 'MRN-PENDING',
      doctorId: user?.role === 'doctor' ? user.id : undefined,
      doctorName: user?.role === 'doctor' ? user.fullName : undefined,
      hospitalId: data.hospitalId || user?.hospitalId || 'hosp-01',
      hospitalName: data.hospitalName || 'Metropolitan General Hospital',
      bloodType: data.bloodType,
      component: data.component,
      quantityUnits: Number(data.quantityUnits),
      fulfilledUnits: 0,
      priority: data.priority,
      status: 'Pending',
      neededByDate: data.neededByDate,
      reason: data.reason,
      clinicalNotes: data.clinicalNotes,
      createdAt: now,
      updatedAt: now,
      statusTimeline: [
        {
          status: 'Pending',
          timestamp: now,
          updatedBy: user?.fullName || 'Requester',
          note: 'Request submitted to hospital blood bank.',
        },
      ],
    }

    if (isSupabaseConfigured() && supabase) {
      const { data: dbData } = await supabase.from('blood_requests').insert([newRequest]).select().single()
      if (dbData) return dbData as BloodRequest
    }

    this.requests.unshift(newRequest)
    return newRequest
  }

  async updateRequestStatus(
    id: string,
    status: RequestStatus,
    user?: UserProfile | null,
    note?: string
  ): Promise<BloodRequest | null> {
    const idx = this.requests.findIndex((r) => r.id === id)
    if (idx === -1) return null

    const req = this.requests[idx]
    const now = new Date().toISOString()
    const updatedTimeline = [
      ...req.statusTimeline,
      {
        status,
        timestamp: now,
        updatedBy: user?.fullName || 'Staff Member',
        note: note || `Status changed to ${status}`,
      },
    ]

    const updated: BloodRequest = {
      ...req,
      status,
      updatedAt: now,
      statusTimeline: updatedTimeline,
      fulfilledUnits: status === 'Fulfilled' ? req.quantityUnits : req.fulfilledUnits,
    }

    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('blood_requests')
        .update({
          status,
          updated_at: now,
          status_timeline: updatedTimeline,
          fulfilled_units: updated.fulfilledUnits,
        })
        .eq('id', id)
        .select()
        .single()
      return data as BloodRequest
    }

    this.requests[idx] = updated
    return updated
  }
}

export const requestsService = new RequestsService()
export const bloodRequestService = requestsService
