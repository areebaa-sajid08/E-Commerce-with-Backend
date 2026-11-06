import { io } from 'socket.io-client'

// One shared connection. It is opened by AuthContext once we know who is signed in
// (the httpOnly login cookie is sent with the handshake, so the server knows the account).
export const socket = io(import.meta.env.VITE_SOCKET_URL || undefined, {
  withCredentials: true,
  autoConnect: false,
})

// open (or re-open) the connection, e.g. after sign-in / sign-out so the server sees the new identity
export function reconnectSocket() {
  if (socket.connected || socket.active) socket.disconnect()
  socket.connect()
}
