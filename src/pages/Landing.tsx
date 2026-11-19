import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowDown, ArrowRight, ArrowUpRight, BrainCircuit, CalendarDays, Check, CircleDollarSign, Command, GraduationCap, Sparkles, Target, Timer } from 'lucide-react'
import { Link } from 'react-router-dom'

const features = [
  { icon: GraduationCap, title: 'Feel on top of class', description: 'Bring your courses, assignments, and exam prep into one clear academic home.', color: 'violet' },
  { icon: Timer, title: 'Make space to focus', description: 'Build a rhythm that balances deep work, good habits, and a life outside class.', color: 'blue' },
  { icon: BrainCircuit, title: 'Think through your next step', description: 'Get thoughtful prompts and planning help from a coach that knows your priorities.', color: 'orange' },
  { icon: CircleDollarSign, title: 'Know where your money goes', description: 'Keep an eye on spending and make your student budget feel more manageable.', color: 'green' },
]

export function Landing() {
  const [previewDate] = useState(() => new Intl.DateTimeFormat('en', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date()).toUpperCase())

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
          <p>Your academics, productivity, finances and personal goals. Everything you need to stay organized, achieve more and build a better version of yourself.</p>
          <div className="hero-buttons"><Link to="/register" className="button button-primary hero-primary">Get started for free <ArrowRight size={16} /></Link><a className="button button-quiet" href="#features">Explore LifeOS <ArrowDown size={15} /></a></div>
          <div className="hero-social-proof"><div className="avatar-stack"><span>J</span><span>M</span><span>A</span><span>S</span></div><div><strong>Made for your kind of busy</strong><small>One workspace. A little more breathing room.</small></div></div>
        </motion.div>

        <motion.div className="hero-preview-wrap" initial={{ opacity: 0, y: 20, rotate: 1 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 0.7, delay: 0.14 }}>
          <div className="preview-orbit orbit-one" /><div className="preview-orbit orbit-two" />
          <div className="hero-preview">
            <div className="preview-sidebar"><span className="preview-logo"><Command size={13} /></span><span className="preview-side-active"><span /></span><span /><span /><span /><span /></div>
            <div className="preview-content">
              <div className="preview-top"><small>SAMPLE WORKSPACE · {previewDate}</small><span className="preview-avatar">AM</span></div>
              <div className="preview-greeting"><div><small>GOOD MORNING, ALEX</small><strong>Your week, in focus.</strong></div><span className="preview-week">This week <span>⌄</span></span></div>
              <div className="preview-stats">
                <div><small>Tasks completed</small><strong>12 <em>+3</em></strong><span>of 18 this week</span><div className="preview-progress"><i /></div></div>
                <div><small>Focus time</small><strong>14.5 <em>hrs</em></strong><span>You're on a roll</span><div className="preview-bars"><i /><i /><i /><i /><i /><i /><i /></div></div>
              </div>
              <div className="preview-bottom">
                <div className="preview-agenda"><small>UP NEXT <span>View all ↗</span></small><div><i className="agenda-violet" /><section><b>Design studio</b><span>10:30 AM · Lecture hall B</span></section></div><div><i className="agenda-blue" /><section><b>Work on research proposal</b><span>1:00 PM · Focus session</span></section></div></div>
                <div className="preview-score"><small>WEEKLY RHYTHM</small><div className="score-ring"><strong>78</strong><span>good pace</span></div></div>
              </div>
            </div>
          </div>
          <div className="floating-note"><span className="floating-check"><Check size={14} /></span><span><b>One thing at a time</b><small>You've got this.</small></span></div>
        </motion.div>
        <div className="hero-bottom-note"><span>Designed for real student life</span><span className="hero-note-line" /></div>
      </section>

      <section className="landing-trust"><span>ALL THE MOVING PARTS, IN ONE PLACE</span><div><i><GraduationCap size={16} /> Academics</i><i><CalendarDays size={16} /> Your time</i><i><Target size={16} /> Your goals</i><i><BrainCircuit size={16} /> Your next step</i></div></section>

      <section className="features-section" id="features">
        <div className="section-heading"><span className="section-kicker">LESS JUGGLING, MORE LIVING</span><h2>One place for the whole picture.</h2><p>University is more than deadlines. LifeOS helps you make room for all of it.</p></div>
        <div className="feature-grid">{features.map(({ icon: Icon, title, description, color }, index) => <motion.article key={title} className="feature-card" initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.3 }} transition={{ delay: index * 0.08 }}><span className={`feature-icon ${color}`}><Icon size={19} /></span><h3>{title}</h3><p>{description}</p><a href="#how-it-works">Explore <ArrowUpRight size={14} /></a></motion.article>)}</div>
      </section>

      <section className="how-section" id="how-it-works"><div className="how-copy"><span className="section-kicker">A BETTER KIND OF PRODUCTIVITY</span><h2>Progress that leaves room for you.</h2><p>LifeOS is designed to help you see what matters, make a plan that feels doable, and notice how far you’ve come.</p><div className="how-list"><div><span>01</span><p><b>Get everything out of your head</b><small>Bring the deadlines, plans, and ideas together.</small></p></div><div><span>02</span><p><b>Choose what matters today</b><small>Turn a busy week into a few clear next steps.</small></p></div><div><span>03</span><p><b>Build a rhythm that works for you</b><small>Make steady progress without running on empty.</small></p></div></div></div><div className="how-visual"><div className="how-glow" /><div className="quote-card"><span className="quote-mark">“</span><p>You don't have to do it all today. You just have to know what matters next.</p><div><span className="quote-avatar">L</span><span><b>Your LifeOS coach</b><small>Here when you need a reset</small></span></div><div className="quote-wave"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div></div></div></section>

      <section className="faq-section" id="faq"><div><span className="section-kicker">GOOD QUESTIONS</span><h2>Starting something new?</h2><p>Here's what students usually want to know.</p></div><div className="faq-items"><details><summary>What is LifeOS? <span>+</span></summary><p>A personal workspace that brings your academics, plans, and goals together so you can spend less time keeping track and more time moving forward.</p></details><details><summary>Is LifeOS only for academics? <span>+</span></summary><p>No. Your coursework matters, but so do your finances, habits, personal plans, and time to recharge.</p></details><details><summary>Can I try it before setting everything up? <span>+</span></summary><p>Yes. Start with the dashboard and explore the workspace. You can personalize it as you go.</p></details></div></section>

      <section className="final-cta"><div className="cta-glow" /><span className="section-kicker">YOUR NEXT CHAPTER STARTS HERE</span><h2>Make room for what matters.</h2><p>A little more clarity can change the whole week.</p><Link to="/register" className="button button-primary">Get started for free <ArrowRight size={16} /></Link><small>Free to start · Made for student life</small></section>
      <footer className="landing-footer"><Link to="/" className="brand-lockup"><span className="brand-mark"><Command size={15} /></span><span>life<span className="brand-light">os</span></span></Link><span>© LifeOS. Made for the journey.</span><a href="#features">Back to top ↑</a></footer>
    </div>
  )
}
