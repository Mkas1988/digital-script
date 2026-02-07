'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Users,
  Plus,
  Trash2,
  Loader2,
  Crown,
  Edit3,
  Eye,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useModule } from '@/hooks/useModules'
import type { ModuleRole } from '@/lib/supabase/types'

const roleConfig: Record<ModuleRole, { label: string; icon: typeof Crown; color: string }> = {
  owner: { label: 'Eigentümer', icon: Crown, color: 'text-amber-500' },
  editor: { label: 'Bearbeiter', icon: Edit3, color: 'text-blue-500' },
  viewer: { label: 'Leser', icon: Eye, color: 'text-slate-500' },
}

export default function ModuleSettingsPage() {
  const router = useRouter()
  const params = useParams()
  const moduleId = params.id as string

  const {
    module,
    isLoading,
    error,
    addMember,
    updateMemberRole,
    removeMember,
  } = useModule(moduleId)

  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState<ModuleRole>('editor')
  const [isAdding, setIsAdding] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  const handleAddMember = async () => {
    if (!newEmail.trim()) return

    setIsAdding(true)
    setAddError(null)

    const success = await addMember(newEmail.trim(), newRole)
    if (success) {
      setNewEmail('')
      setShowAddForm(false)
    } else {
      setAddError('Fehler beim Hinzufügen des Mitglieds')
    }

    setIsAdding(false)
  }

  const handleRoleChange = async (userId: string, role: ModuleRole) => {
    await updateMemberRole(userId, role)
  }

  const handleRemove = async (userId: string) => {
    if (!confirm('Mitglied wirklich entfernen?')) return
    await removeMember(userId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || 'Modul nicht gefunden'}</p>
          <Button onClick={() => router.push('/modules')}>
            Zurück zu Module
          </Button>
        </div>
      </div>
    )
  }

  if (module.role !== 'owner') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">
            Nur der Eigentümer kann die Team-Einstellungen bearbeiten.
          </p>
          <Button onClick={() => router.push(`/modules/${moduleId}`)}>
            Zurück zum Modul
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Header */}
        <header className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/modules/${moduleId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zu {module.title}
          </Button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center">
              <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Team-Einstellungen
              </h1>
              <p className="text-muted-foreground">
                Verwalte wer Zugriff auf dieses Modul hat
              </p>
            </div>
          </div>
        </header>

        {/* Add Member */}
        <section className="bg-card border border-border/50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">
              Mitglied hinzufügen
            </h2>
            {!showAddForm && (
              <Button
                size="sm"
                onClick={() => setShowAddForm(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Hinzufügen
              </Button>
            )}
          </div>

          {showAddForm && (
            <div className="space-y-4">
              {addError && (
                <p className="text-sm text-destructive">{addError}</p>
              )}
              <div className="flex gap-3">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="E-Mail-Adresse"
                  className={cn(
                    'flex-1 px-4 py-2 rounded-lg',
                    'bg-background border border-input',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500'
                  )}
                />
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as ModuleRole)}
                  className={cn(
                    'px-4 py-2 rounded-lg',
                    'bg-background border border-input',
                    'focus:outline-none focus:ring-2 focus:ring-purple-500'
                  )}
                >
                  <option value="editor">Bearbeiter</option>
                  <option value="viewer">Leser</option>
                </select>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAddMember}
                  disabled={isAdding || !newEmail.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {isAdding ? 'Hinzufügen...' : 'Hinzufügen'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowAddForm(false)
                    setNewEmail('')
                    setAddError(null)
                  }}
                  disabled={isAdding}
                >
                  Abbrechen
                </Button>
              </div>
            </div>
          )}
        </section>

        {/* Members List */}
        <section className="bg-card border border-border/50 rounded-xl p-6">
          <h2 className="font-semibold text-foreground mb-4">
            Aktuelle Mitglieder ({module.members.length + 1})
          </h2>

          <div className="space-y-3">
            {/* Owner (yourself) */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">Du</p>
                <p className="text-xs text-muted-foreground">Eigentümer</p>
              </div>
            </div>

            {/* Other Members */}
            {module.members.map((member) => {
              const config = roleConfig[member.role as ModuleRole]
              const Icon = config.icon

              return (
                <div
                  key={member.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border"
                >
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    member.role === 'editor'
                      ? 'bg-blue-100 dark:bg-blue-900/30'
                      : 'bg-slate-100 dark:bg-slate-800'
                  )}>
                    <Icon className={cn('w-5 h-5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {member.user_id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Eingeladen am {new Date(member.invited_at).toLocaleDateString('de-DE')}
                    </p>
                  </div>
                  <select
                    value={member.role}
                    onChange={(e) => handleRoleChange(member.user_id, e.target.value as ModuleRole)}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm',
                      'bg-background border border-input',
                      'focus:outline-none focus:ring-2 focus:ring-purple-500'
                    )}
                  >
                    <option value="editor">Bearbeiter</option>
                    <option value="viewer">Leser</option>
                  </select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(member.user_id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )
            })}

            {module.members.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Noch keine weiteren Mitglieder hinzugefügt
              </p>
            )}
          </div>
        </section>

        {/* Role Explanation */}
        <section className="mt-6 p-4 rounded-lg bg-muted/30 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">Rollen-Übersicht:</p>
          <ul className="space-y-1">
            <li><strong>Bearbeiter:</strong> Kann Dokumente hinzufügen und Inhalte bearbeiten</li>
            <li><strong>Leser:</strong> Kann nur lesen und eigenen Lernfortschritt tracken</li>
          </ul>
        </section>
      </div>
    </div>
  )
}
