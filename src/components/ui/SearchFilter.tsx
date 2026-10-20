import React from 'react'
import { Search, X, Filter } from 'lucide-react'
import { Button } from './Button'

export interface FilterOption {
  label: string
  value: string
}

export interface SearchFilterProps {
  searchPlaceholder?: string
  searchValue: string
  onSearchChange: (value: string) => void
  filterOptions?: {
    id: string
    label: string
    options: FilterOption[]
    currentValue: string
    onChange: (val: string) => void
  }[]
  onReset?: () => void
  actions?: React.ReactNode
}

export const SearchFilter: React.FC<SearchFilterProps> = ({
  searchPlaceholder = 'Search records...',
  searchValue,
  onSearchChange,
  filterOptions = [],
  onReset,
  actions,
}) => {
  const hasActiveFilters = searchValue !== '' || filterOptions.some((f) => f.currentValue !== '')

  return (
    <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-borderNeutral shadow-card mb-4">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full pl-9 pr-8 py-2 text-sm bg-surface-muted/60 hover:bg-surface-muted focus:bg-white rounded-lg border border-borderNeutral focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-400 transition-colors"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5">
        {filterOptions.map((f) => (
          <div key={f.id} className="relative flex items-center">
            <select
              value={f.currentValue}
              onChange={(e) => f.onChange(e.target.value)}
              className="text-xs font-medium py-2 pl-3 pr-8 bg-surface-muted/60 hover:bg-surface-muted rounded-lg border border-borderNeutral text-primaryText focus:border-navy-500 focus:outline-none transition-colors cursor-pointer appearance-none"
            >
              <option value="">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <Filter className="absolute right-2.5 pointer-events-none w-3.5 h-3.5 text-slate-400" />
          </div>
        ))}

        {hasActiveFilters && onReset && (
          <Button variant="ghost" size="sm" onClick={onReset} className="text-xs h-9">
            Reset
          </Button>
        )}

        {actions && <div className="flex items-center gap-2 ml-auto">{actions}</div>}
      </div>
    </div>
  )
}
