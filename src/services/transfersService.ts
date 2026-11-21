import { INITIAL_TRANSFERS } from './mockData'
import { HospitalTransferRequest, TransferStatus, UserProfile } from '../types'

const STORAGE_KEY = 'blood_bank_transfers_data'

class TransfersService {
  private transfers: HospitalTransferRequest[]

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        this.transfers = JSON.parse(saved)
      } catch {
        this.transfers = [...INITIAL_TRANSFERS]
      }
    } else {
      this.transfers = [...INITIAL_TRANSFERS]
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.transfers))
    } catch {
      // Storage fallback
    }
  }

  async getTransfers(user?: UserProfile | null): Promise<HospitalTransferRequest[]> {
    if (!user || user.role === 'admin') {
      return [...this.transfers]
    }

    if (user.role === 'hospital' && user.hospitalId) {
      return this.transfers.filter(
        (t) => t.sourceHospitalId === user.hospitalId || t.targetHospitalId === user.hospitalId
      )
    }

    return [...this.transfers]
  }

  async getTransferById(id: string): Promise<HospitalTransferRequest | null> {
    return this.transfers.find((t) => t.id === id) || null
  }

  async createTransfer(
    data: Omit<HospitalTransferRequest, 'id' | 'transferNumber' | 'status' | 'createdAt' | 'updatedAt'>
  ): Promise<HospitalTransferRequest> {
    const nextNum = this.transfers.length + 1
    const transferNumber = `TR-${new Date().getFullYear()}-${String(nextNum).padStart(3, '0')}`
    const now = new Date().toISOString()

    const newTransfer: HospitalTransferRequest = {
      ...data,
      id: `tr-${Date.now()}`,
      transferNumber,
      status: 'Pending',
      createdAt: now,
      updatedAt: now,
    }

    this.transfers.unshift(newTransfer)
    this.persist()
    return newTransfer
  }

  async updateTransferStatus(
    id: string,
    status: TransferStatus,
    options?: {
      quantityOffered?: number
      notes?: string
      transitDetails?: HospitalTransferRequest['transitDetails']
    }
  ): Promise<HospitalTransferRequest | null> {
    const idx = this.transfers.findIndex((t) => t.id === id)
    if (idx === -1) return null

    this.transfers[idx] = {
      ...this.transfers[idx],
      status,
      quantityOffered: options?.quantityOffered ?? this.transfers[idx].quantityOffered,
      notes: options?.notes ? `${this.transfers[idx].notes || ''} | ${options.notes}` : this.transfers[idx].notes,
      transitDetails: options?.transitDetails ? { ...this.transfers[idx].transitDetails, ...options.transitDetails } : this.transfers[idx].transitDetails,
      updatedAt: new Date().toISOString(),
    }

    this.persist()
    return this.transfers[idx]
  }

  async dispatchTransfer(
    id: string,
    transit: {
      courierName: string
      contactPhone: string
      storageTemperature: string
      estimatedArrival?: string
    }
  ): Promise<HospitalTransferRequest | null> {
    return this.updateTransferStatus(id, 'In Transit', {
      transitDetails: {
        ...transit,
        dispatchedAt: new Date().toISOString(),
      },
    })
  }

  async receiveTransfer(
    id: string,
    receivedBy: string
  ): Promise<HospitalTransferRequest | null> {
    return this.updateTransferStatus(id, 'Received', {
      transitDetails: {
        receivedAt: new Date().toISOString(),
        receivedBy,
      },
    })
  }
}

export const transfersService = new TransfersService()
