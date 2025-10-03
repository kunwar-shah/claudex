import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { searchApi } from '../services/api'
import RebuildIndexModal from './RebuildIndexModal'

const RebuildIndexButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false)

  const { data: indexStatus } = useQuery({
    queryKey: ['indexStatus'],
    queryFn: () => searchApi.getIndexStatus().then(res => res.data)
  })

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 rounded-md transition-colors"
        title="Rebuild search index (use this if search results seem outdated)"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
        Rebuild Search Index
      </button>

      <RebuildIndexModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentStats={indexStatus?.stats}
      />
    </>
  )
}

export default RebuildIndexButton
