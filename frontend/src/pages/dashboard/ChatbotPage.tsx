import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Loader2 } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { inventoryService } from '../../services/inventory.service'
import type { ChatMessage } from '../../types/inventory'

const QUICK_QUESTIONS = [
  '¿Qué productos tienen stock crítico?',
  '¿Cuántos pares de Air Jordan hay en Lima?',
  '¿Qué almacén tiene más inventario?',
  '¿Puedo ver el stock de Pegasus?',
]

export const ChatbotPage: React.FC = () => {
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu Asistente Logístico de Nike. ¿En qué puedo ayudarte hoy con el inventario o despachos?',
      timestamp: new Date(),
    },
  ])
  const [loadingChat, setLoadingChat] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return

    const userMsg = chatMessage
    setChatMessage('')
    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: userMsg, timestamp: new Date() },
    ])
    setLoadingChat(true)

    try {
      const result = await inventoryService.sendChatMessage(userMsg)
      setChatHistory((prev) => [
        ...prev,
        { sender: 'bot', text: result.response, timestamp: new Date() },
      ])
    } catch {
      setChatHistory((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: 'Lo siento, ocurrió un error al consultar el chatbot de Nike.',
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoadingChat(false)
    }
  }

  const handleQuickQuestion = (question: string) => {
    setChatMessage(question)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
      {/* Chat */}
      <div className="lg:col-span-3 h-full">
        <Card className="h-full flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4">
            <MessageSquare className="w-5 h-5 text-nikeOrange" />
            <div>
              <h2 className="text-lg font-bold tracking-tight text-white/90">
                Asistente Logístico RAG
              </h2>
              <p className="text-xs text-white/40">Powered by pgvector & DeepSeek</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col gap-4 mb-4 pr-2">
            {chatHistory.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 text-sm ${
                    msg.sender === 'user'
                      ? 'bg-nikeOrange text-white rounded-tr-none'
                      : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                  <span className="text-[10px] text-white/30 block text-right mt-1.5">
                    {msg.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
            {loadingChat && (
              <div className="flex justify-start">
                <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2">
                  <Loader2 className="w-4 h-4 text-nikeOrange animate-spin" />
                  <span className="text-xs text-white/40">
                    Buscando en pgvector & consultando DeepSeek...
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              placeholder="Pregunta sobre stock, jordan, pegasus..."
              className="flex-1 bg-background border border-white/10 rounded-2xl px-4 py-3 text-sm focus:border-primary outline-none text-white"
            />
            <Button
              type="submit"
              disabled={loadingChat || !chatMessage.trim()}
              className="rounded-2xl p-3.5"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </Card>
      </div>

      {/* Quick questions sidebar */}
      <div className="lg:col-span-1">
        <Card title="Preguntas Rápidas" icon={<MessageSquare className="w-5 h-5 text-nikeOrange" />}>
          <div className="space-y-2">
            {QUICK_QUESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => handleQuickQuestion(q)}
                className="w-full text-left p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-sm text-white/70 hover:text-white"
              >
                {q}
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
