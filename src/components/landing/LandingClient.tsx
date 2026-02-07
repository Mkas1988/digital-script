'use client'

import { motion } from 'framer-motion'
import {
  FileText,
  Headphones,
  Sparkles,
  Brain,
  Image as ImageIcon,
  BarChart3,
  Users,
  Clock,
  BookOpen,
} from 'lucide-react'
import { GlassCard } from '@/components/ui/glass-card'
import { fadeInUp, staggerContainer, staggerItem } from '@/lib/animations'

export function LandingHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-center max-w-4xl mx-auto"
    >
      {/* Badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6"
      >
        <Sparkles className="w-4 h-4" />
        FOM Hochschule für Oekonomie & Management
      </motion.div>

      <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight">
        <span className="text-foreground">Dein interaktiver</span>
        <br />
        <span className="bg-gradient-to-r from-brand-500 via-brand-400 to-brand-600 bg-clip-text text-transparent">
          Lernbegleiter
        </span>
      </h1>

      <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        Lade deine Skripte als PDF hoch und erlebe Lernen auf einem neuen Level.
        Mit KI-gestützter Strukturierung, Text-to-Speech und intelligenten Lernkarten.
      </p>
    </motion.div>
  )
}

export function LandingStats() {
  const stats = [
    { icon: Users, value: '10.000+', label: 'Aktive Nutzer' },
    { icon: BookOpen, value: '50.000+', label: 'Verarbeitete PDFs' },
    { icon: Clock, value: '2 Mio.', label: 'Lernstunden' },
    { icon: BarChart3, value: '94%', label: 'Erfolgsquote' },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-100px' }}
      className="grid grid-cols-2 md:grid-cols-4 gap-8"
    >
      {stats.map((stat, index) => (
        <motion.div
          key={stat.label}
          variants={staggerItem}
          className="text-center"
        >
          <div className="flex justify-center mb-3">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <stat.icon className="w-6 h-6 text-brand-400" />
            </div>
          </div>
          <div className="text-3xl font-bold text-foreground mb-1">{stat.value}</div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </motion.div>
      ))}
    </motion.div>
  )
}

export function LandingFeatures() {
  const features = [
    {
      icon: FileText,
      title: 'PDF zu Webseite',
      description: 'Deine PDFs werden automatisch in gut lesbare, navigierbare Kapitel umgewandelt.',
      gradient: 'from-blue-500 to-cyan-500',
    },
    {
      icon: Sparkles,
      title: 'KI-Strukturierung',
      description: 'Intelligente Erkennung von Kapiteln, Abschnitten und Zusammenfassungen durch KI.',
      gradient: 'from-brand-500 to-brand-600',
    },
    {
      icon: Headphones,
      title: 'Text-to-Speech',
      description: 'Lass dir deine Skripte vorlesen - perfekt für unterwegs oder zur Wiederholung.',
      gradient: 'from-green-500 to-emerald-500',
    },
    {
      icon: Brain,
      title: 'KI-Lernkarten',
      description: 'Erstelle Lernkarten automatisch mit KI aus deinem Skript-Inhalt.',
      gradient: 'from-purple-500 to-pink-500',
    },
    {
      icon: ImageIcon,
      title: 'Bilder & Grafiken',
      description: 'Alle Bilder und Grafiken werden extrahiert und übersichtlich dargestellt.',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      icon: BarChart3,
      title: 'Fortschritts-Tracking',
      description: 'Behalte deinen Lernfortschritt im Blick mit detaillierten Statistiken.',
      gradient: 'from-teal-500 to-cyan-500',
    },
  ]

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      whileInView="animate"
      viewport={{ once: true, margin: '-100px' }}
      className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {features.map((feature, index) => (
        <motion.div key={feature.title} variants={staggerItem}>
          <GlassCard
            variant="interactive"
            className="h-full p-6 group"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
              <feature.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold mb-2 text-foreground group-hover:text-brand-400 transition-colors">
              {feature.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </GlassCard>
        </motion.div>
      ))}
    </motion.div>
  )
}
