import { io } from 'socket.io-client'

let socket = null
const listeners = new Map()

export const useSocket = () => {
  const config = useRuntimeConfig()
  const { user } = useAuth()

  const connect = () => {
    if (socket?.connected) return

    socket = io(config.public.socketBase, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10
    })

    socket.on('connect', () => {
      if (user.value?.id) {
        socket.emit('join-user-room', user.value.id)
      }
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
    })
  }

  const joinTontine = (tontineId) => {
    if (socket?.connected && tontineId) {
      socket.emit('join-tontine', tontineId)
    }
  }

  const on = (event, callback) => {
    if (!socket) connect()
    // Remove old listener for same event+callback to avoid duplicates
    socket.off(event, callback)
    socket.on(event, callback)
    // Track for cleanup
    if (!listeners.has(event)) listeners.set(event, new Set())
    listeners.get(event).add(callback)
  }

  const off = (event, callback) => {
    socket?.off(event, callback)
    listeners.get(event)?.delete(callback)
  }

  const disconnect = () => {
    socket?.disconnect()
    socket = null
    listeners.clear()
  }

  return { connect, disconnect, joinTontine, on, off, socket: () => socket }
}
