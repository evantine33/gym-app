import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { generateJoinCode } from '../utils/gymUtils'

const AppContext = createContext(null)

// ─── Seed Data (Demo Gym) ─────────────────────────────────────────────────────
const SEED_GYM_ID = 'gym-seed'

const SEED_GYM = {
  id: SEED_GYM_ID,
  name: 'Demo Gym',
  joinCode: 'DEMO01',
  createdBy: 'coach-1',
  createdAt: '2024-01-01T00:00:00.000Z',
}

const SEED_USERS = [
  {
    id: 'coach-1',
    name: 'Coach Mike',
    email: 'coach@demo.com',
    phone: '555-000-0001',
    password: 'coach123',
    role: 'coach',
    gymId: SEED_GYM_ID,
    joinDate: '2024-01-01',
    initials: 'CM',
  },
  {
    id: 'member-1',
    name: 'Alex Rivera',
    email: 'alex@demo.com',
    phone: '555-100-0001',
    password: 'member123',
    role: 'member',
    gymId: SEED_GYM_ID,
    joinDate: '2024-02-10',
    initials: 'AR',
  },
  {
    id: 'member-2',
    name: 'Sarah Kim',
    email: 'sarah@demo.com',
    phone: '555-100-0002',
    password: 'member123',
    role: 'member',
    gymId: SEED_GYM_ID,
    joinDate: '2024-03-05',
    initials: 'SK',
  },
  {
    id: 'member-3',
    name: 'Jordan Hayes',
    email: 'jordan@demo.com',
    phone: '555-100-0003',
    password: 'member123',
    role: 'member',
    gymId: SEED_GYM_ID,
    joinDate: '2024-03-20',
    initials: 'JH',
  },
]

const getWeekDate = (offset = 0) => {
  const d = new Date()
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff + offset)
  return d.toISOString().split('T')[0]
}

const SEED_WORKOUTS = [
  {
    id: 'workout-1',
    title: 'Strength Block',
    date: getWeekDate(0),
    gymId: SEED_GYM_ID,
    createdBy: 'coach-1',
    createdAt: new Date().toISOString(),
    exercises: [
      { id: 'ex-1', name: 'Back Squat', sets: 5, reps: '5', targetWeight: '225 lbs', demoUrl: 'https://www.youtube.com/watch?v=ultWZbUMPL8', notes: 'Focus on depth — break parallel. Rest 3 min between sets.' },
      { id: 'ex-2', name: 'Romanian Deadlift', sets: 4, reps: '8', targetWeight: '185 lbs', demoUrl: 'https://www.youtube.com/watch?v=7j-2GmGMqQI', notes: 'Keep the bar close to your body. Slight knee bend.' },
      { id: 'ex-3', name: 'Bench Press', sets: 4, reps: '8', targetWeight: '155 lbs', demoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg', notes: 'Retract scapula before unracking. Control the descent.' },
      { id: 'ex-4', name: 'Pull-Ups', sets: 3, reps: '8-10', targetWeight: 'Bodyweight', demoUrl: 'https://www.youtube.com/watch?v=eGo4IYlbE5g', notes: 'Full range of motion — dead hang to chin over bar.' },
    ],
  },
  {
    id: 'workout-2',
    title: 'Conditioning',
    date: getWeekDate(2),
    gymId: SEED_GYM_ID,
    createdBy: 'coach-1',
    createdAt: new Date().toISOString(),
    exercises: [
      { id: 'ex-5', name: 'Overhead Press', sets: 4, reps: '6', targetWeight: '95 lbs', demoUrl: 'https://www.youtube.com/watch?v=2yjwXTZQDDI', notes: 'Brace your core. Drive the bar straight up.' },
      { id: 'ex-6', name: 'Barbell Row', sets: 4, reps: '8', targetWeight: '155 lbs', demoUrl: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ', notes: 'Keep your back flat. Pull to your lower chest.' },
    ],
  },
  {
    id: 'workout-3',
    title: 'Power Day',
    date: getWeekDate(4),
    gymId: SEED_GYM_ID,
    createdBy: 'coach-1',
    createdAt: new Date().toISOString(),
    exercises: [
      { id: 'ex-7', name: 'Deadlift', sets: 5, reps: '3', targetWeight: '275 lbs', demoUrl: 'https://www.youtube.com/watch?v=op9kVnSso6Q', notes: 'Drive the floor away. Keep lats tight off the floor.' },
      { id: 'ex-8', name: 'Box Jump', sets: 4, reps: '5', targetWeight: 'Bodyweight', demoUrl: '', notes: 'Full hip extension at the top. Step down, never jump down.' },
    ],
  },
]

const SEED_COMMUNITY = [
  {
    id: 'msg-1',
    gymId: SEED_GYM_ID,
    userId: 'coach-1',
    userName: 'Coach Mike',
    initials: 'CM',
    text: 'Welcome! Big week ahead — let\'s get after it 💪',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: 'msg-2',
    gymId: SEED_GYM_ID,
    userId: 'member-1',
    userName: 'Alex Rivera',
    initials: 'AR',
    text: 'Let\'s go! Hit a new PR on squats yesterday. Feeling strong this week.',
    timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'msg-3',
    gymId: SEED_GYM_ID,
    userId: 'member-2',
    userName: 'Sarah Kim',
    initials: 'SK',
    text: 'Same! Those RDLs are humbling me though 😅 Any tips on hip hinge?',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'msg-4',
    gymId: SEED_GYM_ID,
    userId: 'coach-1',
    userName: 'Coach Mike',
    initials: 'CM',
    text: 'Sarah — think about pushing your hips back to the wall behind you. I\'ll demo before class!',
    timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
  },
]

const SEED_LOGS = [
  {
    id: 'log-1',
    gymId: SEED_GYM_ID,
    userId: 'member-1',
    workoutId: 'workout-1',
    exerciseId: 'ex-1',
    exerciseName: 'Back Squat',
    sets: [
      { reps: '5', weight: '225' },
      { reps: '5', weight: '225' },
      { reps: '5', weight: '225' },
      { reps: '5', weight: '215' },
      { reps: '4', weight: '215' },
    ],
    notes: 'Felt solid. Last set was tough.',
    date: new Date().toISOString(),
  },
]

// ─── Initial State ────────────────────────────────────────────────────────────
const loadState = () => {
  try {
    const raw = localStorage.getItem('gymi_state')
    if (raw) return JSON.parse(raw)
  } catch {}
  return null
}

const getInitialState = () => {
  const saved = loadState()
  if (saved) return { gyms: [], programs: [], notifications: [], ...saved }
  return {
    currentUserId: null,
    gyms: [SEED_GYM],
    users: SEED_USERS,
    workouts: SEED_WORKOUTS,
    workoutLogs: SEED_LOGS,
    communityMessages: SEED_COMMUNITY,
    directMessages: [],
    programs: [],
    notifications: [],
  }
}

// ─── Reducer ──────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, currentUserId: action.userId }

    case 'LOGOUT':
      return { ...state, currentUserId: null }

    case 'REGISTER': {
      const validRoles = ['coach', 'member', 'nonmember']
      const role = validRoles.includes(action.user.role) ? action.user.role : 'member'
      const newUser = {
        ...action.user,
        id: role + '-' + Date.now(),
        role,
        gymId: null, // assigned after CREATE_GYM or JOIN_GYM
        joinDate: new Date().toISOString().split('T')[0],
        initials: action.user.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      }
      return { ...state, users: [...state.users, newUser] }
    }

    case 'CREATE_GYM': {
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      if (!currentUser) return state
      const newGym = {
        id: 'gym-' + Date.now(),
        name: action.name,
        joinCode: generateJoinCode(),
        createdBy: state.currentUserId,
        createdAt: new Date().toISOString(),
      }
      const updatedUsers = state.users.map(u =>
        u.id === state.currentUserId ? { ...u, gymId: newGym.id } : u
      )
      return { ...state, gyms: [...state.gyms, newGym], users: updatedUsers }
    }

    case 'JOIN_GYM': {
      const updatedUsers = state.users.map(u =>
        u.id === state.currentUserId ? { ...u, gymId: action.gymId } : u
      )
      return { ...state, users: updatedUsers }
    }

    case 'UPDATE_GYM': {
      return {
        ...state,
        gyms: state.gyms.map(g =>
          g.id === action.gymId ? { ...g, ...action.data } : g
        ),
      }
    }

    case 'UPDATE_PROFILE': {
      const updated = state.users.map(u =>
        u.id === action.userId ? { ...u, ...action.data } : u
      )
      return { ...state, users: updated }
    }

    case 'ADD_WORKOUT': {
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      const workout = {
        ...action.workout,
        id: 'workout-' + Date.now(),
        gymId: currentUser?.gymId || null,
        createdBy: state.currentUserId,
        createdAt: new Date().toISOString(),
      }
      const workoutNotif = {
        id: 'notif-' + Date.now(),
        gymId: currentUser?.gymId || null,
        type: 'new_workout',
        title: '🏋️ New Workout Posted',
        body: `${workout.title} is ready — ${new Date(workout.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`,
        createdAt: new Date().toISOString(),
        read: false,
        forRole: 'member',
        forUserId: null,
      }
      return {
        ...state,
        workouts: [workout, ...state.workouts],
        notifications: [...(state.notifications || []), workoutNotif],
      }
    }

    case 'DELETE_WORKOUT':
      return { ...state, workouts: state.workouts.filter(w => w.id !== action.workoutId) }

    case 'DUPLICATE_WORKOUT': {
      const orig = state.workouts.find(w => w.id === action.workoutId)
      if (!orig) return state
      const newDate = new Date(orig.date + 'T12:00:00')
      newDate.setDate(newDate.getDate() + 7)
      const duped = {
        ...orig,
        id: 'workout-' + Date.now(),
        date: newDate.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        exercises: orig.exercises.map(ex => ({ ...ex, id: 'ex-' + Math.random().toString(36).slice(2) })),
      }
      return { ...state, workouts: [...state.workouts, duped] }
    }

    // ── Programs ──────────────────────────────────────────────────────────────
    case 'ADD_PROGRAM': {
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      const program = {
        id: 'prog-' + Date.now(),
        name: action.name,
        description: action.description || '',
        totalWeeks: action.totalWeeks || 12,
        gymId: currentUser?.gymId || null,
        createdBy: state.currentUserId,
        createdAt: new Date().toISOString(),
        weeks: {},
      }
      return { ...state, programs: [...state.programs, program] }
    }

    case 'DELETE_PROGRAM':
      return { ...state, programs: state.programs.filter(p => p.id !== action.programId) }

    case 'UPDATE_PROGRAM':
      return {
        ...state,
        programs: state.programs.map(p =>
          p.id === action.programId ? { ...p, ...action.data } : p
        ),
      }

    case 'ADD_PROGRAM_WORKOUT': {
      const pw = {
        id: 'pw-' + Date.now(),
        day: action.day,
        title: action.title,
        exercises: action.exercises,
      }
      return {
        ...state,
        programs: state.programs.map(p => {
          if (p.id !== action.programId) return p
          const key = String(action.week)
          return { ...p, weeks: { ...p.weeks, [key]: [...(p.weeks[key] || []), pw] } }
        }),
      }
    }

    case 'DELETE_PROGRAM_WORKOUT':
      return {
        ...state,
        programs: state.programs.map(p => {
          if (p.id !== action.programId) return p
          const key = String(action.week)
          return { ...p, weeks: { ...p.weeks, [key]: (p.weeks[key] || []).filter(pw => pw.id !== action.pwId) } }
        }),
      }

    case 'UPDATE_PROGRAM_WORKOUT':
      return {
        ...state,
        programs: state.programs.map(p => {
          if (p.id !== action.programId) return p
          const key = String(action.week)
          return {
            ...p,
            weeks: {
              ...p.weeks,
              [key]: (p.weeks[key] || []).map(pw =>
                pw.id === action.pwId
                  ? { ...pw, title: action.title, exercises: action.exercises, warmup: action.warmup ?? pw.warmup }
                  : pw
              ),
            },
          }
        }),
      }

    case 'COPY_PROGRAM_WEEK': {
      const prog = state.programs.find(p => p.id === action.programId)
      if (!prog) return state
      const srcWorkouts = prog.weeks[String(action.fromWeek)] || []
      const copied = srcWorkouts.map(pw => ({ ...pw, id: 'pw-' + Math.random().toString(36).slice(2) }))
      const destKey = String(action.toWeek)
      return {
        ...state,
        programs: state.programs.map(p =>
          p.id === action.programId
            ? { ...p, weeks: { ...p.weeks, [destKey]: [...(p.weeks[destKey] || []), ...copied] } }
            : p
        ),
      }
    }

    case 'DEPLOY_PROGRAM': {
      const prog = state.programs.find(p => p.id === action.programId)
      if (!prog) return state
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      const DAY_OFFSETS = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }
      const start = new Date(action.startDate + 'T12:00:00')
      const newWorkouts = []
      for (let week = 1; week <= prog.totalWeeks; week++) {
        for (const pw of prog.weeks[String(week)] || []) {
          const d = new Date(start)
          d.setDate(start.getDate() + (week - 1) * 7 + (DAY_OFFSETS[pw.day] ?? 0))
          newWorkouts.push({
            id: 'workout-' + Date.now() + '-' + Math.random().toString(36).slice(2),
            title: pw.title,
            date: d.toISOString().split('T')[0],
            gymId: currentUser?.gymId || null,
            createdBy: state.currentUserId,
            createdAt: new Date().toISOString(),
            exercises: pw.exercises.map(ex => ({ ...ex, id: 'ex-' + Math.random().toString(36).slice(2) })),
            fromProgram: prog.id,
            weekNumber: week,
            assignedTo: action.assignTo || null,
          })
        }
      }
      const deployNotif = {
        id: 'notif-' + Date.now() + '-deploy',
        gymId: currentUser?.gymId || null,
        type: 'program_deployed',
        title: '📋 Program Scheduled',
        body: `${prog.name} — ${newWorkouts.length} workouts added to your schedule`,
        createdAt: new Date().toISOString(),
        read: false,
        forRole: 'member',
        forUserId: action.assignTo || null,
      }
      return {
        ...state,
        workouts: [...state.workouts, ...newWorkouts],
        notifications: [...(state.notifications || []), deployNotif],
      }
    }

    case 'LOG_EXERCISE': {
      const existing = state.workoutLogs.find(
        l => l.userId === state.currentUserId &&
             l.workoutId === action.log.workoutId &&
             l.exerciseId === action.log.exerciseId
      )
      if (existing) {
        return {
          ...state,
          workoutLogs: state.workoutLogs.map(l =>
            l.id === existing.id
              ? { ...l, sets: action.log.sets, notes: action.log.notes, exerciseName: action.log.exerciseName || l.exerciseName, date: new Date().toISOString() }
              : l
          ),
        }
      }
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      const newLog = {
        id: 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        gymId: currentUser?.gymId || null,
        userId: state.currentUserId,
        workoutId: action.log.workoutId,
        exerciseId: action.log.exerciseId,
        exerciseName: action.log.exerciseName || '',
        sets: action.log.sets,
        notes: action.log.notes,
        date: new Date().toISOString(),
      }
      return { ...state, workoutLogs: [...state.workoutLogs, newLog] }
    }

    case 'MARK_NOTIFS_READ': {
      return {
        ...state,
        notifications: (state.notifications || []).map(n =>
          n.gymId === action.gymId &&
          n.forRole === action.forRole &&
          (n.forUserId === null || n.forUserId === action.userId)
            ? { ...n, read: true }
            : n
        ),
      }
    }

    case 'SEND_COMMUNITY_MSG': {
      const user = state.users.find(u => u.id === state.currentUserId)
      const msg = {
        id: 'cmsg-' + Date.now(),
        gymId: user?.gymId || null,
        userId: state.currentUserId,
        userName: user.name,
        initials: user.initials,
        text: action.text,
        timestamp: new Date().toISOString(),
      }
      return { ...state, communityMessages: [...state.communityMessages, msg] }
    }

    case 'SEND_DM': {
      const dm = {
        id: 'dm-' + Date.now(),
        fromId: state.currentUserId,
        toId: action.toId,
        text: action.text,
        timestamp: new Date().toISOString(),
        read: false,
      }
      return { ...state, directMessages: [...state.directMessages, dm] }
    }

    case 'MARK_DMS_READ': {
      return {
        ...state,
        directMessages: state.directMessages.map(dm =>
          dm.toId === state.currentUserId && dm.fromId === action.fromId
            ? { ...dm, read: true }
            : dm
        ),
      }
    }

    default:
      return state
  }
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)

  useEffect(() => {
    try {
      localStorage.setItem('gymi_state', JSON.stringify(state))
    } catch {}
  }, [state])

  const currentUser = state.users.find(u => u.id === state.currentUserId) || null
  const currentGym = state.gyms.find(g => g.id === currentUser?.gymId) || null

  return (
    <AppContext.Provider value={{ state, dispatch, currentUser, currentGym }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
