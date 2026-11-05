/**
 * Simulated backend for bounty tasks.
 *
 * In a real app these functions would be `fetch()` calls against the
 * Superteam Earn / task API. They are kept async with a small delay so the
 * Redux thunks exercise real pending → fulfilled/rejected transitions,
 * and they expose a failure switch so the error path is testable.
 */

export type TaskPriority = 'low' | 'medium' | 'high'
export type TaskStatus = 'todo' | 'in-progress' | 'done'

export interface Task {
  id: string
  title: string
  sponsor: string
  rewardUsd: number
  priority: TaskPriority
  status: TaskStatus
  dueDate: string // ISO date
  notes: string
  createdAt: string // ISO timestamp
  updatedAt: string // ISO timestamp
}

export interface NewTaskInput {
  title: string
  sponsor: string
  rewardUsd: number
  priority: TaskPriority
  dueDate: string
  notes?: string
}

const SEED_TASKS: Task[] = [
  {
    id: 'task-001',
    title: 'Draft validator-ordering explainer outline',
    sponsor: 'Superteam Ukraine',
    rewardUsd: 2500,
    priority: 'high',
    status: 'in-progress',
    dueDate: '2026-11-05',
    notes: 'Mainnet measurements on 6 validators first, then the write-up.',
    createdAt: '2026-11-01T09:00:00Z',
    updatedAt: '2026-11-04T15:30:00Z',
  },
  {
    id: 'task-002',
    title: 'Design wallet onboarding flow frames',
    sponsor: 'Jupiter',
    rewardUsd: 1800,
    priority: 'medium',
    status: 'todo',
    dueDate: '2026-11-12',
    notes: 'Three steps, mobile + desktop. Aim: install to first swap < 2 min.',
    createdAt: '2026-11-02T10:15:00Z',
    updatedAt: '2026-11-02T10:15:00Z',
  },
  {
    id: 'task-003',
    title: 'Write compressed-NFT guide, section 1',
    sponsor: 'Metaplex',
    rewardUsd: 900,
    priority: 'low',
    status: 'todo',
    dueDate: '2026-11-20',
    notes: 'State compression + Merkle trees, with working code samples.',
    createdAt: '2026-11-03T08:40:00Z',
    updatedAt: '2026-11-03T08:40:00Z',
  },
  {
    id: 'task-004',
    title: 'Ship Blinks tipping action (final review)',
    sponsor: 'Dialect',
    rewardUsd: 2200,
    priority: 'high',
    status: 'done',
    dueDate: '2026-10-15',
    notes: 'USDC tips from any client that renders actions. Signed-tx preview done.',
    createdAt: '2026-10-05T11:00:00Z',
    updatedAt: '2026-10-14T17:20:00Z',
  },
  {
    id: 'task-005',
    title: 'Build referral-loop dashboard mock',
    sponsor: 'Sphere',
    rewardUsd: 1500,
    priority: 'medium',
    status: 'in-progress',
    dueDate: '2026-11-15',
    notes: 'Fraud-resistant invite codes, live cohort numbers.',
    createdAt: '2026-11-03T13:05:00Z',
    updatedAt: '2026-11-04T09:10:00Z',
  },
  {
    id: 'task-006',
    title: 'Record stake-weighted QoS explainer voiceover',
    sponsor: 'Jito',
    rewardUsd: 1200,
    priority: 'low',
    status: 'todo',
    dueDate: '2026-11-25',
    notes: '90-second video, aimed at devs who never ran a validator.',
    createdAt: '2026-11-04T07:50:00Z',
    updatedAt: '2026-11-04T07:50:00Z',
  },
]

/** In-memory "server" state. Reset between tests via `resetTaskApi()`. */
let serverTasks: Task[] = SEED_TASKS.map((t) => ({ ...t }))
let nextId = 100
let failNextCalls = 0
let delayMs = 30

export function resetTaskApi(): void {
  serverTasks = SEED_TASKS.map((t) => ({ ...t }))
  nextId = 100
  failNextCalls = 0
  delayMs = 30
}

/** Make the next `n` API calls fail with a network-style error. Test hook. */
export function failNextApiCalls(n: number): void {
  failNextCalls = n
}

export function setApiDelay(ms: number): void {
  delayMs = ms
}

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs))
}

function maybeFail(): void {
  if (failNextCalls > 0) {
    failNextCalls -= 1
    throw new Error('Network request failed: could not reach the task service')
  }
}

export async function apiFetchTasks(): Promise<Task[]> {
  await delay()
  maybeFail()
  return serverTasks.map((t) => ({ ...t }))
}

export async function apiCreateTask(input: NewTaskInput): Promise<Task> {
  await delay()
  maybeFail()
  const now = new Date().toISOString()
  const task: Task = {
    id: `task-${String(nextId).padStart(3, '0')}`,
    title: input.title.trim(),
    sponsor: input.sponsor.trim(),
    rewardUsd: input.rewardUsd,
    priority: input.priority,
    status: 'todo',
    dueDate: input.dueDate,
    notes: input.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now,
  }
  nextId += 1
  serverTasks.push(task)
  return { ...task }
}

export async function apiUpdateTask(
  id: string,
  patch: Partial<Pick<Task, 'title' | 'status' | 'priority' | 'dueDate' | 'notes'>>,
): Promise<Task> {
  await delay()
  maybeFail()
  const index = serverTasks.findIndex((t) => t.id === id)
  if (index === -1) throw new Error(`Task not found: ${id}`)
  serverTasks[index] = { ...serverTasks[index], ...patch, updatedAt: new Date().toISOString() }
  return { ...serverTasks[index] }
}

export async function apiDeleteTask(id: string): Promise<string> {
  await delay()
  maybeFail()
  const index = serverTasks.findIndex((t) => t.id === id)
  if (index === -1) throw new Error(`Task not found: ${id}`)
  serverTasks.splice(index, 1)
  return id
}
