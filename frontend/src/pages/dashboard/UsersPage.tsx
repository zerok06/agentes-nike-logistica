import React, { useEffect, useState } from 'react'
import { Users as UsersIcon, Shield, User as UserIcon, RefreshCw, Plus } from 'lucide-react'
import { Card } from '../../components/ui/Card'
import { Loader } from '../../components/ui/Loader'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useAuthStore } from '../../store/useAuthStore'
import { authService } from '../../services/auth.service'
import type { User, UserRole } from '../../types/auth'

const roleConfig: Record<string, { label: string; variant: 'danger' | 'info' | 'success'; icon: React.ReactNode }> = {
  admin: { label: 'Administrador', variant: 'danger', icon: <Shield className="w-3 h-3" /> },
  supervisor: { label: 'Supervisor', variant: 'info', icon: <UsersIcon className="w-3 h-3" /> },
  operador: { label: 'Operador', variant: 'success', icon: <UserIcon className="w-3 h-3" /> },
}

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuthStore()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const data = await authService.listUsers()
      setUsers(data)
    } catch {
      // Error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="space-y-6">
      <Card
        title="Gestión de Usuarios"
        icon={<UsersIcon className="w-5 h-5 text-nikeOrange" />}
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              className="text-xs text-nikeOrange hover:text-white transition-colors uppercase font-bold tracking-wider flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Refrescar
            </button>
            <Button size="sm" onClick={() => setShowForm(!showForm)}>
              <Plus className="w-4 h-4 mr-1" />
              Nuevo
            </Button>
          </div>
        }
      >
        {loading ? (
          <Loader label="Cargando usuarios..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-white/5 text-white/40 text-xs uppercase tracking-wider">
                  <th className="py-3 px-2">ID</th>
                  <th className="py-3 px-2">Username</th>
                  <th className="py-3 px-2">Email</th>
                  <th className="py-3 px-2">Rol</th>
                  <th className="py-3 px-2">Estado</th>
                  <th className="py-3 px-2 text-right">Creado</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const role = roleConfig[user.role] || roleConfig.operador
                  return (
                    <tr
                      key={user.user_id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3.5 px-2 font-mono text-xs text-white/40">
                        #{user.user_id}
                      </td>
                      <td className="py-3.5 px-2 font-semibold text-white/90">
                        {user.username}
                        {user.user_id === currentUser?.user_id && (
                          <span className="ml-2 text-xs text-nikeOrange">(Tú)</span>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-white/60">{user.email}</td>
                      <td className="py-3.5 px-2">
                        <Badge variant={role.variant}>
                          {role.icon}
                          {role.label}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-2">
                        {user.is_active ? (
                          <Badge variant="success">Activo</Badge>
                        ) : (
                          <Badge variant="danger">Inactivo</Badge>
                        )}
                      </td>
                      <td className="py-3.5 px-2 text-right text-xs text-white/40 font-mono">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showForm && (
        <RegisterUserForm
          onClose={() => setShowForm(false)}
          onCreated={fetchUsers}
        />
      )}
    </div>
  )
}

const RegisterUserForm: React.FC<{ onClose: () => void; onCreated: () => void }> = ({
  onClose,
  onCreated,
}) => {
  const { register } = useAuthStore()
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<UserRole>('operador')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await register({ email, username, password, role })
      onCreated()
      onClose()
    } catch (err: any) {
      setError(err.message || 'Error al crear usuario')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card title="Nuevo Usuario" icon={<Plus className="w-5 h-5 text-nikeOrange" />}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
              required
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-white/40 uppercase tracking-wider font-semibold">
              Rol
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="bg-background border border-white/10 rounded-xl p-2.5 text-sm text-white focus:border-nikeOrange outline-none"
            >
              <option value="admin">Administrador</option>
              <option value="supervisor">Supervisor</option>
              <option value="operador">Operador</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="text-xs text-red-400 font-semibold bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <Button type="submit" loading={loading}>Crear Usuario</Button>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Card>
  )
}
