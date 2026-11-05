import { useState, type FormEvent } from 'react'
import { useAppDispatch, useAppSelector } from '../app/hooks'
import { addTask } from '../features/tasks/tasksSlice'
import type { NewTaskInput, TaskPriority } from '../features/tasks/tasksApi'

const TODAY = new Date().toISOString().slice(0, 10)

/** Form for adding a bounty task. Validates client-side, then dispatches the
 *  async addTask thunk; server-side errors surface in the error banner. */
export function TaskForm() {
  const dispatch = useAppDispatch()
  const error = useAppSelector((state) => state.tasks.error)
  const [title, setTitle] = useState('')
  const [sponsor, setSponsor] = useState('')
  const [rewardUsd, setRewardUsd] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [justAdded, setJustAdded] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setJustAdded(false)
    if (title.trim().length < 3) {
      setFormError('Title needs at least 3 characters.')
      return
    }
    if (sponsor.trim().length < 2) {
      setFormError('Sponsor is required.')
      return
    }
    const reward = Number(rewardUsd)
    if (!Number.isFinite(reward) || reward <= 0) {
      setFormError('Reward must be a positive number of USD.')
      return
    }
    if (!dueDate) {
      setFormError('Due date is required.')
      return
    }
    const input: NewTaskInput = {
      title,
      sponsor,
      rewardUsd: reward,
      priority,
      dueDate,
      notes,
    }
    void dispatch(addTask(input)).then((result) => {
      if (addTask.fulfilled.match(result)) {
        setTitle('')
        setSponsor('')
        setRewardUsd('')
        setPriority('medium')
        setDueDate('')
        setNotes('')
        setJustAdded(true)
      }
    })
  }

  return (
    <section
      aria-labelledby="add-task-heading"
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h2 id="add-task-heading" className="text-lg font-semibold text-slate-900">
        Add a bounty task
      </h2>
      <form onSubmit={handleSubmit} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="new-title" className="block text-sm font-medium text-slate-700">
            Title *
          </label>
          <input
            id="new-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            placeholder="e.g. Draft the explainer outline"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="new-sponsor" className="block text-sm font-medium text-slate-700">
            Sponsor *
          </label>
          <input
            id="new-sponsor"
            type="text"
            value={sponsor}
            onChange={(e) => setSponsor(e.target.value)}
            required
            placeholder="e.g. Superteam Ukraine"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="new-reward" className="block text-sm font-medium text-slate-700">
            Reward (USD) *
          </label>
          <input
            id="new-reward"
            type="number"
            min={1}
            step={1}
            value={rewardUsd}
            onChange={(e) => setRewardUsd(e.target.value)}
            required
            placeholder="2500"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="new-priority" className="block text-sm font-medium text-slate-700">
            Priority
          </label>
          <select
            id="new-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <div>
          <label htmlFor="new-due" className="block text-sm font-medium text-slate-700">
            Due date *
          </label>
          <input
            id="new-due"
            type="date"
            min={TODAY}
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="new-notes" className="block text-sm font-medium text-slate-700">
            Notes
          </label>
          <input
            id="new-notes"
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional context"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="sm:col-span-2 lg:col-span-3">
          <button
            type="submit"
            className="rounded-md bg-solana-purple px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Add task
          </button>
          {formError && (
            <p role="alert" className="mt-2 text-sm font-medium text-red-700">
              {formError}
            </p>
          )}
          {justAdded && !formError && !error && (
            <p role="status" className="mt-2 text-sm font-medium text-emerald-700">
              Task added.
            </p>
          )}
        </div>
      </form>
    </section>
  )
}
