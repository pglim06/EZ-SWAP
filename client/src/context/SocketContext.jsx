import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from './AuthContext'

const SocketContext = createContext(null)

const SOCKET_URL = 'http://localhost:5000'

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const socketRef = useRef(null)

  // Connect socket when user logs in
  useEffect(() => {
    if (!user?._id) {
      // No user — disconnect if connected
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setSocket(null)
        setConnected(false)
        setUnreadCount(0)
      }
      return
    }

    // Get JWT from cookie (we'll also try localStorage as fallback)
    const token = document.cookie
      .split(';')
      .find((c) => c.trim().startsWith('token='))
      ?.split('=')[1]

    const newSocket = io(SOCKET_URL, {
      auth: { token },
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    newSocket.on('connect', () => {
      console.log('🟢 Socket.IO connected')
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('🔴 Socket.IO disconnected')
      setConnected(false)
    })

    newSocket.on('unread_update', ({ unreadCount: count }) => {
      setUnreadCount(count)
    })

    newSocket.on('connect_error', (err) => {
      console.warn('Socket.IO connection error:', err.message)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Fetch initial unread count via REST
    fetch('/api/chat/unread-count', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success) setUnreadCount(data.unreadCount)
      })
      .catch(() => {})

    return () => {
      newSocket.disconnect()
      socketRef.current = null
      setSocket(null)
      setConnected(false)
    }
  }, [user?._id])

  // Helper: join a conversation room
  const joinConversation = useCallback(
    (conversationId) => {
      if (socketRef.current) {
        socketRef.current.emit('join_conversation', { conversationId })
      }
    },
    []
  )

  // Helper: leave a conversation room
  const leaveConversation = useCallback(
    (conversationId) => {
      if (socketRef.current) {
        socketRef.current.emit('leave_conversation', { conversationId })
      }
    },
    []
  )

  // Helper: send a message
  const sendMessage = useCallback(
    (conversationId, content) => {
      if (socketRef.current) {
        socketRef.current.emit('send_message', { conversationId, content })
      }
    },
    []
  )

  // Helper: typing indicators
  const emitTyping = useCallback(
    (conversationId) => {
      if (socketRef.current) {
        socketRef.current.emit('typing', { conversationId })
      }
    },
    []
  )

  const emitStopTyping = useCallback(
    (conversationId) => {
      if (socketRef.current) {
        socketRef.current.emit('stop_typing', { conversationId })
      }
    },
    []
  )

  // Helper: mark read
  const markRead = useCallback(
    (conversationId) => {
      if (socketRef.current) {
        socketRef.current.emit('mark_read', { conversationId })
      }
    },
    []
  )

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        unreadCount,
        setUnreadCount,
        joinConversation,
        leaveConversation,
        sendMessage,
        emitTyping,
        emitStopTyping,
        markRead,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
