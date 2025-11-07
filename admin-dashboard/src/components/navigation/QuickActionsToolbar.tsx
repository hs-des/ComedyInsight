import { useLocation, useNavigate } from 'react-router-dom'
import { getQuickActions } from '../../utils/quickActions'

export default function QuickActionsToolbar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const actions = getQuickActions(pathname).slice(0, 3)

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map((action) => {
        const Icon = action.icon
        const style = action.id === 'upload-video' ? 'btn-primary' : 'btn-secondary'
        return (
          <button key={action.id} className={style} onClick={() => action.to && navigate(action.to)}>
            <Icon size={14} />
            {action.label}
            {action.shortcut && <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-gray-400 sm:inline">{action.shortcut}</span>}
          </button>
        )
      })}
    </div>
  )
}

