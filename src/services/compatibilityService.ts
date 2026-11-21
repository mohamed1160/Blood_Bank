import { BloodType, ComponentType } from '../types'

export interface CompatibilityRuleResult {
  canReceiveFrom: BloodType[]
  canDonateTo: BloodType[]
  universalStatus?: 'universal_donor' | 'universal_recipient'
  scientificExplanationEn: string
  scientificExplanationAr: string
}

// RBC Compatibility
const RBC_RECEIVE_MAP: Record<BloodType, BloodType[]> = {
  'O-': ['O-'],
  'O+': ['O+', 'O-'],
  'A-': ['A-', 'O-'],
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
}

const RBC_DONATE_MAP: Record<BloodType, BloodType[]> = {
  'O-': ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'],
  'O+': ['AB+', 'A+', 'B+', 'O+'],
  'A-': ['AB+', 'AB-', 'A+', 'A-'],
  'A+': ['AB+', 'A+'],
  'B-': ['AB+', 'AB-', 'B+', 'B-'],
  'B+': ['AB+', 'B+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+'],
}

// Plasma Compatibility (Reversed antibodies logic)
const PLASMA_RECEIVE_MAP: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'A-': ['A-', 'A+', 'AB-', 'AB+'],
  'A+': ['A-', 'A+', 'AB-', 'AB+'],
  'B-': ['B-', 'B+', 'AB-', 'AB+'],
  'B+': ['B-', 'B+', 'AB-', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB-', 'AB+'],
}

const PLASMA_DONATE_MAP: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+'],
  'O+': ['O-', 'O+'],
  'A-': ['A-', 'A+', 'O-', 'O+'],
  'A+': ['A-', 'A+', 'O-', 'O+'],
  'B-': ['B-', 'B+', 'O-', 'O+'],
  'B+': ['B-', 'B+', 'O-', 'O+'],
  'AB-': ['AB-', 'AB+', 'A-', 'A+', 'B-', 'B+', 'O-', 'O+'],
  'AB+': ['AB-', 'AB+', 'A-', 'A+', 'B-', 'B+', 'O-', 'O+'],
}

// Platelet Compatibility (Generally follows plasma or identical)
const PLATELET_RECEIVE_MAP: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'A-', 'B-', 'AB-'],
  'O+': ['O+', 'O-', 'A+', 'B+', 'AB+'],
  'A-': ['A-', 'AB-', 'O-'],
  'A+': ['A+', 'A-', 'AB+', 'O+'],
  'B-': ['B-', 'AB-', 'O-'],
  'B+': ['B+', 'B-', 'AB+', 'O+'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'AB+': ['AB+', 'AB-', 'A+', 'B+', 'O+'],
}

const PLATELET_DONATE_MAP: Record<BloodType, BloodType[]> = {
  'O-': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+': ['O+'],
  'A-': ['A-', 'A+', 'O-', 'O+'],
  'A+': ['A+'],
  'B-': ['B-', 'B+', 'O-', 'O+'],
  'B+': ['B+'],
  'AB-': ['AB-', 'AB+', 'A-', 'A+', 'B-', 'B+', 'O-', 'O+'],
  'AB+': ['AB+'],
}

export class CompatibilityService {
  getCompatibility(type: BloodType, component: ComponentType): CompatibilityRuleResult {
    let canReceiveFrom: BloodType[] = []
    let canDonateTo: BloodType[] = []
    let universalStatus: 'universal_donor' | 'universal_recipient' | undefined = undefined

    if (component === 'Fresh Frozen Plasma' || component === 'Cryoprecipitate') {
      canReceiveFrom = PLASMA_RECEIVE_MAP[type] || [type]
      canDonateTo = PLASMA_DONATE_MAP[type] || [type]

      if (type === 'AB+' || type === 'AB-') {
        universalStatus = 'universal_donor' // Universal plasma donor
      } else if (type === 'O+' || type === 'O-') {
        universalStatus = 'universal_recipient' // Universal plasma recipient
      }

      return {
        canReceiveFrom,
        canDonateTo,
        universalStatus,
        scientificExplanationEn:
          'Plasma contains circulating antibodies against absent ABO antigens. AB plasma contains neither anti-A nor anti-B antibodies, making AB donors universal plasma donors.',
        scientificExplanationAr:
          'تحتوي البلازما على الأجسام المضادة الطبيعية المقابلة للمستضدات الغائبة. بلازما فصيلة AB لا تحتوي على أجسام مضادة ضد A أو B، مما يجعل متبرع AB متبرعاً عاماً للبلازما لكافة المرضى.',
      }
    }

    if (component === 'Platelets') {
      canReceiveFrom = PLATELET_RECEIVE_MAP[type] || [type]
      canDonateTo = PLATELET_DONATE_MAP[type] || [type]
      return {
        canReceiveFrom,
        canDonateTo,
        universalStatus,
        scientificExplanationEn:
          'Platelets possess small amounts of ABO antigens and trace plasma. ABO-identical platelets are optimal; Rh-negative females of childbearing potential should receive Rh-negative platelets.',
        scientificExplanationAr:
          'تحمل الصفائح الدموية كميات ضئيلة من مستضدات ABO مع بلازما متبقية. يفضل دائماً إعطاء صفائح دموية متطابقة فصيلياً، ويراعى عامل ريزوس (Rh-) للإناث في سن الإنجاب.',
      }
    }

    // Default: Packed Red Blood Cells & Whole Blood
    canReceiveFrom = RBC_RECEIVE_MAP[type] || [type]
    canDonateTo = RBC_DONATE_MAP[type] || [type]

    if (type === 'O-') {
      universalStatus = 'universal_donor'
    } else if (type === 'AB+') {
      universalStatus = 'universal_recipient'
    }

    return {
      canReceiveFrom,
      canDonateTo,
      universalStatus,
      scientificExplanationEn:
        'Red blood cells carry A, B, and Rh (D) surface antigens. O- erythrocytes have no A, B, or Rh surface antigens, permitting uncrossmatched transfusion in extreme emergencies.',
      scientificExplanationAr:
        'تحمل كريات الدم الحمراء مستضدات A و B ومستضد Rh (D). كريات دم O- تفتقر إلى أي من هذه المستضدات السطحية، مما يتيح استخدامها كمتبرع عام في حالات الطوارئ الحادة والنزف المهدد للحياة.',
    }
  }

  isCompatible(donorType: BloodType, recipientType: BloodType, component: ComponentType): boolean {
    const res = this.getCompatibility(recipientType, component)
    return res.canReceiveFrom.includes(donorType)
  }
}

export const compatibilityService = new CompatibilityService()
