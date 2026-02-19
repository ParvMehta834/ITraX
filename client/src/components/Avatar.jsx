import React from 'react'

const COLORS = [
  'bg-blue-500',      // 0
  'bg-indigo-500',    // 1
  'bg-purple-500',    // 2
  'bg-emerald-500',   // 3
  'bg-pink-500',      // 4
  'bg-cyan-500',      // 5
  'bg-orange-500',    // 6
]

// Generate consistent color based on name
const getColorFromName = (name) => {
  if (!name) return COLORS[0]
  
  const hash = name.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)
  
  return COLORS[hash % COLORS.length]
}

// Extract initials from name
const getInitials = (name) => {
  if (!name) return '?'
  
  const parts = name.trim().split(/\s+/)
  
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase()
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Size configurations
const SIZE_CONFIG = {
  small: {
    container: 'w-8 h-8',
    text: 'text-xs',
  },
  medium: {
    container: 'w-10 h-10',
    text: 'text-sm',
  },
  large: {
    container: 'w-12 h-12',
    text: 'text-base',
  },
}

export default function Avatar({ name = 'User', size = 'medium' }) {
  const initials = getInitials(name)
  const colorClass = getColorFromName(name)
  const sizeConfig = SIZE_CONFIG[size] || SIZE_CONFIG.medium

  return (
    <div
      className={`
        ${sizeConfig.container}
        ${colorClass}
        ${sizeConfig.text}
        flex items-center justify-center
        rounded-full
        text-white
        font-semibold
        shadow-lg
        transition-all duration-300
        hover:scale-105
        hover:shadow-xl
        cursor-pointer
        relative
      `}
      title={name}
    >
      {initials}
      {/* Glow effect on hover */}
      <div
        className={`
          absolute inset-0 rounded-full
          bg-current opacity-0
          blur-lg
          transition-opacity duration-300
          group-hover:opacity-20
          -z-10
        `}
      />
    </div>
  )
}
