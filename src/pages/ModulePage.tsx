import { ArrowRight, Sparkles } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { pageDescriptions } from '../data/demo'

export function ModulePage() {
  const { pathname } = useLocation()
  const page = pageDescriptions[pathname] ?? pageDescriptions['/planner']
  const Icon = page.icon

  return (
    <div className="module-page page-content">
      <div className="module-heading"><span className="module-icon"><Icon size={21} /></span><span className="section-kicker">YOUR WORKSPACE</span><h1>{page.title}</h1><p>{page.description}</p></div>
      <div className="module-empty panel"><span className="empty-sparkle"><Sparkles size={20} /></span><h2>A little more room to grow.</h2><p>This area is part of the LifeOS workspace foundation. It will become interactive as each feature is built in the next development phases.</p><Link to="/dashboard" className="button button-primary">Back to your dashboard <ArrowRight size={15} /></Link></div>
    </div>
  )
}
