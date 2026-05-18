import React, { useState } from 'react'
import { TYPE_LABELS, TYPE_COLORS } from '@/lib/constants'

// ── Terminal Frame ─────────────────────────────────────────

export function TerminalFrame({ title, children, headerRight }: { title: string; children: React.ReactNode; headerRight?: React.ReactNode }) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #0f172a, #1e293b)",
        border: "1px solid #33415544",
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-800">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500/70" />
          <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
          <div className="w-3 h-3 rounded-full bg-green-500/70" />
        </div>
        <span className="text-xs font-mono text-zinc-500 ml-2">{title}</span>
        {headerRight && <div className="ml-auto">{headerRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

// ── Button ─────────────────────────────────────────────────

export function Button({ children, variant = 'default', size = 'default', className = '', ...props }: any) {
  const base = 'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50 disabled:pointer-events-none'
  const variants: Record<string, string> = {
    default: 'bg-zinc-100 text-zinc-900 hover:bg-white',
    outline: 'border border-zinc-700 bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200',
    ghost: 'bg-transparent hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200',
    destructive: 'bg-red-600 text-white hover:bg-red-500'
  }
  const sizes: Record<string, string> = {
    default: 'h-10 px-4 py-2 text-sm',
    sm: 'h-8 px-3 text-xs',
    icon: 'h-9 w-9'
  }
  return <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>{children}</button>
}

// ── Input ──────────────────────────────────────────────────

export function Input({ className = '', ...props }: any) {
  return <input className={`flex h-9 w-full rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-100 px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 placeholder-zinc-600 transition-all duration-200 ${className}`} {...props} />
}

// ── Textarea ───────────────────────────────────────────────

export function Textarea({ className = '', ...props }: any) {
  return <textarea className={`flex min-h-[60px] w-full rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/50 focus:border-sky-500/50 resize-none placeholder-zinc-600 transition-all duration-200 ${className}`} {...props} />
}

// ── Label ──────────────────────────────────────────────────

export function Label({ children, className = '' }: any) {
  return <label className={`text-sm font-medium leading-none text-zinc-400 ${className}`}>{children}</label>
}

// ── Badge ──────────────────────────────────────────────────

export function Badge({ children, variant = 'default', className = '' }: any) {
  const variants: Record<string, string> = {
    default: 'bg-zinc-800 text-zinc-200',
    secondary: 'bg-zinc-800/50 text-zinc-500',
    outline: 'border border-zinc-700 bg-transparent text-zinc-400'
  }
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${variants[variant]} ${className}`}>{children}</span>
}

// ── Select ─────────────────────────────────────────────────

export function Select({ value, onValueChange }: any) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-zinc-700 bg-zinc-900/50 text-zinc-100 px-3 py-2 text-sm"
      >
        {TYPE_LABELS[value] || value}
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
      </button>
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-zinc-700 bg-zinc-900 shadow-lg overflow-hidden">
          {['knowledge', 'session', 'pattern', 'project', 'template'].map(type => (
            <button
              key={type}
              type="button"
              onClick={() => { onValueChange(type); setOpen(false) }}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[type] }} />
              {TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Dialog ─────────────────────────────────────────────────

export function Dialog({ open, onOpenChange, children }: any) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div
        className="relative z-50 w-full max-w-md rounded-lg shadow-2xl p-6 mx-4"
        style={{
          background: "linear-gradient(135deg, #0f172a, #1e293b)",
          border: "1px solid #33415566",
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Toast ──────────────────────────────────────────────────

export function toast(message: { title: string; description?: string }) {
  alert(message.title + (message.description ? `\n${message.description}` : ''))
}
