import React from 'react'
import { PageHeader } from '../../components/shared/PageHeader'
import { BloodCompatibilityViewer } from '../../components/blood/BloodCompatibilityViewer'
import { useI18n } from '../../i18n/I18nContext'

export const CompatibilityPage: React.FC = () => {
  const { t } = useI18n()

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('compatibility.title')}
        subtitle={t('compatibility.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.compatibility') }]}
      />
      <BloodCompatibilityViewer />
    </div>
  )
}
