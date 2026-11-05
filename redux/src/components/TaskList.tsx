import { useAppDispatch, useAppSelector } from '../app/hooks'
import { deleteTask, updateTaskStatus } from '../features/tasks/tasksSlice'
import { selectVisibleTasks } from '../features/tasks/tasksSelectors'
import type { Task, TaskStatus } from '../features/tasks/tasksApi'

const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'To do',
  'in-progress': 'In progress',
  done: 'Done',
}

const PRIORITY_STYLES: Record<Task['priority'], string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-amber-100 text-amber-800',
  low: 'bg-slate-200 text-slate-700',
}

function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount)
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(`${iso}T00:00:00`))
}

function TaskRow({ task }: { task: Task }) {
  const dispatch = useAppDispatch()
  const isSaving = useAppSelector((state) => state.tasks.savingIds.includes(task.id))
  const isOverdue = task.status !== 'done' && task.dueDate < new Date().toISOString().slice(0, 10)

  return (
    <li className="border-b border-slate-100 px-4 py-3 last:border-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-medium text-slate-900">
            {task.status === 'done' && <span aria-hidden="true">✓ </span>}
            {task.title}
            {isSaving && (
              <span className="ml-2 text-xs font-normal text-slate-500">(saving…)</span>
            )}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">
            {task.sponsor} · {formatUsd(task.rewardUsd)} · due {formatDate(task.dueDate)}
            {isOverdue && (
              <span className="ml-2 font-medium text-red-600">Overdue</span>
            )}
          </p>
          {task.notes && <p className="mt-1 text-sm text-slate-500">{task.notes}</p>}
          <p className="mt-1">
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[task.priority]}`}
            >
              {task.priority} priority
            </span>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <label htmlFor={`status-${task.id}`} className="sr-only">
            Status for {task.title}
          </label>
          <select
            id={`status-${task.id}`}
            value={task.status}
            disabled={isSaving}
            onChange={(e) =>
              void dispatch(
                updateTaskStatus({ id: task.id, status: e.target.value as TaskStatus }),
              )
            }
            className="rounded-md border border-slate-300 px-2 py-1.5 text-sm disabled:opacity-50"
          >
            {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </select>
          <button
            type="button"
            disabled={isSaving}
            onClick={() => void dispatch(deleteTask(task.id))}
            aria-label={`Delete ${task.title}`}
            className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      </div>
    </li>
  )
}

export function TaskList() {
  const tasks = useAppSelector(selectVisibleTasks)
  const loadStatus = useAppSelector((state) => state.tasks.loadStatus)

  if (loadStatus === 'loading') {
    return (
      <div
        role="status"
        className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm"
      >
        Loading tasks…
      </div>
    )
  }

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="font-medium text-slate-800">No tasks match your filters.</p>
        <p className="mt-1 text-sm text-slate-600">
          Try a different search term or clear the filters above.
        </p>
      </div>
    )
  }

  return (
    <ul
      aria-label="Bounty tasks"
      className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
    >
      {tasks.map((task) => (
        <TaskRow key={task.id} task={task} />
      ))}
    </ul>
  )
}
