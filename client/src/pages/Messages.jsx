import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  Image,
  User,
  Circle,
} from 'lucide-react'

export default function Messages() {
  const { user } = useAuth()
  const {
    socket,
    connected,
    joinConversation,
    leaveConversation,
    sendMessage: socketSendMessage,
    emitTyping,
    emitStopTyping,
    markRead,
  } = useSocket()

  const [searchParams] = useSearchParams()
  const listingIdParam = searchParams.get('listingId')

  const [conversations, setConversations] = useState([])
  const [activeConvId, setActiveConvId] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMsg, setNewMsg] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [typingUsers, setTypingUsers] = useState({})
  const [showSidebar, setShowSidebar] = useState(true)

  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const prevConvRef = useRef(null)

  const currentUserId = user?._id

  // ─── Fetch conversations ─────────────────────────────────────────────
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/conversations', { credentials: 'include' })
      const data = await res.json()
      if (data.success) setConversations(data.conversations)
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    } finally {
      setLoadingConvs(false)
    }
  }, [])

  useEffect(() => {
    if (currentUserId) fetchConversations()
  }, [currentUserId, fetchConversations])

  // ─── Auto-start conversation from ListingDetail redirect ──────────
  useEffect(() => {
    if (!listingIdParam || !currentUserId) return

    const startOrFindConversation = async () => {
      try {
        const res = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ listingId: listingIdParam }),
        })
        const data = await res.json()
        if (data.success && data.conversation) {
          await fetchConversations()
          setActiveConvId(data.conversation._id)
          setShowSidebar(false)
        }
      } catch (err) {
        console.error('Failed to start conversation:', err)
      }
    }
    startOrFindConversation()
  }, [listingIdParam, currentUserId, fetchConversations])

  // ─── Fetch messages when activeConvId changes ─────────────────────
  useEffect(() => {
    if (!activeConvId) return

    // Leave previous room
    if (prevConvRef.current && prevConvRef.current !== activeConvId) {
      leaveConversation(prevConvRef.current)
    }

    const fetchMessages = async () => {
      setLoadingMsgs(true)
      try {
        const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
          credentials: 'include',
        })
        const data = await res.json()
        if (data.success) setMessages(data.messages)
      } catch (err) {
        console.error('Failed to fetch messages:', err)
      } finally {
        setLoadingMsgs(false)
      }
    }

    fetchMessages()
    joinConversation(activeConvId)
    markRead(activeConvId)
    prevConvRef.current = activeConvId
  }, [activeConvId, joinConversation, leaveConversation, markRead])

  // ─── Socket event listeners ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = ({ message }) => {
      if (message.conversationId === activeConvId) {
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === message._id)) return prev
          return [...prev, message]
        })
        markRead(activeConvId)
      }
      // Refresh conversation list to update previews
      fetchConversations()
    }

    const handleTyping = ({ conversationId, userId, userName }) => {
      if (conversationId === activeConvId && userId !== currentUserId) {
        setTypingUsers((prev) => ({ ...prev, [userId]: userName }))
      }
    }

    const handleStopTyping = ({ conversationId, userId }) => {
      if (conversationId === activeConvId) {
        setTypingUsers((prev) => {
          const copy = { ...prev }
          delete copy[userId]
          return copy
        })
      }
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleTyping)
    socket.on('user_stop_typing', handleStopTyping)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleTyping)
      socket.off('user_stop_typing', handleStopTyping)
    }
  }, [socket, activeConvId, currentUserId, markRead, fetchConversations])

  // ─── Auto-scroll to bottom ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // ─── Send message ─────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvId) return

    const content = newMsg.trim()
    setNewMsg('')
    emitStopTyping(activeConvId)

    if (connected) {
      socketSendMessage(activeConvId, content)
    } else {
      // Fallback to REST
      try {
        const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ content }),
        })
        const data = await res.json()
        if (data.success) {
          setMessages((prev) => [...prev, data.message])
          fetchConversations()
        }
      } catch (err) {
        console.error('Failed to send message:', err)
      }
    }
  }

  // ─── Typing indicator logic ───────────────────────────────────────
  const handleInputChange = (e) => {
    setNewMsg(e.target.value)
    if (activeConvId && connected) {
      emitTyping(activeConvId)
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => {
        emitStopTyping(activeConvId)
      }, 2000)
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────
  const getOtherUser = (conv) => {
    if (!conv) return null
    return conv.buyerId?._id === currentUserId ? conv.sellerId : conv.buyerId
  }

  const activeConv = conversations.find((c) => c._id === activeConvId)
  const otherUser = getOtherUser(activeConv)
  const typingNames = Object.values(typingUsers)

  // ─── Guard: not logged in ─────────────────────────────────────────
  if (!currentUserId) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-slate-500 gap-4 px-4">
        <MessageCircle className="w-12 h-12 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-900">Sign in to view messages</h2>
        <p className="text-sm text-slate-500">
          You need an account to chat with buyers and sellers.
        </p>
        <Link
          to="/login"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl text-sm transition"
        >
          Sign In
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
      <div className="bg-white border border-slate-200 rounded-none sm:rounded-2xl shadow-xs overflow-hidden flex" style={{ height: 'calc(100vh - 5rem)' }}>

        {/* ─── Sidebar: conversation list ──────────────────────────── */}
        <div
          className={`${
            showSidebar ? 'flex' : 'hidden md:flex'
          } flex-col w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white`}
        >
          {/* Sidebar header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              Messages
            </h2>
            {connected && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
                <Circle className="w-2 h-2 fill-emerald-500 text-emerald-500" /> Live
              </span>
            )}
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <MessageCircle className="w-10 h-10 text-slate-200 mb-3" />
                <p className="text-sm font-medium text-slate-500">No conversations yet</p>
                <p className="text-xs text-slate-400 mt-1">
                  Start a chat from any listing page!
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const other = getOtherUser(conv)
                const isActive = conv._id === activeConvId
                const listing = conv.listingId

                return (
                  <button
                    key={conv._id}
                    onClick={() => {
                      setActiveConvId(conv._id)
                      setShowSidebar(false)
                    }}
                    className={`w-full text-left px-5 py-4 border-b border-slate-50 flex gap-3 transition cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/80 border-l-2 border-l-blue-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                      {other?.profilePictureUrl ? (
                        <img
                          src={other.profilePictureUrl}
                          alt={other.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (other?.name || 'U').charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-slate-900 truncate">
                          {other?.name || 'User'}
                        </span>
                        {conv.lastMessage && (
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {listing && (
                        <p className="text-[11px] text-blue-600 font-medium truncate flex items-center gap-1 mt-0.5">
                          <Image className="w-3 h-3" />
                          {listing.title}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-500 truncate">
                          {conv.lastMessage?.content || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shrink-0 ml-2">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* ─── Chat area ──────────────────────────────────────────── */}
        <div
          className={`${
            showSidebar ? 'hidden md:flex' : 'flex'
          } flex-1 flex-col bg-slate-50`}
        >
          {activeConvId && activeConv ? (
            <>
              {/* Chat header */}
              <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex items-center gap-3">
                <button
                  onClick={() => setShowSidebar(true)}
                  className="md:hidden text-slate-500 hover:text-blue-600 p-1"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>

                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 overflow-hidden">
                  {otherUser?.profilePictureUrl ? (
                    <img
                      src={otherUser.profilePictureUrl}
                      alt={otherUser.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (otherUser?.name || 'U').charAt(0).toUpperCase()
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 truncate">
                    {otherUser?.name || 'User'}
                  </h3>
                  {activeConv.listingId && (
                    <Link
                      to={`/listings/${activeConv.listingId._id}`}
                      className="text-[11px] text-blue-600 hover:underline truncate block"
                    >
                      Re: {activeConv.listingId.title} — RM{' '}
                      {activeConv.listingId.price}
                    </Link>
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <MessageCircle className="w-8 h-8 text-slate-200 mb-2" />
                    <p className="text-sm text-slate-400">
                      Start the conversation! Say hello 👋
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine =
                      (msg.senderId?._id || msg.senderId) === currentUserId
                    return (
                      <div
                        key={msg._id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-blue-600 text-white rounded-br-md'
                              : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md shadow-xs'
                          }`}
                        >
                          {!isMine && (
                            <p className="text-[10px] font-semibold text-blue-600 mb-1">
                              {msg.senderId?.name || 'User'}
                            </p>
                          )}
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              isMine ? 'text-blue-200' : 'text-slate-400'
                            }`}
                          >
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })
                )}

                {/* Typing indicator */}
                {typingNames.length > 0 && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-bl-md shadow-xs">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="flex gap-0.5">
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </span>
                        {typingNames.join(', ')} is typing...
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <div className="px-4 py-3 border-t border-slate-200 bg-white">
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSend()
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newMsg}
                    onChange={handleInputChange}
                    placeholder="Type a message..."
                    maxLength={2000}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition placeholder:text-slate-400"
                  />
                  <button
                    type="submit"
                    disabled={!newMsg.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white p-2.5 rounded-xl transition shrink-0 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          ) : (
            /* Empty state when no conversation is selected */
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                <MessageCircle className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Select a conversation
              </h3>
              <p className="text-sm text-slate-500 max-w-xs">
                Choose a chat from the sidebar or start a new conversation from any listing
                page.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = now - d

  if (diff < 60000) return 'just now'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`
  if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (d.toDateString() === new Date(now - 86400000).toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
