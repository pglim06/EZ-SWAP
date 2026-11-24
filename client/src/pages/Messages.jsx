import { useEffect, useState, useRef, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext'
import MakeOfferModal from '../components/MakeOfferModal'
import MeetupSchedulingModal from '../components/MeetupSchedulingModal'
import DisputeModal from '../components/DisputeModal'
import RatingModal from '../components/RatingModal'
import {
  MessageCircle,
  Send,
  ArrowLeft,
  Loader2,
  Image,
  User,
  Circle,
  Tag,
  Handshake,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  X,
  AlertCircle,
  AlertTriangle,
  Calendar,
  MapPin,
  Star,
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

  // Offer integration in chat
  const [activeOrder, setActiveOrder] = useState(null)
  const [activeTransaction, setActiveTransaction] = useState(null)
  const [showOfferModal, setShowOfferModal] = useState(false)
  const [showSchedulingModal, setShowSchedulingModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [showRatingModal, setShowRatingModal] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [showCounterInput, setShowCounterInput] = useState(false)
  const [counterPrice, setCounterPrice] = useState('')

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

  // ─── Auto-start conversation from ListingDetail / Browse redirect ──────────
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

  // ─── Fetch active order for the current conversation ───────────────
  const fetchActiveOrder = useCallback(async (conv) => {
    if (!conv?.listingId?._id || !conv?.buyerId?._id) {
      setActiveOrder(null)
      setActiveTransaction(null)
      return
    }
    try {
      const res = await fetch(
        `/api/orders?listingId=${conv.listingId._id}&buyerId=${conv.buyerId._id}`
      )
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const ord = data[0]
        setActiveOrder(ord)
        if (ord.status === 'accepted') {
          try {
            const txRes = await fetch(`/api/transactions/order/${ord._id}`)
            const txData = await txRes.json()
            if (txData && !txData.message) {
              setActiveTransaction(txData)
            } else {
              setActiveTransaction(null)
            }
          } catch {
            setActiveTransaction(null)
          }
        } else {
          setActiveTransaction(null)
        }
      } else {
        setActiveOrder(null)
        setActiveTransaction(null)
      }
    } catch {
      setActiveOrder(null)
      setActiveTransaction(null)
    }
  }, [])

  // ─── Fetch messages & active order when activeConvId changes ─────────────
  useEffect(() => {
    if (!activeConvId) return

    if (prevConvRef.current && prevConvRef.current !== activeConvId) {
      leaveConversation(prevConvRef.current)
    }

    const currentConv = conversations.find((c) => c._id === activeConvId)
    if (currentConv) {
      fetchActiveOrder(currentConv)
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
  }, [activeConvId, conversations, joinConversation, leaveConversation, markRead, fetchActiveOrder])

  // ─── Socket event listeners ───────────────────────────────────────
  useEffect(() => {
    if (!socket) return

    const handleNewMessage = ({ message }) => {
      if (message.conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === message._id)) return prev
          return [...prev, message]
        })
        markRead(activeConvId)

        // If message is related to an offer, refresh active order
        if (message.content.includes('[OFFER') || message.content.includes('[COUNTER')) {
          const currentConv = conversations.find((c) => c._id === activeConvId)
          if (currentConv) fetchActiveOrder(currentConv)
        }
      }
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
  }, [socket, activeConvId, currentUserId, markRead, fetchConversations, conversations, fetchActiveOrder])

  // ─── Auto-scroll to bottom ────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUsers])

  // ─── Refresh messages helper ─────────────────────────────────────
  const reloadMessagesAndOrder = async () => {
    if (!activeConvId) return
    try {
      const res = await fetch(`/api/chat/conversations/${activeConvId}/messages`, {
        credentials: 'include',
      })
      const data = await res.json()
      if (data.success) setMessages(data.messages)

      const currentConv = conversations.find((c) => c._id === activeConvId)
      if (currentConv) fetchActiveOrder(currentConv)
      fetchConversations()
    } catch (err) {
      console.error(err)
    }
  }

  // ─── Send message ─────────────────────────────────────────────────
  const handleSend = async () => {
    if (!newMsg.trim() || !activeConvId) return

    const content = newMsg.trim()
    setNewMsg('')
    emitStopTyping(activeConvId)

    if (connected) {
      socketSendMessage(activeConvId, content)
    } else {
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

  // ─── Order Actions (Accept, Reject, Counter, Cancel) ─────────────
  const handleAcceptOffer = async (orderId) => {
    try {
      setActionLoading(true)
      const res = await fetch(`/api/orders/${orderId}/accept`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to accept offer')
      }
      await reloadMessagesAndOrder()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleRejectOffer = async (orderId) => {
    if (!window.confirm('Are you sure you want to decline this offer?')) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/orders/${orderId}/reject`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to reject offer')
      }
      await reloadMessagesAndOrder()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCounterOffer = async (orderId) => {
    if (!counterPrice || Number(counterPrice) <= 0) {
      alert('Please enter a valid counter price')
      return
    }
    try {
      setActionLoading(true)
      const res = await fetch(`/api/orders/${orderId}/counter`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUserId,
          counterPrice: Number(counterPrice),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to submit counter offer')
      }
      setShowCounterInput(false)
      setCounterPrice('')
      await reloadMessagesAndOrder()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelOffer = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel your offer?')) return
    try {
      setActionLoading(true)
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to cancel offer')
      }
      await reloadMessagesAndOrder()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // ─── T14: Dual Handover Confirmation ─────────────────────────────
  const handleConfirmHandover = async (transactionId, role) => {
    const actionLabel = role === 'seller' ? 'confirm item handover' : 'confirm item receipt'
    if (!window.confirm(`Are you sure you want to ${actionLabel}? This action confirms that the physical exchange has taken place.`)) {
      return
    }
    try {
      setActionLoading(true)
      const res = await fetch(`/api/transactions/${transactionId}/confirm-handover`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, role }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || 'Failed to confirm handover')
      }
      await reloadMessagesAndOrder()
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  // ─── T15: Check if current user already reviewed this transaction ─────
  useEffect(() => {
    if (!activeTransaction?._id || !currentUserId) {
      setHasReviewed(false)
      return
    }
    if (activeTransaction.status !== 'completed') {
      setHasReviewed(false)
      return
    }
    const checkReview = async () => {
      try {
        const res = await fetch(
          `/api/reviews/check?transactionId=${activeTransaction._id}&userId=${currentUserId}`,
          { credentials: 'include' }
        )
        const data = await res.json()
        if (res.ok) setHasReviewed(data.hasReviewed)
      } catch {
        // silent
      }
    }
    checkReview()
  }, [activeTransaction?._id, activeTransaction?.status, currentUserId])

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

  const isBuyer = activeConv?.buyerId?._id === currentUserId
  const isSeller = activeConv?.sellerId?._id === currentUserId

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
      <div
        className="bg-white border border-slate-200 rounded-none sm:rounded-2xl shadow-xs overflow-hidden flex"
        style={{ height: 'calc(100vh - 5rem)' }}
      >
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
                  Start a chat or make an offer from any listing ad!
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
              <div className="px-5 py-3 border-b border-slate-200 bg-white flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
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
                        Re: {activeConv.listingId.title} — RM {activeConv.listingId.price}
                      </Link>
                    )}
                  </div>
                </div>

                {/* Make Offer button right inside Chat header (for buyer) */}
                {isBuyer &&
                  (!activeOrder || ['rejected', 'cancelled'].includes(activeOrder.status)) && (
                    <button
                      onClick={() => setShowOfferModal(true)}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-xs transition cursor-pointer shrink-0"
                    >
                      <Tag className="w-3.5 h-3.5" /> Make Offer
                    </button>
                  )}
              </div>

              {/* ─── Integrated Active Offer Banner directly in Chat ───── */}
              {activeOrder &&
                ['pending', 'countered', 'accepted'].includes(activeOrder.status) && (
                  <div
                    className={`px-5 py-3 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
                      activeOrder.status === 'accepted'
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                        : activeOrder.status === 'countered'
                        ? 'bg-amber-50 border-amber-200 text-amber-900'
                        : 'bg-blue-50/80 border-blue-200 text-blue-900'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {activeOrder.status === 'accepted' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <Handshake className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold flex items-center gap-1.5">
                          <span>
                            {activeOrder.status === 'accepted'
                              ? `Offer Accepted: RM ${
                                  activeOrder.counterPrice || activeOrder.offeredPrice
                                }`
                              : activeOrder.status === 'countered'
                              ? `Counter-Offer: RM ${activeOrder.counterPrice}`
                              : `Active Offer: RM ${activeOrder.offeredPrice}`}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                              activeOrder.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : activeOrder.status === 'countered'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {activeOrder.status}
                          </span>
                        </div>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {activeTransaction?.transactionCode && (
                            <span className="font-semibold text-emerald-800 mr-2 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                              {activeTransaction.transactionCode}
                            </span>
                          )}
                          {activeTransaction?.meetupLocation ? (
                            <span>
                              📍 {activeTransaction.meetupLocation}
                              {activeTransaction.meetupTime
                                ? ` (${new Date(activeTransaction.meetupTime).toLocaleString([], {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })})`
                                : ''}
                            </span>
                          ) : (
                            <span>
                              Method: {activeOrder.transactionMethod === 'meetup' ? 'Campus Meetup' : 'Delivery'}
                              {activeOrder.notes && ` • "${activeOrder.notes}"`}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2">
                      {/* Seller actions for pending offer */}
                      {isSeller && activeOrder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(activeOrder._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept
                          </button>
                          <button
                            onClick={() => setShowCounterInput(!showCounterInput)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Counter
                          </button>
                          <button
                            onClick={() => handleRejectOffer(activeOrder._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Decline
                          </button>
                        </>
                      )}

                      {/* Buyer actions for counter offer */}
                      {isBuyer && activeOrder.status === 'countered' && (
                        <>
                          <button
                            onClick={() => handleAcceptOffer(activeOrder._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded-lg transition shadow-xs cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" /> Accept RM {activeOrder.counterPrice}
                          </button>
                          <button
                            onClick={() => handleCancelOffer(activeOrder._id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" /> Cancel
                          </button>
                        </>
                      )}

                      {/* Buyer action to cancel pending offer */}
                      {isBuyer && activeOrder.status === 'pending' && (
                        <button
                          onClick={() => handleCancelOffer(activeOrder._id)}
                          disabled={actionLoading}
                          className="flex items-center gap-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-semibold px-3 py-1.5 rounded-lg transition cursor-pointer"
                        >
                          Cancel Offer
                        </button>
                      )}

                      {/* Accepted status info with Schedule Meetup, Handover Confirmation & Dispute */}
                      {activeOrder.status === 'accepted' && (
                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            onClick={() => setShowSchedulingModal(true)}
                            className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold px-2.5 py-1.5 rounded-lg transition shadow-2xs cursor-pointer text-xs"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            {activeTransaction?.meetupTime ? 'Meetup Set' : 'Schedule'}
                          </button>

                          {/* T14: Seller Handover Button */}
                          {isSeller && activeTransaction?.status === 'in_progress' && activeTransaction?.sellerConfirmation === 'pending' && (
                            <button
                              onClick={() => handleConfirmHandover(activeTransaction._id, 'seller')}
                              disabled={actionLoading}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Handover
                            </button>
                          )}

                          {/* T14: Buyer Receipt Button */}
                          {isBuyer && activeTransaction?.status === 'in_progress' && activeTransaction?.buyerConfirmation === 'pending' && (
                            <button
                              onClick={() => handleConfirmHandover(activeTransaction._id, 'buyer')}
                              disabled={actionLoading}
                              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer text-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Confirm Received
                            </button>
                          )}

                          {/* Completed or Disputed Badges */}
                          {activeTransaction?.status === 'completed' && (
                            <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-300">
                              Completed ✓
                            </span>
                          )}

                          {/* T15: Leave a Review button — appears when transaction is completed and user hasn't reviewed yet */}
                          {activeTransaction?.status === 'completed' && !hasReviewed && (
                            <button
                              onClick={() => setShowRatingModal(true)}
                              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-2.5 py-1.5 rounded-lg transition shadow-xs cursor-pointer text-xs"
                            >
                              <Star className="w-3.5 h-3.5 fill-white" /> Leave a Review
                            </button>
                          )}

                          {activeTransaction?.status === 'completed' && hasReviewed && (
                            <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> Reviewed
                            </span>
                          )}

                          {activeTransaction?.status === 'disputed' && (
                            <span className="text-[11px] font-bold text-red-700 bg-red-100 px-2 py-1 rounded-md border border-red-300 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Disputed
                            </span>
                          )}

                          {/* Dispute Button */}
                          {activeTransaction?.status === 'in_progress' && (
                            <button
                              onClick={() => setShowDisputeModal(true)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Flag Dispute (T14)"
                            >
                              <AlertTriangle className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Inline Counter Offer Input */}
                    {showCounterInput && (
                      <div className="w-full pt-2 flex items-center gap-2 border-t border-amber-200/60 mt-1">
                        <span className="text-xs font-semibold text-amber-900">
                          Counter Price (RM):
                        </span>
                        <input
                          type="number"
                          value={counterPrice}
                          onChange={(e) => setCounterPrice(e.target.value)}
                          placeholder="e.g. 40"
                          className="w-24 bg-white border border-amber-300 rounded-lg px-2.5 py-1 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                        <button
                          onClick={() => handleCounterOffer(activeOrder._id)}
                          disabled={actionLoading}
                          className="bg-amber-600 hover:bg-amber-700 text-white font-semibold px-3 py-1 rounded-lg text-xs transition cursor-pointer"
                        >
                          Send Counter
                        </button>
                        <button
                          onClick={() => setShowCounterInput(false)}
                          className="text-slate-500 hover:text-slate-700 text-xs px-2 py-1"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}

              {/* Messages stream */}
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

                    // Check if message is a special Offer card
                    const isOfferMessage =
                      msg.content.includes('[OFFER]') ||
                      msg.content.includes('[COUNTER-OFFER]') ||
                      msg.content.includes('[OFFER ACCEPTED]') ||
                      msg.content.includes('[OFFER DECLINED]') ||
                      msg.content.includes('[OFFER CANCELLED]')

                    if (isOfferMessage) {
                      const isAccept = msg.content.includes('[OFFER ACCEPTED]')
                      const isDecline =
                        msg.content.includes('[OFFER DECLINED]') ||
                        msg.content.includes('[OFFER CANCELLED]')
                      const isCounter = msg.content.includes('[COUNTER-OFFER]')

                      return (
                        <div
                          key={msg._id}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs leading-relaxed border shadow-xs ${
                              isAccept
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                                : isDecline
                                ? 'bg-red-50 border-red-200 text-red-950'
                                : isCounter
                                ? 'bg-amber-50 border-amber-200 text-amber-950'
                                : 'bg-blue-50 border-blue-200 text-blue-950'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold mb-1">
                              {isAccept ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : isDecline ? (
                                <XCircle className="w-4 h-4 text-red-600" />
                              ) : isCounter ? (
                                <RotateCcw className="w-4 h-4 text-amber-600" />
                              ) : (
                                <Handshake className="w-4 h-4 text-blue-600" />
                              )}
                              <span>
                                {isAccept
                                  ? 'Offer Accepted'
                                  : isDecline
                                  ? 'Offer Status Update'
                                  : isCounter
                                  ? 'Counter-Offer'
                                  : 'Offer Received'}
                              </span>
                            </div>
                            <p className="whitespace-pre-wrap break-words font-medium">
                              {msg.content}
                            </p>
                            <p className="text-[10px] mt-1.5 opacity-60 text-right">
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    }

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
                          <span
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: '0ms' }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: '150ms' }}
                          />
                          <span
                            className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"
                            style={{ animationDelay: '300ms' }}
                          />
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
                Choose a chat from the sidebar or start a new conversation directly from any
                listing ad.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Make Offer Modal right inside Chat */}
      {activeConv?.listingId && (
        <MakeOfferModal
          isOpen={showOfferModal}
          onClose={() => setShowOfferModal(false)}
          listing={activeConv.listingId}
          currentUser={user}
          onOfferSuccess={async () => {
            setShowOfferModal(false)
            await reloadMessagesAndOrder()
          }}
        />
      )}

      {/* T13: Meetup / Handover Scheduling Modal right inside Chat */}
      {showSchedulingModal && activeOrder && (
        <MeetupSchedulingModal
          transaction={activeTransaction}
          order={activeOrder}
          currentUser={user}
          onClose={() => setShowSchedulingModal(false)}
          onUpdated={async (updatedTx) => {
            setActiveTransaction(updatedTx)
            setShowSchedulingModal(false)
            await reloadMessagesAndOrder()
          }}
        />
      )}

      {/* T14: Dispute Flag Modal right inside Chat */}
      {/* T15: Rating Modal */}
      {showRatingModal && activeTransaction && (
        <RatingModal
          transaction={activeTransaction}
          currentUserId={currentUserId}
          otherUser={otherUser}
          onClose={() => setShowRatingModal(false)}
          onSubmitted={() => {
            setShowRatingModal(false)
            setHasReviewed(true)
          }}
        />
      )}

      {showDisputeModal && activeTransaction && (
        <DisputeModal
          transaction={activeTransaction}
          currentUser={user}
          onClose={() => setShowDisputeModal(false)}
          onSuccess={async (updatedTx) => {
            setActiveTransaction(updatedTx)
            setShowDisputeModal(false)
            await reloadMessagesAndOrder()
          }}
        />
      )}
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
  if (diff < 86400000)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  if (d.toDateString() === new Date(now - 86400000).toDateString())
    return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
