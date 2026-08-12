import React, { useState, useRef, useEffect } from 'react'
import { Project } from '../../pages/ProjectListPage'
import { fetchApi } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import { FormattedMarkdown } from '../ui/FormattedMarkdown'
import {
  IconSparkles,
  IconCopy,
  IconCheckCircle,
  IconRefresh,
} from '../ui/Icons'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  suggested_commands?: string[]
  patch_action?: {
    type: 'dockerfile' | 'cicd'
    dockerfile_content?: string
    cicd_config?: any
    explanation?: string
  } | null
  timestamp: string
  liked?: boolean
  disliked?: boolean
}

interface AICopilotChatProps {
  selectedProject: Project | null
  logText?: string
  parsedErrors?: any[]
  onSwitchProject?: () => void
}

export const AICopilotChat: React.FC<AICopilotChatProps> = ({
  selectedProject,
  logText = '',
  parsedErrors = [],
  onSwitchProject,
}) => {
  const { session } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputPrompt, setInputPrompt] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [thinkingStep, setThinkingStep] = useState<string>('')
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null)
  const [copiedCmdId, setCopiedCmdId] = useState<string | null>(null)
  const [pastSessions, setPastSessions] = useState<any[]>([])
  const [openMenuSessionId, setOpenMenuSessionId] = useState<string | null>(null)
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingTitleText, setEditingTitleText] = useState<string>('')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [attachedLogFile, setAttachedLogFile] = useState<{
    name: string
    content: string
    size: string
  } | null>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = (event.target?.result as string) || ''
      const sizeKB = (file.size / 1024).toFixed(1)
      setAttachedLogFile({
        name: file.name,
        content,
        size: `${sizeKB} KB`,
      })
    }
    reader.readAsText(file)
  }

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchPastSessions = async () => {
    if (!selectedProject) return
    try {
      const res = await fetchApi(
        `/api/ai/sessions/${selectedProject.id}`,
        {},
        session?.access_token
      )
      if (res.ok) {
        const data = await res.json()
        setPastSessions(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      console.error('Failed to load past chat sessions', err)
    }
  }

  useEffect(() => {
    fetchPastSessions()
  }, [selectedProject?.id, session?.access_token])

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await fetchApi(
        `/api/ai/sessions/${sessionId}`,
        { method: 'DELETE' },
        session?.access_token
      )
      if (openMenuSessionId === sessionId) setOpenMenuSessionId(null)
      fetchPastSessions()
    } catch (err) {
      console.error('Failed to delete chat session', err)
    }
  }

  const handleStartRename = (sess: any, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(sess.id)
    setEditingTitleText(sess.title || '')
    setOpenMenuSessionId(null)
  }

  const handleSaveRename = async (sessionId: string, e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!editingTitleText.trim()) return
    try {
      await fetchApi(
        `/api/ai/sessions/${sessionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: editingTitleText.trim() }),
        },
        session?.access_token
      )
      setEditingSessionId(null)
      fetchPastSessions()
    } catch (err) {
      console.error('Failed to rename chat session', err)
    }
  }

  const handleRestoreSession = (sess: any) => {
    if (sess.messages && Array.isArray(sess.messages) && sess.messages.length > 0) {
      const formatted = sess.messages.map((m: any, idx: number) => ({
        id: m.id || `restored-${idx}`,
        role: m.role || 'assistant',
        content: m.content || '',
        suggested_commands: m.suggested_commands || [],
        patch_action: m.patch_action || null,
        timestamp: m.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }))
      setMessages(formatted)
    }
  }

  // Initialize Welcome Message
  useEffect(() => {
    if (selectedProject) {
      setMessages((prev) => {
        if (prev.length > 0) return prev
        return [
          {
            id: `welcome-${selectedProject.id}`,
            role: 'assistant',
            content: `👋 Welcome to Log Analysis AI Copilot for **${selectedProject.name}**!\n\nI am specialized strictly in log analysis, exception diagnosis, and error troubleshooting.\n\nAttach a \`.log\` or \`.txt\` file using the **+** button below or paste your raw error logs to receive an instant root-cause diagnosis and step-by-step resolution!`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]
      })
    }
  }, [selectedProject?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isSending, thinkingStep])

  const handleSendMessage = async (promptText?: string) => {
    const text = (promptText || inputPrompt).trim()
    if ((!text && !attachedLogFile) || isSending || !selectedProject) return

    const messageContent = attachedLogFile
      ? `[Attached Log File: ${attachedLogFile.name}]\n${text || 'Please analyze this log file and diagnose root causes.'}`
      : text

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageContent,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessages((prev) => [...prev, userMsg])
    if (!promptText) setInputPrompt('')
    setIsSending(true)

    setThinkingStep('Analyzing project AST & dependency trees...')
    setTimeout(() => {
      setThinkingStep('Inspecting Dockerfile & CI/CD workflow state...')
    }, 700)
    setTimeout(() => {
      setThinkingStep('Synthesizing AI response & fix patches...')
    }, 1400)

    try {
      const history = messages
        .filter((m) => !m.id.startsWith('welcome-'))
        .map((m) => ({ role: m.role, content: m.content }))

      const effectiveLogText =
        attachedLogFile?.content ||
        logText ||
        selectedProject?.analysis_results?.last_log_text ||
        (selectedProject as any)?.last_log_text ||
        localStorage.getItem('last_pasted_log_text') ||
        ''

      setAttachedLogFile(null)

      const res = await fetchApi(
        '/api/ai/troubleshoot/chat',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            project_id: selectedProject.id,
            message: text,
            history,
            log_text: effectiveLogText,
            parsed_errors: parsedErrors,
          }),
        },
        session?.access_token
      )

      if (!res.ok) {
        throw new Error('AI Copilot request failed')
      }

      const data = await res.json()

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'No analysis response generated.',
        suggested_commands: data.suggested_commands || [],
        patch_action: data.patch_action || null,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      }

      setMessages((prev) => [...prev, assistantMsg])
      fetchPastSessions()
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          role: 'assistant',
          content:
            'Sorry, I encountered an issue analyzing this request. Please check backend connection.',
          confidence: 'LOW',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    } finally {
      setIsSending(false)
      setThinkingStep('')
    }
  }

  const handleRegenerateLast = () => {
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      handleSendMessage(lastUserMsg.content)
    }
  }

  const handleClearHistory = async () => {
    if (selectedProject) {
      try {
        await fetchApi(
          `/api/ai/projects/${selectedProject.id}/sessions`,
          { method: 'DELETE' },
          session?.access_token
        )
      } catch (err) {
        console.error('Failed to clear session history from database', err)
      }

      const rawFw =
        typeof selectedProject.analysis_results?.framework === 'string'
          ? selectedProject.analysis_results.framework
          : 'Python'
      const framework = rawFw === 'Django' ? 'Python / ML' : rawFw

      setMessages([
        {
          id: `welcome-${Date.now()}`,
          role: 'assistant',
          content: `History permanently deleted from database. Fresh AI session started for **${selectedProject.name}** (${framework}). What would you like to build or troubleshoot next?`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ])
    }
  }

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedMsgId(id)
    setTimeout(() => setCopiedMsgId(null), 2000)
  }

  const handleCopyCmd = (cmd: string, id: string) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmdId(id)
    setTimeout(() => setCopiedCmdId(null), 2000)
  }

  const handleToggleLike = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, liked: !m.liked, disliked: false } : m))
    )
  }

  const handleToggleDislike = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, disliked: !m.disliked, liked: false } : m))
    )
  }

  const framework =
    typeof selectedProject?.analysis_results?.framework === 'string' && selectedProject.analysis_results.framework.trim() !== ''
      ? selectedProject.analysis_results.framework
      : 'Python'
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Center Main Workspace (8 cols on large screens, matching MindMerge mockup layout) */}
      <div className="lg:col-span-8 flex flex-col h-[750px] rounded-3xl border border-border-light bg-surface shadow-medium overflow-hidden">
        {/* Studio Top Header Bar */}
        <div className="px-6 py-4 border-b border-border-light bg-surface flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indeed-blue text-white shadow-subtle font-extrabold text-sm">
              <IconSparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-text-primary tracking-tight">
                  AI MLOps Chatbot
                </h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indeed-blue-light text-indeed-blue font-bold text-[10px] uppercase tracking-wider">
                  {framework}
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">
                Active Project: <strong className="text-text-primary font-bold">{selectedProject?.name}</strong>
              </p>
            </div>
          </div>

          {onSwitchProject && (
            <button
              type="button"
              onClick={onSwitchProject}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-border-medium bg-surface hover:bg-gray-50 text-text-primary text-xs font-bold transition-all shadow-subtle cursor-pointer"
            >
              <span>← Switch Project</span>
            </button>
          )}
        </div>

        {/* Chat Thread Messages Stream */}
        <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#F8F9FA]/60">
          {messages.map((msg) => {
            const isUser = msg.role === 'user'
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} animate-fade-in`}
              >
                <div
                  className={`max-w-[92%] rounded-3xl p-6 space-y-4 shadow-subtle transition-all ${
                    isUser
                      ? 'bg-indeed-blue text-white rounded-br-none'
                      : 'bg-surface border border-border-light text-text-primary rounded-bl-none'
                  }`}
                >
                  {/* AI Response Header */}
                  {!isUser && (
                    <div className="flex items-center justify-between gap-3 border-b border-border-light pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indeed-blue-light text-indeed-blue font-extrabold text-xs">
                          AI
                        </div>
                        <span className="text-xs font-extrabold text-text-primary">
                          AI Copilot Studio
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Clean Markdown Content rendering (No raw ### or ** visible!) */}
                  {isUser ? (
                    <div className="text-xs leading-relaxed font-sans">{msg.content}</div>
                  ) : (
                    <FormattedMarkdown content={msg.content} />
                  )}

                  {/* Suggested Commands Snippets */}
                  {!isUser && msg.suggested_commands && msg.suggested_commands.length > 0 && (
                    <div className="space-y-2 border-t border-border-light pt-3">
                      <div className="text-[10px] font-mono font-bold text-text-secondary uppercase tracking-wider">
                        Suggested Terminal Commands
                      </div>
                      {msg.suggested_commands.map((cmd, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-[#1E293B] p-3.5 border border-slate-700 shadow-subtle"
                        >
                          <code className="text-[11px] font-mono text-emerald-400 truncate flex-1 selection:bg-emerald-950">
                            $ {cmd}
                          </code>
                          <button
                            type="button"
                            onClick={() => handleCopyCmd(cmd, `${msg.id}-${idx}`)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all cursor-pointer shrink-0"
                            title="Copy command"
                          >
                            {copiedCmdId === `${msg.id}-${idx}` ? (
                              <IconCheckCircle className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <IconCopy className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reaction Bar (Matching MindMerge mockup action bar: Thumbs up/down, Copy, Timestamp) */}
                  {!isUser && (
                    <div className="flex items-center justify-between border-t border-border-light pt-3 text-xs text-text-secondary">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(msg.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            msg.liked ? 'bg-blue-50 text-indeed-blue font-bold' : 'hover:bg-gray-100 text-text-secondary'
                          }`}
                          title="Helpful"
                        >
                          👍
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleDislike(msg.id)}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            msg.disliked ? 'bg-red-50 text-error font-bold' : 'hover:bg-gray-100 text-text-secondary'
                          }`}
                          title="Not helpful"
                        >
                          👎
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyText(msg.content, msg.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-text-secondary transition-colors cursor-pointer"
                          title="Copy response"
                        >
                          {copiedMsgId === msg.id ? (
                            <IconCheckCircle className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <IconCopy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      <div className="text-[10px] text-text-muted font-mono">{msg.timestamp}</div>
                    </div>
                  )}

                  {isUser && <div className="text-[9px] text-right text-blue-100 font-mono">{msg.timestamp}</div>}
                </div>
              </div>
            )
          })}

          {/* Regenerate Response Pill Button (Centered exactly like MindMerge mockup) */}
          {messages.length > 1 && !isSending && (
            <div className="flex justify-center my-4">
              <button
                type="button"
                onClick={handleRegenerateLast}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border-medium bg-surface hover:bg-gray-50 text-xs font-bold text-text-primary shadow-subtle transition-all cursor-pointer hover:shadow-medium"
              >
                <IconRefresh className="h-4 w-4 text-indeed-blue" />
                <span>Regenerate response</span>
              </button>
            </div>
          )}

          {/* Thought Process Bar */}
          {isSending && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface border border-indeed-blue/30 text-text-primary text-xs shadow-subtle animate-pulse w-full max-w-md">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-indeed-blue-light text-indeed-blue font-bold">
                <IconSparkles className="h-4 w-4 animate-spin" />
              </div>
              <div className="space-y-0.5">
                <div className="font-bold text-indeed-blue">AI Copilot Reasoning</div>
                <div className="text-[11px] text-text-secondary">{thinkingStep || 'Processing request...'}</div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Floating Input Bar with '+' Log Attachment Button */}
        <div className="p-4 border-t border-border-light bg-surface space-y-2">
          {/* Attached Log Badge Pill */}
          {attachedLogFile && (
            <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 rounded-xl bg-indeed-blue-light border border-indeed-blue/30 text-xs font-bold text-indeed-blue shadow-subtle animate-fade-in">
              <div className="flex items-center gap-2 truncate">
                <span className="text-sm select-none">📄</span>
                <span className="truncate">{attachedLogFile.name}</span>
                <span className="text-[10px] text-indeed-blue/80 font-mono">({attachedLogFile.size})</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachedLogFile(null)}
                className="p-0.5 rounded-lg hover:bg-indeed-blue/10 text-indeed-blue text-sm font-extrabold cursor-pointer transition-colors"
                title="Remove log attachment"
              >
                &times;
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept=".log,.txt,.json,.trace"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* '+' Log File Attachment Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 hover:bg-indeed-blue-light hover:text-indeed-blue text-text-primary font-extrabold text-xl transition-all shadow-subtle cursor-pointer shrink-0 border border-border-medium"
              title="Attach log file or trace (.log, .txt)"
            >
              +
            </button>

            {/* Input Prompt Box */}
            <div className="relative flex-1 flex items-center bg-[#F8F9FA] rounded-2xl border border-border-medium px-4 py-2.5 shadow-subtle focus-within:border-indeed-blue focus-within:bg-surface focus-within:ring-2 focus-within:ring-indeed-blue/20 transition-all">
              <span className="text-text-muted text-sm mr-2 select-none">✨</span>
              <input
                type="text"
                placeholder={attachedLogFile ? `Ask AI Copilot to analyze ${attachedLogFile.name}...` : `Ask AI Copilot anything about ${selectedProject?.name}...`}
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSendMessage()
                }}
                className="w-full bg-transparent text-xs text-text-primary placeholder-text-secondary focus:outline-none"
              />
            </div>

            {/* Send Button */}
            <button
              type="button"
              disabled={(!inputPrompt.trim() && !attachedLogFile) || isSending}
              onClick={() => handleSendMessage()}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indeed-blue hover:bg-indeed-blue-hover text-white disabled:opacity-50 transition-all shadow-subtle cursor-pointer shrink-0"
            >
              <svg className="h-5 w-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 0l-7 7m7-7l7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar (Log Analysis Conversation History) */}
      <div className="lg:col-span-4 rounded-3xl border border-border-light bg-surface p-6 shadow-medium space-y-6 flex flex-col justify-between h-[750px]">
        <div className="space-y-6">
          {/* Saved Chat Sessions History (Supabase DB Backed) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h5 className="text-xs font-extrabold text-text-primary uppercase tracking-wider">
                📜 Conversation History
              </h5>
              <span className="text-[10px] font-bold text-text-secondary">
                {pastSessions.length} saved
              </span>
            </div>

            {pastSessions.length === 0 ? (
              <div className="p-3.5 rounded-2xl border border-dashed border-border-medium bg-gray-50/60 text-center space-y-1">
                <div className="text-xs font-bold text-text-primary">Fresh Session Active</div>
                <div className="text-[10px] text-text-secondary">No previous history saved. Messages will persist in database.</div>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {pastSessions.map((sess, idx) => (
                  <div
                    key={sess.id || idx}
                    onClick={() => handleRestoreSession(sess)}
                    className="relative p-3 rounded-2xl border border-border-light bg-surface hover:border-indeed-blue hover:shadow-subtle transition-all cursor-pointer flex items-center justify-between gap-2 group"
                  >
                    {editingSessionId === sess.id ? (
                      <form
                        onSubmit={(e) => handleSaveRename(sess.id, e)}
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 w-full"
                      >
                        <input
                          type="text"
                          value={editingTitleText}
                          onChange={(e) => setEditingTitleText(e.target.value)}
                          autoFocus
                          className="w-full text-xs font-bold px-2 py-1 rounded-lg border border-indeed-blue focus:outline-none bg-surface text-text-primary"
                        />
                        <button
                          type="submit"
                          className="px-2 py-1 rounded-lg bg-indeed-blue text-white text-xs font-bold hover:bg-indeed-blue-hover shrink-0"
                          title="Save title"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingSessionId(null)
                          }}
                          className="px-2 py-1 rounded-lg bg-gray-100 text-text-secondary text-xs font-bold hover:bg-gray-200 shrink-0"
                          title="Cancel"
                        >
                          ✕
                        </button>
                      </form>
                    ) : (
                      <>
                        <div className="truncate flex-1 space-y-0.5">
                          <div className="text-xs font-bold text-text-primary group-hover:text-indeed-blue transition-colors truncate">
                            {sess.title || `Session ${idx + 1}`}
                          </div>
                          <div className="text-[10px] text-text-secondary">
                            {sess.messages?.length || 2} messages • {new Date(sess.created_at || Date.now()).toLocaleDateString()}
                          </div>
                        </div>

                        {/* 3-Dots Menu Button */}
                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenMenuSessionId(openMenuSessionId === sess.id ? null : sess.id)
                            }}
                            className="p-1.5 rounded-xl hover:bg-gray-100 text-text-secondary transition-colors text-xs font-black tracking-widest cursor-pointer"
                            title="Session options"
                          >
                            •••
                          </button>

                          {/* 3-Dots Dropdown Popover */}
                          {openMenuSessionId === sess.id && (
                            <div className="absolute right-0 top-8 z-30 w-36 rounded-2xl border border-border-medium bg-surface p-1.5 shadow-elevated animate-fade-in text-xs">
                              <button
                                type="button"
                                onClick={(e) => handleStartRename(sess, e)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-gray-100 text-text-primary font-bold transition-colors text-left cursor-pointer"
                              >
                                <span>✏️</span>
                                <span>Rename</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSession(sess.id, e)}
                                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-50 text-error font-bold transition-colors text-left cursor-pointer"
                              >
                                <span>🗑️</span>
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Clear History Button (Matching MindMerge mockup clear history button) */}
        <div className="pt-4 border-t border-border-light">
          <button
            type="button"
            onClick={handleClearHistory}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-border-medium bg-surface hover:bg-gray-50 text-xs font-bold text-text-secondary hover:text-error transition-all shadow-subtle cursor-pointer"
          >
            <span>🗑️ Clear history</span>
          </button>
        </div>
      </div>
    </div>
  )
}
