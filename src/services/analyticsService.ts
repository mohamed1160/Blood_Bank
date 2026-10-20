import { inventoryService } from './inventoryService'
import { requestsService } from './requestsService'
import { donorService } from './donorService'
import { INITIAL_PREDICTIONS } from './mockData'
import { AIPrediction, BloodType } from '../types'

export interface AnalyticsKPIs {
  totalRequests: number
  fulfilledRequests: number
  fulfillmentRate: number // %
  totalUnitsInStock: number
  lowStockCount: number
  expiringSoonCount: number
  completedDonations: number
  donationCompletionRate: number // %
  stockoutRate: number // %
}

class AnalyticsService {
  async getKPIs(): Promise<AnalyticsKPIs> {
    const units = await inventoryService.getUnits()
    const requests = await requestsService.getRequests()
    const donations = await donorService.getDonationHistory()

    const totalRequests = requests.length
    const fulfilledRequests = requests.filter((r) => r.status === 'Fulfilled').length
    const fulfillmentRate = totalRequests > 0 ? Math.round((fulfilledRequests / totalRequests) * 100) : 0

    const availableUnits = units.filter((u) => u.status === 'Available')
    const lowStockAlerts = inventoryService.getLowStockAlerts(units)
    const expiringSoon = inventoryService.getExpiringUnits(units, 7)

    const completedDonations = donations.filter((d) => d.status === 'Completed').length
    const totalDonationsLogged = donations.length
    const donationCompletionRate =
      totalDonationsLogged > 0 ? Math.round((completedDonations / totalDonationsLogged) * 100) : 100

    // Stockout rate: unfulfilled urgent/stat requests divided by total requests
    const unmetUrgent = requests.filter(
      (r) => (r.priority === 'Urgent' || r.priority === 'Emergency (Stat)') && r.status !== 'Fulfilled'
    ).length
    const stockoutRate = totalRequests > 0 ? Math.round((unmetUrgent / totalRequests) * 100) : 0

    return {
      totalRequests,
      fulfilledRequests,
      fulfillmentRate,
      totalUnitsInStock: availableUnits.length,
      lowStockCount: lowStockAlerts.length,
      expiringSoonCount: expiringSoon.length,
      completedDonations,
      donationCompletionRate,
      stockoutRate,
    }
  }

  async getDemandByBloodType(): Promise<{ bloodType: BloodType; requested: number; issued: number }[]> {
    const requests = await requestsService.getRequests()
    const bloodTypes: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

    return bloodTypes.map((bt) => {
      const typeReqs = requests.filter((r) => r.bloodType === bt)
      const requested = typeReqs.reduce((sum, r) => sum + r.quantityUnits, 0)
      const issued = typeReqs.reduce((sum, r) => sum + r.fulfilledUnits, 0)
      return { bloodType: bt, requested, issued }
    })
  }

  async getStockDistribution(): Promise<{ name: BloodType; units: number; color: string }[]> {
    const units = await inventoryService.getUnits()
    const available = units.filter((u) => u.status === 'Available')
    const bloodTypes: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']
    const colors = ['#C62828', '#E53935', '#EF5350', '#F87171', '#334E68', '#486581', '#627D98', '#829AB1']

    return bloodTypes.map((bt, i) => ({
      name: bt,
      units: available.filter((u) => u.bloodType === bt).length,
      color: colors[i % colors.length],
    }))
  }

  async getDonationMonthlyTrends(): Promise<{ month: string; donations: number; target: number }[]> {
    return [
      { month: 'Jan', donations: 42, target: 50 },
      { month: 'Feb', donations: 56, target: 50 },
      { month: 'Mar', donations: 68, target: 60 },
      { month: 'Apr', donations: 61, target: 60 },
      { month: 'May', donations: 74, target: 65 },
      { month: 'Jun (Est)', donations: 80, target: 70 },
    ]
  }

  async getDemandTrends(): Promise<{ day: string; routine: number; urgent: number; stat: number }[]> {
    return [
      { day: 'Mon', routine: 12, urgent: 4, stat: 1 },
      { day: 'Tue', routine: 15, urgent: 6, stat: 2 },
      { day: 'Wed', routine: 18, urgent: 3, stat: 0 },
      { day: 'Thu', routine: 14, urgent: 8, stat: 3 },
      { day: 'Fri', routine: 20, urgent: 5, stat: 2 },
      { day: 'Sat', routine: 8, urgent: 7, stat: 4 },
      { day: 'Sun', routine: 6, urgent: 5, stat: 2 },
    ]
  }

  async getAIForecast(): Promise<AIPrediction> {
    return INITIAL_PREDICTIONS
  }

  exportDataToCSV(filename: string, rows: object[]): void {
    if (!rows || !rows.length) return
    const headers = Object.keys(rows[0])
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = (row as Record<string, unknown>)[h]
            const escaped = String(val ?? '').replace(/"/g, '""')
            return `"${escaped}"`
          })
          .join(',')
      ),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.setAttribute('download', `${filename}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

export const analyticsService = new AnalyticsService()
