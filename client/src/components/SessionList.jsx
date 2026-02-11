import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { Circle, CircleDot, Clock, MessageCircle } from 'lucide-react'
import { projectsApi, sessionMetadataApi } from '../services/api'
import SessionMetadataControls from './SessionMetadataControls'
import ProjectExportButton from './ProjectExportButton'
import { Card, CardContent } from './ui/card'
import { Badge } from './ui/badge'
import { Button } from './ui/button'
import { Muted, Small } from './ui/typography'
import { cn } from '@/lib/utils'

const SessionList = ({ projectId, selectedSessionId }) => {
  const navigate = useNavigate()
  const [showHidden, setShowHidden] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['sessions', projectId],
    queryFn: () => projectsApi.getSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  const { data: hiddenData } = useQuery({
    queryKey: ['hidden-sessions', projectId],
    queryFn: () => sessionMetadataApi.getHiddenSessions(projectId).then(res => res.data),
    enabled: !!projectId
  })

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectsApi.getProjects().then(res => res.data)
  })

  const currentProject = projectsData?.projects?.find(p => p.id === projectId)

  const handleSessionSelect = (sessionId) => {
    navigate(`/projects/${projectId}/sessions/${sessionId}`)
  }

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-20 bg-surface animate-pulse rounded-lg border border-border"></div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <Card className="border-error">
          <CardContent className="p-4">
            <Muted className="text-error">
              Failed to load sessions: {error.message}
            </Muted>
          </CardContent>
        </Card>
      </div>
    )
  }

  const sessions = data?.sessions || []
  const hiddenSessions = hiddenData?.hiddenSessions || []

  const filteredSessions = sessions.filter(session => {
    if (!showHidden && hiddenSessions.includes(session.sessionId)) {
      return false
    }
    return true
  })

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with filters */}
      <div className="px-4 py-3 border-b border-border bg-surface">
        <div className="flex items-center justify-between mb-3">
          <div>
            <Small className="font-semibold">Sessions</Small>
            <Muted className="text-xs mt-0.5">{filteredSessions.length} conversations</Muted>
          </div>
          {currentProject && (
            <ProjectExportButton
              projectId={projectId}
              projectName={currentProject.name}
              variant="compact"
            />
          )}
        </div>

        {/* Show hidden toggle */}
        <Button
          variant={showHidden ? "default" : "outline"}
          size="sm"
          onClick={() => setShowHidden(!showHidden)}
          className="w-full gap-2"
        >
          {showHidden ? <CircleDot className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
          <span>{showHidden ? 'Showing All' : 'Show Hidden'}</span>
        </Button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredSessions.length === 0 ? (
          <div className="flex items-center justify-center h-32">
            <Muted>No sessions found</Muted>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredSessions.map((session) => {
              const isHidden = hiddenSessions.includes(session.sessionId)
              return (
                <SessionListItem
                  key={session.sessionId}
                  session={session}
                  projectId={projectId}
                  isSelected={selectedSessionId === session.sessionId}
                  isHidden={isHidden}
                  onSelect={handleSessionSelect}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to clean title
const cleanTitle = (title) => {
  if (!title) return ''
  let cleaned = title.replace(/<ide_selection>.*?<\/ide_selection>/gs, '')
  cleaned = cleaned.replace(/<ide_opened_file>.*?<\/ide_opened_file>/gs, '')
  cleaned = cleaned.replace(/<system-reminder>.*?<\/system-reminder>/gs, '')
  // Generic catch-all for any remaining XML/HTML tags
  cleaned = cleaned.replace(/<\/?[a-zA-Z_][a-zA-Z0-9_-]*[^>]*>/g, '')
  cleaned = cleaned.trim()
  return cleaned.length > 0 ? cleaned : title
}

// Clean session item with shadcn Card + Typography
const SessionListItem = ({ session, projectId, isSelected, isHidden, onSelect }) => {
  const { data: metadataData } = useQuery({
    queryKey: ['session-metadata', projectId, session.sessionId],
    queryFn: () => sessionMetadataApi.getMetadata(projectId, session.sessionId).then(res => res.data),
    enabled: !!projectId && !!session.sessionId
  })

  const metadata = metadataData?.metadata || {}
  const displayTitle = metadata.customTitle || cleanTitle(session.title) || session.sessionId

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-md",
        isSelected && "ring-2 ring-primary shadow-md",
        isHidden && "opacity-60"
      )}
      onClick={() => onSelect(session.sessionId)}
    >
      <CardContent className="p-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            {isHidden && <CircleDot className="w-4 h-4 text-text-secondary flex-shrink-0 mt-0.5" />}
            <Small className="font-semibold line-clamp-2 flex-1">
              {displayTitle}
            </Small>
          </div>
          <Badge variant="outline" className="flex-shrink-0">
            <MessageCircle className="w-3 h-3 mr-1" />
            {session.messageCount}
          </Badge>
        </div>

        {/* Tags */}
        {metadata.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {metadata.tags.slice(0, 3).map(tag => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
            {metadata.tags.length > 3 && (
              <Muted className="text-xs">+{metadata.tags.length - 3} more</Muted>
            )}
          </div>
        )}

        {/* Footer row */}
        <div className="flex items-center justify-between gap-2">
          <Muted className="text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(session.lastUpdatedAt), { addSuffix: true })}
          </Muted>
          {session.template && session.template !== 'unknown' && (
            <Badge variant="outline" className="text-xs">
              {session.template.slice(0, 8)}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default SessionList
