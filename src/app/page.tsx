import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/glass-card'
import { ThemeToggle } from '@/components/ThemeToggle'
import {
  BookOpen,
  Headphones,
  Sparkles,
  Brain,
  FileText,
  Zap,
  Shield,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import { LandingHero, LandingFeatures, LandingStats } from '@/components/landing/LandingClient'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/documents')
  }

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-hidden">
      {/* Background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-500/20 rounded-full blur-3xl opacity-50" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl opacity-50" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/25">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-brand-500 to-brand-400 bg-clip-text text-transparent">
              FOM Hochschule
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Anmelden</Button>
            </Link>
            <Link href="/signup">
              <Button variant="premium">Kostenlos starten</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <LandingHero />

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-10">
              <Link href="/signup">
                <Button variant="premium" size="lg" className="text-lg px-8 gap-2 shadow-xl shadow-brand-500/25">
                  <Sparkles className="w-5 h-5" />
                  Kostenlos starten
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="glass" size="lg" className="text-lg px-8">
                  Anmelden
                </Button>
              </Link>
            </div>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 mt-10 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Kostenlos testen
              </span>
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-brand-400" />
                DSGVO-konform
              </span>
              <span className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                KI-gestützt
              </span>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 border-y border-border/50 bg-muted/30">
          <div className="container mx-auto px-4">
            <LandingStats />
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 md:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Alles was du zum Lernen brauchst
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Verwandle deine PDFs in interaktive Lernerlebnisse mit modernster Technologie.
              </p>
            </div>

            <LandingFeatures />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 md:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 via-brand-600/10 to-brand-500/10" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <GlassCard variant="elevated" className="max-w-3xl mx-auto p-12">
              <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/25">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Starte jetzt mit dem modernsten Lernbegleiter
              </h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Registriere dich kostenlos und erlebe, wie einfach Lernen sein kann.
              </p>
              <Link href="/signup">
                <Button variant="premium" size="lg" className="text-lg px-10 gap-2">
                  Jetzt registrieren
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </GlassCard>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                <BookOpen className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-semibold text-foreground">FOM Hochschule</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Die offizielle Lernplattform der FOM Hochschule
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground transition-colors">Impressum</Link>
              <Link href="#" className="hover:text-foreground transition-colors">Datenschutz</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
