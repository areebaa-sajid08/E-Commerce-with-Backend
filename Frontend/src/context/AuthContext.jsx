import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../lib/api'
import { reconnectSocket, socket } from '../lib/socket'
import { useSocketEvent } from '../lib/useSocket'
import { useToast } from './ToastContext'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const toast = useToast()

  useEffect(() => {
    authApi.me()
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  // (re)connect the socket whenever the signed-in account changes, so the server knows who we are
  useEffect(() => {
    if (loading) return
    reconnectSocket()
  }, [loading, user?._id])
  useEffect(() => () => { socket.disconnect() }, [])

  // an admin removed this account while it was open
  useSocketEvent('account:deleted', () => {
    authApi.logout().catch(() => {})
    setUser(null)
    toast('This account was removed by an administrator.', 'error')
  })

  const login = useCallback(async (data) => {
    const res = await authApi.login(data)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const register = useCallback(async (data) => {
    const res = await authApi.register(data)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const registerBrand = useCallback(async (formData) => {
    const res = await authApi.registerBrand(formData)
    setUser(res.data.user)
    return res.data.user
  }, [])

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {})
    setUser(null)
  }, [])

  const value = {
    user, loading, login, register, registerBrand, logout,
    isBrand: user?.role === 'admin',
    isSuper: user?.role === 'superadmin',
    isCustomer: user?.role === 'user',
  }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
