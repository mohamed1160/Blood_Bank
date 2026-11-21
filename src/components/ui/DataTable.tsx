import React, { useState, useMemo } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'
import { EmptyState } from '../shared/EmptyState'
import { useI18n } from '../../i18n/I18nContext'

export interface Column<T> {
  header: string
  accessorKey?: keyof T
  cell?: (row: T) => React.ReactNode
  sortable?: boolean
  className?: string
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  pageSize?: number
  isLoading?: boolean
  keyExtractor?: (row: T) => string
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: React.ReactNode
  onRowClick?: (row: T) => void
  className?: string
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  pageSize = 10,
  isLoading = false,
  keyExtractor,
  emptyTitle,
  emptyDescription,
  emptyAction,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const { language } = useI18n()
  const isAr = language === 'ar'
  const resolvedEmptyTitle = emptyTitle || (isAr ? 'لا توجد سجلات' : 'No records found')
  const resolvedEmptyDesc = emptyDescription || (isAr ? 'لا توجد بيانات مطابقة للبحث الحالي.' : 'There are no items matching the current query.')
  const [sortKey, setSortKey] = useState<keyof T | null>(null)
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [currentPage, setCurrentPage] = useState<number>(1)

  const handleSort = (key?: keyof T) => {
    if (!key) return
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
  }

  const sortedData = useMemo(() => {
    if (!sortKey) return data
    return [...data].sort((a, b) => {
      const valA = a[sortKey]
      const valB = b[sortKey]
      if (valA === valB) return 0
      if (valA == null) return 1
      if (valB == null) return -1
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1
      return sortOrder === 'asc' ? 1 : -1
    })
  }, [data, sortKey, sortOrder])

  const totalPages = Math.ceil(sortedData.length / pageSize) || 1
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedData.slice(start, start + pageSize)
  }, [sortedData, currentPage, pageSize])

  if (isLoading) {
    return (
      <div className="rounded-xl border border-borderNeutral bg-white p-8 shadow-card text-center text-xs text-secondaryText">
        {isAr ? 'جاري تحميل البيانات...' : 'Loading records...'}
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-borderNeutral bg-white p-6 shadow-card">
        <EmptyState title={resolvedEmptyTitle} description={resolvedEmptyDesc} action={emptyAction} />
      </div>
    )
  }

  return (
    <div className={cn('rounded-xl border border-borderNeutral bg-white shadow-card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full text-left rtl:text-right text-sm text-primaryText">
          <thead className="bg-surface-muted/80 text-xs uppercase font-semibold text-secondaryText border-b border-borderNeutral">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && handleSort(col.accessorKey)}
                  className={cn(
                    'py-3.5 px-4 font-semibold select-none',
                    col.sortable && 'cursor-pointer hover:text-navy-700 transition-colors',
                    col.className
                  )}
                >
                  <div className="flex items-center gap-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortKey === col.accessorKey ? (
                          sortOrder === 'asc' ? (
                            <ChevronUp className="w-3.5 h-3.5 text-navy-700" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-navy-700" />
                          )
                        ) : (
                          <ChevronsUpDown className="w-3.5 h-3.5 hover:text-slate-600" />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-borderNeutral/60">
            {paginatedData.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'transition-colors hover:bg-slate-50/80',
                  onRowClick && 'cursor-pointer'
                )}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={cn('py-3 px-4 text-xs font-normal', col.className)}>
                    {col.cell
                      ? col.cell(row)
                      : col.accessorKey
                      ? String(row[col.accessorKey] ?? '—')
                      : null}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-borderNeutral px-4 py-3 bg-surface-muted/30 text-xs text-secondaryText">
          <p>
            Showing <span className="font-medium text-primaryText">{(currentPage - 1) * pageSize + 1}</span> to{' '}
            <span className="font-medium text-primaryText">
              {Math.min(currentPage * pageSize, data.length)}
            </span>{' '}
            of <span className="font-medium text-primaryText">{data.length}</span> records
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-borderNeutral bg-white text-secondaryText hover:text-primaryText disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium px-2 text-primaryText">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-borderNeutral bg-white text-secondaryText hover:text-primaryText disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
