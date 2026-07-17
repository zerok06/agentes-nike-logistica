import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Loader2, ScanLine } from 'lucide-react'
import { Card } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { inventoryService } from '../../services/inventory.service'
import { useIsMobile } from '../../hooks/useIsMobile'
import { BarcodeScanner } from '../../components/BarcodeScanner'
import type { ChatMessage } from '../../types/inventory'

const QUICK_QUESTIONS = [
  '¿Qué productos tienen stock crítico?',
  '¿Cuántos pares de Air Jordan hay en Lima?',
  '¿Qué almacén tiene más inventario?',
  '¿Puedo ver el stock de Pegasus?',
]

export const ChatbotPage: React.FC = () => {
  const isMobile = useIsMobile()
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      sender: 'bot',
      text: '¡Hola! Soy tu Asistente Logístico de Nike. ¿En qué puedo ayudarte hoy con el inventario o despachos?',
      timestamp: new Date(),
    },
  ])
  const [loadingChat, setLoadingChat] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const sendQuestion = async (question: string) => {
    setChatHistory((prev) => [
      ...prev,
      { sender: 'user', text: question, timestamp: new Date() },
    ])
    setLoadingChat(true)

    try {
      const result = await inventoryService.sendChatMessage(question)
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

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!chatMessage.trim()) return
    const userMsg = chatMessage
    setChatMessage('')
    await sendQuestion(userMsg)
  }

  const handleQuickQuestion = (question: string) => {
    setChatMessage(question)
  }

  const handleBarcodeScan = async (decodedText: string) => {
    setShowScanner(false)
    const question = `Buscar producto con código: ${decodedText}`
    await sendQuestion(question)
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-4">
      {showScanner && (
        <BarcodeScanner
          onScan={handleBarcodeScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="flex-1 flex flex-col lg:flex-row gap-4 overflow-hidden">
        {/* Chat */}
        <div className="flex-1 h-full min-h-0">
          <Card className="h-full flex flex-col overflow-hidden p-0">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-white/5 p-4 shrink-0">
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-nikeOrange shrink-0" />
                <div>
                  <h2 className="text-sm sm:text-lg font-bold tracking-tight text-white/90">
                    Asistente Logístico RAG
                  </h2>
                  <p className="text-[10px] sm:text-xs text-white/40 hidden sm:block">
                    Powered by pgvector & Groq
                  </p>
                </div>
              </div>
              {isMobile && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                  className="shrink-0 gap-1.5"
                >
                  <ScanLine className="w-4 h-4" />
                  <span className="text-xs">Escanear</span>
                </Button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto flex flex-col gap-3 p-4 min-h-0">
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[90%] sm:max-w-[85%] rounded-2xl p-3 text-sm ${
                      msg.sender === 'user'
                        ? 'bg-nikeOrange text-white rounded-tr-none'
                        : 'bg-white/5 border border-white/5 text-white/90 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed break-words">{msg.text}</p>
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
                  <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-none p-3 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 text-nikeOrange animate-spin" />
                    <span className="text-xs text-white/40">
                      Buscando en pgvector & consultando Groq...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSendChat} className="flex gap-2 p-4 border-t border-white/5 shrink-0">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Pregunta sobre stock, almacenes, productos..."
                className="flex-1 bg-background border border-white/10 rounded-2xl px-4 py-2.5 sm:py-3 text-sm focus:border-primary outline-none text-white min-w-0"
              />
              {isMobile && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                  className="rounded-2xl p-2.5 sm:p-3 shrink-0"
                >
                  <ScanLine className="w-4 h-4 sm:w-5 sm:h-5" />
                </Button>
              )}
              <Button
                type="submit"
                disabled={loadingChat || !chatMessage.trim()}
                className="rounded-2xl p-2.5 sm:p-3 shrink-0"
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </form>
          </Card>
        </div>

        {/* Quick questions sidebar - horizontal scroll on mobile */}
        <div className="lg:w-64 shrink-0">
          {isMobile ? (
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              {QUICK_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => handleQuickQuestion(q)}
                  className="shrink-0 text-left p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white whitespace-nowrap"
                >
                  {q}
                </button>
              ))}
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  )
}
