import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, CircleDollarSign, ClipboardCheck, Command, FileText, GraduationCap, Sparkles, Target, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  { icon: GraduationCap, title: 'Organize your academics', description: 'Enter courses, assignments, exams, and the grades you receive.', color: 'violet' },
  { icon: Timer, title: 'Build your own routine', description: 'Record focus sessions and check in on the habits you choose.', color: 'blue' },
  { icon: ClipboardCheck, title: 'Plan and reflect', description: 'Manage your tasks and keep private weekly reviews in your workspace.', color: 'orange' },
  { icon: CircleDollarSign, title: 'Track money manually', description: 'Record transactions, budgets, and savings goals. No bank connection is required.', color: 'green' },
]

export function Landing() {
  return (
    <div className="landing-page">
      <header className="landing-nav">
        <Link to="/" className="brand-lockup"><span className="brand-mark"><Command size={17} strokeWidth={2.6} /></span><span>life<span className="brand-light">os</span></span></Link>
        <nav className="landing-links" aria-label="Landing page navigation">
          <a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#faq">FAQs</a>
        </nav>
        <div className="landing-actions"><Link to="/login" className="landing-login">Log in</Link><Link to="/register" className="button button-primary landing-cta">Get started <ArrowRight size={15} /></Link></div>
      </header>

      <section className="landing-hero">
        <div className="hero-glow" />
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55 }}>
          <div className="eyebrow"><span className="eyebrow-dot" /> A calmer way to do university <Sparkles size={13} /></div>
          <h1>Take control of<br />your university <span>life.</span></h1>
          <p>Keep your tasks, schedule, coursework, habits, notes, goals, and manually entered finances together in one private workspace.</p>
          <div className="hero-buttons"><Link to="/register" className="button button-primary hero-primary">Get started for free <ArrowRight size={16} /></Link><a className="button button-quiet" href="#features">Explore LifeOS <ArrowDown size={15} /></a></div>
          <div className="hero-social-proof"><span className="feature-icon violet"><Check size={17} /></span><div><strong>Your own workspace</strong><small>Your records are private to your account.</small></div></div>
        </motion.div>

        <motion.div className="hero-preview-wrap" initial={{ opacity: 0, y: 20, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.7, delay: 0.14 }}>
          <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
          <div className="hero-preview">
            <div className="preview-content hero-product-content">
              <div className="preview-top"><small>YOUR LIFEOS WORKSPACE</small><span className="preview-avatar"><Command size={16} /></span></div>
              <div className="preview-greeting"><div><small>ONE PLACE FOR YOUR PLANS</small><strong>Make it yours.</strong></div></div>
              <div className="hero-tool-list">
                <div><span className="feature-icon violet"><Check size={16} /></span><section><b>Plan</b><small>Tasks and calendar</small></section><ArrowUpRight size={14} /></div>
                <div><span className="feature-icon blue"><GraduationCap size={16} /></span><section><b>Study</b><small>Courses, exams, and grades</small></section><ArrowUpRight size={14} /></div>
                <div><span className="feature-icon orange"><Target size={16} /></span><section><b>Grow</b><small>Habits and personal goals</small></section><ArrowUpRight size={14} /></div>
                <div><span className="feature-icon green"><FileText size={16} /></span><section><b>Keep track</b><small>Notes and finances you enter</small></section><ArrowUpRight size={14} /></div>
              </div>
            </div>
          </div>
          <div className="floating-note"><span className="floating-check"><Check size={14} /></span><span><b>Private by account</b><small>You control what you add.</small></span></div>
        </motion.div>
        <div className="hero-bottom-note"><span>Designed for real student life</span><span className="hero-note-line" /></div>
      </section>

      <section className="landing-trust"><span>YOUR WORKSPACE, YOUR RECORDS</span><div><i><GraduationCap size={16} /> Academics</i><i><CalendarDays size={16} /> Calendar</i><i><Target size={16} /> Goals</i><i><FileText size={16} /> Notes</i></div></section>

      <section className="features-section" id="features">
        <div className="section-heading"><span className="section-kicker">LESS JUGGLING, MORE LIVING</span><h2>One place for the whole picture.</h2><p>University is more than deadlines. LifeOS helps you make room for all of it.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, description, color }, index) => <motion.article key={title} className="feature-card" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08 }}><span className={`feature-icon ${color}`}><Icon size={19} /></span><h3>{title}</h3><p>{description}</p><a href="#how-it-works">Explore <ArrowUpRight size={14} /></a></motion.article>)}</div>
      </section>

      <section className="how-section" id="how-it-works"><div className="how-copy"><span className="section-kicker">A BETTER KIND OF PRODUCTIVITY</span><h2>Progress that leaves room for you.</h2><p>Keep your records together, choose what matters today, and review the progress you have actually made.</p><div className="how-list"><div><span>01</span><p><b>Add your own records</b><small>Enter tasks, events, coursework, and notes.</small></p></div><div><span>02</span><p><b>Choose what matters today</b><small>Use your saved planner and calendar.</small></p></div><div><span>03</span><p><b>Review your own activity</b><small>Analytics come from the data in your account.</small></p></div></div></div><div className="how-visual"><div className="how-glow" /><div className="quote-card"><span className="quote-mark">“</span><p>Your workspace reflects the information you choose to add.</p><div><span className="quote-avatar"><Command size={16} /></span><span><b>Your private workspace</b><small>No sample activity or bank sync</small></span></div><div className="quote-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div></div></section>

      <section className="faq-section" id="faq"><div><span className="section-kicker">GOOD QUESTIONS</span><h2>Starting something new?</h2><p>Here's what to know about this version of LifeOS.</p></div><div className="faq-items"><details><summary>Where is my information stored? <span>+</span></summary><p>Your records are stored in Supabase and protected by account-level access policies.</p></details><details><summary>Does LifeOS connect to banks or Google Calendar? <span>+</span></summary><p>No. This standalone version uses information you enter yourself; it does not connect to external accounts.</p></details><details><summary>Does the weekly review use AI? <span>+</span></summary><p>No. It is a private journal saved with your notes. It does not generate AI responses.</p></details></div></section>

      <section className="final-cta"><div className="cta-glow" /><span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span><h2>Make room for what matters.</h2><p>A little more clarity can change the whole week.</p><Link to="/register" className="button button-primary">Get started for free <ArrowRight size={16} /></Link><small>Free to start · Made for student life</small></section>
      <footer className="landing-footer"><Link to="/" className="brand-lockup"><span className="brand-mark"><Command size={15} /></span><span>life<span className="brand-light">os</span></span></Link><span>© LifeOS. Made for the journey.</span><a href="#features">Back to top ↑</a></footer>
    </div>
  )
}
