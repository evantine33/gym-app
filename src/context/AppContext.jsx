import React, { createContext, useContext, useReducer, useEffect, useRef, useState, useCallback } from 'react'
import { generateJoinCode } from '../utils/gymUtils'
import {
  supabase, isSupabaseEnabled,
  sbSignIn, sbSignUp, sbSignOut, sbGetSession,
  insertProfile, updateProfile, getProfile, getGymMembers,
  insertGym, getGymByCode, getGymById,
  insertWorkout, updateWorkout as sbUpdateWorkout, deleteWorkout as sbDeleteWorkout, getGymWorkouts,
  upsertWorkoutLog, getGymLogs,
  upsertHabitDef, deleteHabitDef, getUserHabitDefs, upsertHabitLog, deleteHabitLog, getUserHabitLogs,
  subscribeToGymWorkouts, subscribeToGymLogs,
} from '../lib/supabase'

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

// ─── Seed Program Listings ────────────────────────────────────────────────────
const mk = (id, reps, weight) => ({ id, reps, weight })
const ex = (id, name, sets, reps, weight, notes = '') => ({
  id, name, notes, demoUrl: '', groupId: null, groupType: null, groupDuration: null,
  sets: String(sets), reps: String(reps), targetWeight: String(weight),
  setsData: Array.from({ length: sets }, (_, i) => mk(`${id}-s${i}`, String(reps), String(weight))),
})

const SEED_LISTINGS = [
  {
    id: 'listing-1', coachId: 'coach-1', gymId: null, coachName: 'Coach Mike',
    title: '8-Week Strength Foundation',
    shortDesc: 'Build serious foundational strength with progressive overload. 3 days/week, big 3 compound lifts.',
    description: 'This 8-week program is designed for athletes ready to build real, lasting strength. Using squat, bench, and deadlift as the backbone with structured progressive overload, you\'ll add weight every week.\n\nPerfect for: beginners transitioning to intermediate, athletes coming off a break, or anyone looking to reset on a solid foundation.\n\nIncludes: Warm-up protocols, accessory work, coach notes, and weekly progression guidance.',
    price: 49, category: 'strength', level: 'beginner',
    durationWeeks: 8, daysPerWeek: 3, thumbnail: '🏋️', isPublished: true,
    weeks: [
      { weekNum: 1, workouts: [
        { id: 'lw-1-1', day: 'Monday', title: 'Lower Body — Squat Focus', exercises: [
          ex('le-1','Back Squat',3,5,135,'Drive through heels, chest tall'),
          ex('le-2','Romanian Deadlift',3,8,95,'Hinge at the hip, soft knees'),
          ex('le-3','Walking Lunge',3,10,0,'Bodyweight or light dumbbells'),
        ]},
        { id: 'lw-1-2', day: 'Wednesday', title: 'Upper Body — Press Focus', exercises: [
          ex('le-4','Bench Press',3,5,115,'Controlled descent, explode up'),
          ex('le-5','Overhead Press',3,8,65,'No lower-back arch'),
          ex('le-6','Dumbbell Row',3,10,50,'Pull elbow to pocket'),
        ]},
        { id: 'lw-1-3', day: 'Friday', title: 'Full Body — Deadlift Focus', exercises: [
          ex('le-7','Deadlift',3,5,185,'Bar stays close to legs the whole way'),
          ex('le-8','Pull Up',3,5,0,'Full hang to chin over bar'),
          ex('le-9','Dumbbell Curl',3,12,30,''),
        ]},
      ]},
      { weekNum: 2, workouts: [
        { id: 'lw-2-1', day: 'Monday', title: 'Lower Body — Squat Focus', exercises: [
          ex('le-10','Back Squat',3,5,140,'Add 5 lbs from last week'),
          ex('le-11','Romanian Deadlift',3,8,100,''),
          ex('le-12','Walking Lunge',3,12,0,''),
        ]},
        { id: 'lw-2-2', day: 'Wednesday', title: 'Upper Body — Press Focus', exercises: [
          ex('le-13','Bench Press',3,5,120,''),
          ex('le-14','Overhead Press',3,8,70,''),
          ex('le-15','Dumbbell Row',3,10,55,''),
        ]},
        { id: 'lw-2-3', day: 'Friday', title: 'Full Body — Deadlift Focus', exercises: [
          ex('le-16','Deadlift',3,5,195,''),
          ex('le-17','Pull Up',3,5,0,''),
          ex('le-18','Dumbbell Curl',3,12,32.5,''),
        ]},
      ]},
    ],
    createdAt: '2024-01-15T00:00:00.000Z',
  },
  {
    id: 'listing-2', coachId: 'coach-1', gymId: null, coachName: 'Coach Mike',
    title: '4-Week Shred Challenge',
    shortDesc: 'FREE! 4 weeks of high-intensity conditioning — torch fat, build endurance, feel incredible.',
    description: 'Free program — share it with anyone!\n\nThis 4-week challenge combines HIIT, conditioning circuits, and strength work to maximize fat loss while preserving muscle. Every week ramps up intensity.\n\nNo barbell required. Dumbbells and bodyweight only. Works at home or in the gym.',
    price: 0, category: 'conditioning', level: 'intermediate',
    durationWeeks: 4, daysPerWeek: 4, thumbnail: '🔥', isPublished: true,
    weeks: [
      { weekNum: 1, workouts: [
        { id: 'lw-3-1', day: 'Monday', title: 'Metabolic Circuit A', exercises: [
          ex('le-19','Burpee',4,15,0,'30s rest between rounds'),
          ex('le-20','Jump Squat',4,20,0,''),
          ex('le-21','Mountain Climber',4,30,0,'Count each leg as 1'),
        ]},
        { id: 'lw-3-2', day: 'Tuesday', title: 'Dumbbell Strength', exercises: [
          ex('le-22','Dumbbell Squat',3,15,40,''),
          ex('le-23','Dumbbell Press',3,12,35,''),
          ex('le-24','Dumbbell Row',3,12,40,''),
        ]},
      ]},
    ],
    createdAt: '2024-02-01T00:00:00.000Z',
  },
  {
    id: 'listing-3', coachId: 'coach-1', gymId: null, coachName: 'Coach Mike',
    title: '12-Week Muscle Builder',
    shortDesc: 'Hypertrophy-focused upper/lower split. 4 days/week. Designed to pack on size.',
    description: 'The most comprehensive muscle-building program in the store. 12 weeks, 4 days/week, upper/lower split built around proven hypertrophy principles.\n\nProgressive volume overload, strategic deload weeks at weeks 4, 8, and 12, and targeted accessory work to bring up every muscle group.\n\nIncludes: detailed exercise notes, warm-up protocols, and RPE targets.',
    price: 79, category: 'muscle', level: 'intermediate',
    durationWeeks: 12, daysPerWeek: 4, thumbnail: '💪', isPublished: true,
    weeks: [
      { weekNum: 1, workouts: [
        { id: 'lw-4-1', day: 'Monday', title: 'Upper A — Horizontal Push/Pull', exercises: [
          ex('le-25','Bench Press',4,8,135,'RPE 7 — leave some in the tank'),
          ex('le-26','Barbell Row',4,8,115,'Chest to pad, controlled lower'),
          ex('le-27','Incline Dumbbell Press',3,12,60,''),
          ex('le-28','Cable Row',3,12,0,''),
        ]},
        { id: 'lw-4-2', day: 'Tuesday', title: 'Lower A — Squat Focus', exercises: [
          ex('le-29','Back Squat',4,8,155,'RPE 7'),
          ex('le-30','Romanian Deadlift',3,10,135,''),
          ex('le-31','Leg Press',3,12,270,''),
          ex('le-32','Leg Curl',3,12,0,''),
        ]},
      ]},
    ],
    createdAt: '2024-03-10T00:00:00.000Z',
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
  if (saved) return { gyms: [], programs: [], notifications: [], benchmarkDefs: [], benchmarkEntries: [], habitDefs: [], habitLogs: [], journalEntries: [], programListings: [], purchases: [], ...saved }
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
    benchmarkDefs: [],
    benchmarkEntries: [],
    habitDefs: [],
    habitLogs: [],
    journalEntries: [],
    programListings: [],
    purchases: [],
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
      const validRoles = ['coach', 'staff', 'member', 'nonmember']
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

    // CREATE_GYM handled below in HYDRATE section with pre-generated IDs

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

    case 'UPDATE_WORKOUT':
      return {
        ...state,
        workouts: state.workouts.map(w =>
          w.id === action.workoutId
            ? { ...w, title: action.data.title, exercises: action.data.exercises, warmup: action.data.warmup ?? w.warmup }
            : w
        ),
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
      // If caller pre-built the workouts (so they can also save them to Supabase
      // with matching IDs), use those directly instead of generating new ones.
      let newWorkouts
      if (action.workouts && action.workouts.length > 0) {
        newWorkouts = action.workouts
      } else {
        const DAY_OFFSETS = { Monday: 0, Tuesday: 1, Wednesday: 2, Thursday: 3, Friday: 4, Saturday: 5, Sunday: 6 }
        const start = new Date(action.startDate + 'T12:00:00')
        newWorkouts = []
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

    case 'ADD_BENCHMARK_DEF': {
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      const def = {
        id: 'bdef-' + Date.now(),
        gymId: currentUser?.gymId || null,
        createdBy: state.currentUserId,
        name: action.def.name,
        description: action.def.description || '',
        type: action.def.type,
        unit: action.def.unit,
        higherIsBetter: action.def.higherIsBetter,
        scope: action.def.scope || 'gym',
        createdAt: new Date().toISOString(),
      }
      return { ...state, benchmarkDefs: [...(state.benchmarkDefs || []), def] }
    }

    case 'DELETE_BENCHMARK_DEF':
      return {
        ...state,
        benchmarkDefs: (state.benchmarkDefs || []).filter(d => d.id !== action.defId),
        benchmarkEntries: (state.benchmarkEntries || []).filter(e => e.benchmarkId !== action.defId),
      }

    case 'LOG_BENCHMARK': {
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      const entry = {
        id: 'bentry-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        gymId: currentUser?.gymId || null,
        userId: state.currentUserId,
        benchmarkId: action.entry.benchmarkId,
        value: action.entry.value,
        notes: action.entry.notes || '',
        date: action.entry.date,
        createdAt: new Date().toISOString(),
      }
      return { ...state, benchmarkEntries: [...(state.benchmarkEntries || []), entry] }
    }

    case 'DELETE_BENCHMARK_ENTRY':
      return {
        ...state,
        benchmarkEntries: (state.benchmarkEntries || []).filter(e => e.id !== action.entryId),
      }

    // ── Program Store ──────────────────────────────────────────────────────
    case 'ADD_PROGRAM_LISTING': {
      const listing = {
        ...action.listing,
        id: 'listing-' + Date.now(),
        coachId: state.currentUserId,
        coachName: state.users.find(u => u.id === state.currentUserId)?.name || 'Coach',
        createdAt: new Date().toISOString(),
      }
      return { ...state, programListings: [...(state.programListings || []), listing] }
    }

    case 'UPDATE_PROGRAM_LISTING':
      return {
        ...state,
        programListings: (state.programListings || []).map(l =>
          l.id === action.listingId ? { ...l, ...action.updates } : l
        ),
      }

    case 'DELETE_PROGRAM_LISTING':
      return {
        ...state,
        programListings: (state.programListings || []).filter(l => l.id !== action.listingId),
        purchases: (state.purchases || []).filter(p => p.listingId !== action.listingId),
      }

    case 'PURCHASE_LISTING': {
      // Prevent duplicate purchases
      const already = (state.purchases || []).some(
        p => p.listingId === action.listingId && p.buyerId === state.currentUserId
      )
      if (already) return state
      const purchase = {
        id: 'purchase-' + Date.now(),
        listingId: action.listingId,
        buyerId: state.currentUserId,
        pricePaid: action.price,
        purchasedAt: new Date().toISOString(),
      }
      return { ...state, purchases: [...(state.purchases || []), purchase] }
    }

    // ── Habits ─────────────────────────────────────────────────────────────
    case 'ADD_HABIT_DEF': {
      const def = {
        id: action.id || ('hdef-' + Date.now()),
        userId: state.currentUserId,
        name: action.name,
        description: action.description || '',
        emoji: action.emoji || '✅',
        createdAt: new Date().toISOString(),
      }
      return { ...state, habitDefs: [...(state.habitDefs || []), def] }
    }

    case 'DELETE_HABIT_DEF':
      return {
        ...state,
        habitDefs: (state.habitDefs || []).filter(d => d.id !== action.defId),
        habitLogs: (state.habitLogs || []).filter(l => l.habitId !== action.defId),
      }

    case 'TOGGLE_HABIT_LOG': {
      const existing = (state.habitLogs || []).find(
        l => l.habitId === action.habitId && l.userId === state.currentUserId && l.date === action.date
      )
      if (existing) {
        // Toggle completed
        return {
          ...state,
          habitLogs: state.habitLogs.map(l =>
            l.id === existing.id ? { ...l, completed: !l.completed } : l
          ),
        }
      }
      const entry = {
        id: 'hlog-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        habitId: action.habitId,
        userId: state.currentUserId,
        date: action.date,
        completed: true,
        createdAt: new Date().toISOString(),
      }
      return { ...state, habitLogs: [...(state.habitLogs || []), entry] }
    }

    // ── Journal ────────────────────────────────────────────────────────────
    case 'ADD_JOURNAL_ENTRY': {
      const entry = {
        id: 'jentry-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        userId: state.currentUserId,
        date: action.entry.date,
        title: action.entry.title || '',
        content: action.entry.content || '',
        mood: action.entry.mood || null,
        createdAt: new Date().toISOString(),
      }
      return { ...state, journalEntries: [...(state.journalEntries || []), entry] }
    }

    case 'UPDATE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: (state.journalEntries || []).map(e =>
          e.id === action.entryId
            ? { ...e, title: action.entry.title, content: action.entry.content, mood: action.entry.mood }
            : e
        ),
      }

    case 'DELETE_JOURNAL_ENTRY':
      return {
        ...state,
        journalEntries: (state.journalEntries || []).filter(e => e.id !== action.entryId),
      }

    // ── Supabase Hydration ────────────────────────────────────────────────
    case 'HYDRATE': {
      const p = action.profile
      const user = {
        id: p.id,
        name: p.name,
        email: p.email || '',
        phone: p.phone || '',
        role: p.role,
        gymId: p.gym_id || null,
        joinDate: p.join_date,
        initials: p.initials || p.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      }

      // Merge gym
      let gyms = [...state.gyms]
      if (action.gym) {
        const gym = { id: action.gym.id, name: action.gym.name, joinCode: action.gym.join_code, createdBy: action.gym.created_by, createdAt: action.gym.created_at }
        const idx = gyms.findIndex(g => g.id === gym.id)
        gyms = idx >= 0 ? gyms.map((g, i) => i === idx ? gym : g) : [...gyms, gym]
      }

      // Merge all gym members as users
      const remoteMembers = (action.members || []).map(m => ({
        id: m.id, name: m.name, email: m.email || '', phone: m.phone || '',
        role: m.role, gymId: m.gym_id, joinDate: m.join_date,
        initials: m.initials || m.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase(),
      }))
      let users = [...state.users]
      for (const m of [user, ...remoteMembers]) {
        const idx = users.findIndex(u => u.id === m.id)
        if (idx >= 0) users = users.map((u, i) => i === idx ? { ...u, ...m } : u)
        else users = [...users, m]
      }

      // Replace gym workouts
      const gymId = p.gym_id
      const remoteWorkouts = (action.workouts || []).map(w => ({
        id: w.id, title: w.title, date: w.date, gymId: w.gym_id,
        createdBy: w.created_by, exercises: w.exercises || [], warmup: w.warmup || [], createdAt: w.created_at,
        assignedTo: w.assigned_to || null,
        fromProgram: w.from_program || null,
        weekNumber: w.week_number || null,
      }))
      const workouts = gymId
        ? [...state.workouts.filter(w => w.gymId !== gymId), ...remoteWorkouts]
        : state.workouts

      // Replace gym logs
      const remoteLogs = (action.logs || []).map(l => ({
        id: l.id, userId: l.user_id, exerciseId: l.exercise_id, workoutId: l.workout_id,
        gymId: l.gym_id, exerciseName: l.exercise_name || '', sets: l.sets || [],
        notes: l.notes || '', date: l.logged_at, loggedAt: l.logged_at,
      }))
      const workoutLogs = gymId
        ? [...state.workoutLogs.filter(l => l.gymId !== gymId), ...remoteLogs]
        : state.workoutLogs

      // Merge this user's habits (keep local habits for other users untouched)
      const remoteHabitDefs = (action.habitDefs || []).map(d => ({
        id: d.id, userId: d.user_id, gymId: d.gym_id || null,
        name: d.name, description: d.description || '', emoji: d.emoji || '✅',
        createdAt: d.created_at,
      }))
      const habitDefs = [
        ...(state.habitDefs || []).filter(d => d.userId !== p.id),
        ...remoteHabitDefs,
      ]

      const remoteHabitLogs = (action.habitLogs || []).map(l => ({
        id: l.id, habitId: l.habit_id, userId: l.user_id, gymId: l.gym_id || null,
        date: l.date, completed: l.completed, createdAt: l.created_at,
      }))
      const habitLogs = [
        ...(state.habitLogs || []).filter(l => l.userId !== p.id),
        ...remoteHabitLogs,
      ]

      return { ...state, users, gyms, workouts, workoutLogs, habitDefs, habitLogs, currentUserId: p.id }
    }

    case 'HYDRATE_USER': {
      const u = action.user
      const idx = state.users.findIndex(x => x.id === u.id)
      const users = idx >= 0 ? state.users.map((x, i) => i === idx ? { ...x, ...u } : x) : [...state.users, u]
      return { ...state, users }
    }

    // Allow reducer to use pre-generated gym id / join code from enhanced dispatch
    case 'CREATE_GYM': {
      const currentUser = state.users.find(u => u.id === state.currentUserId)
      if (!currentUser) return state
      const newGym = {
        id: action.gymId || 'gym-' + Date.now(),
        name: action.name,
        joinCode: action.joinCode || generateJoinCode(),
        createdBy: state.currentUserId,
        createdAt: new Date().toISOString(),
      }
      const updatedUsers = state.users.map(u => u.id === state.currentUserId ? { ...u, gymId: newGym.id } : u)
      return { ...state, gyms: [...state.gyms, newGym], users: updatedUsers }
    }

    default:
      return state
  }
}

// ─── Hydrate from Supabase ────────────────────────────────────────────────────
async function hydrateFromSupabase(userId, dispatch) {
  const { data: profile, error } = await getProfile(userId)
  if (error || !profile) return

  let gym = null, workouts = [], logs = [], members = []
  if (profile.gym_id) {
    const [gymRes, workoutsRes, logsRes, membersRes] = await Promise.all([
      getGymById(profile.gym_id),
      getGymWorkouts(profile.gym_id),
      getGymLogs(profile.gym_id),
      getGymMembers(profile.gym_id),
    ])
    gym = gymRes.data
    workouts = workoutsRes.data || []
    logs = logsRes.data || []
    members = membersRes.data || []
  }

  // Fetch this user's habits and habit logs (personal, not gym-scoped)
  const [habitDefsRes, habitLogsRes] = await Promise.all([
    getUserHabitDefs(userId),
    getUserHabitLogs(userId),
  ])
  const habitDefs = habitDefsRes.data || []
  const habitLogs = habitLogsRes.data || []

  dispatch({ type: 'HYDRATE', profile, gym, workouts, logs, members, habitDefs, habitLogs })
}

// ─── Provider ─────────────────────────────────────────────────────────────────
export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, getInitialState)
  const [authReady, setAuthReady] = useState(!isSupabaseEnabled) // if no Supabase, skip wait
  const [authLoading, setAuthLoading] = useState(false)
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  // Persist to localStorage
  useEffect(() => {
    try { localStorage.setItem('gymi_state', JSON.stringify(state)) } catch {}
  }, [state])

  // Supabase auth listener — runs once on mount
  useEffect(() => {
    if (!isSupabaseEnabled) return

    // Check for existing session (e.g. returning user)
    sbGetSession().then(async ({ data: { session } }) => {
      if (session) {
        await hydrateFromSupabase(session.user.id, dispatch)
      }
      setAuthReady(true)
    })

    // Listen for auth state changes (sign in / sign out from other tabs)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') dispatch({ type: 'LOGOUT' })
    })
    return () => subscription.unsubscribe()
  }, [])

  // Realtime subscriptions for the current user's gym
  useEffect(() => {
    if (!isSupabaseEnabled) return
    const gymId = stateRef.current.users.find(u => u.id === stateRef.current.currentUserId)?.gymId
    if (!gymId) return

    const wSub = subscribeToGymWorkouts(gymId, () => {
      hydrateFromSupabase(stateRef.current.currentUserId, dispatch)
    })
    const lSub = subscribeToGymLogs(gymId, () => {
      hydrateFromSupabase(stateRef.current.currentUserId, dispatch)
    })
    return () => { wSub.unsubscribe(); lSub.unsubscribe() }
  }, [state.currentUserId])

  // ── Enhanced dispatch: local state + Supabase sync ─────────────────────────
  const enhancedDispatch = useCallback(async (action) => {
    // Pre-generate IDs so both reducer and Supabase get the same value
    let a = action
    if (a.type === 'ADD_WORKOUT' && !a.workout?.id) {
      a = { ...a, workout: { ...a.workout, id: 'workout-' + Date.now() } }
    }
    if (a.type === 'CREATE_GYM' && !a.gymId) {
      a = { ...a, gymId: 'gym-' + Date.now(), joinCode: generateJoinCode() }
    }
    // Pre-generate habit def ID so reducer and Supabase use the same one
    if (a.type === 'ADD_HABIT_DEF' && !a.id) {
      a = { ...a, id: 'hdef-' + Date.now() }
    }

    dispatch(a) // immediate local update

    if (!isSupabaseEnabled) return

    const s = stateRef.current
    const me = s.users.find(u => u.id === s.currentUserId)

    try {
      switch (a.type) {
        case 'ADD_WORKOUT':
          await insertWorkout({ ...a.workout, gymId: me?.gymId, createdBy: s.currentUserId })
          break
        case 'UPDATE_WORKOUT':
          await sbUpdateWorkout(a.workoutId, a.data)
          break
        case 'DELETE_WORKOUT':
          await sbDeleteWorkout(a.workoutId)
          break
        case 'LOG_EXERCISE': {
          const logId = 'log-' + Date.now() + '-' + Math.random().toString(36).slice(2)
          await upsertWorkoutLog({ id: logId, userId: s.currentUserId, gymId: me?.gymId, ...a.log })
          break
        }
        case 'CREATE_GYM':
          await insertGym({ id: a.gymId, name: a.name, join_code: a.joinCode, created_by: s.currentUserId })
          await updateProfile(s.currentUserId, { gym_id: a.gymId })
          break
        case 'JOIN_GYM':
          await updateProfile(s.currentUserId, { gym_id: a.gymId })
          break
        case 'UPDATE_PROFILE':
          await updateProfile(a.userId, {
            name: a.data.name, phone: a.data.phone,
          })
          break
        case 'ADD_HABIT_DEF':
          // Use pre-generated ID from action (set above before dispatch)
          await upsertHabitDef({
            id: a.id,
            userId: s.currentUserId,
            name: a.name,
            description: a.description || '',
            emoji: a.emoji || '✅',
          })
          break
        case 'DELETE_HABIT_DEF':
          await deleteHabitDef(a.defId)
          // Also delete all logs for this habit
          await deleteHabitLog(a.defId, s.currentUserId)
          break
        case 'TOGGLE_HABIT_LOG': {
          // Use pre-dispatch state (s = stateRef.current captured before dispatch)
          // to correctly compute the new completed value without a race condition
          const existing = (s.habitLogs || []).find(
            l => l.habitId === a.habitId && l.userId === s.currentUserId && l.date === a.date
          )
          if (existing) {
            await upsertHabitLog({
              id: existing.id,
              habitId: existing.habitId,
              userId: existing.userId,
              date: existing.date,
              completed: !existing.completed,
            })
          } else {
            await upsertHabitLog({
              id: 'hlog-' + Date.now() + '-' + Math.random().toString(36).slice(2),
              habitId: a.habitId,
              userId: s.currentUserId,
              date: a.date,
              completed: true,
            })
          }
          break
        }
      }
    } catch (err) {
      console.error('Supabase sync error:', err)
    }
  }, [])

  // ── Auth functions ─────────────────────────────────────────────────────────
  const login = useCallback(async (email, password) => {
    if (!isSupabaseEnabled) {
      const user = stateRef.current.users.find(
        u => u.email?.toLowerCase() === email.toLowerCase() && u.password === password
      )
      if (!user) throw new Error('Invalid email or password')
      dispatch({ type: 'LOGIN', userId: user.id })
      return user
    }
    setAuthLoading(true)
    try {
      const { data, error } = await sbSignIn(email, password)
      if (error) throw error
      await hydrateFromSupabase(data.user.id, dispatch)
      // Fallback: if profile row was missing, ensure user still gets logged in
      if (!stateRef.current.users.find(u => u.id === data.user.id)) {
        const fallbackName = data.user.email.split('@')[0]
        dispatch({ type: 'HYDRATE_USER', user: {
          id: data.user.id,
          name: fallbackName,
          email: data.user.email,
          phone: '',
          role: 'member',
          initials: fallbackName.slice(0, 2).toUpperCase(),
          gymId: null,
          joinDate: new Date().toISOString().split('T')[0],
        }})
      }
      dispatch({ type: 'LOGIN', userId: data.user.id })
      return data.user
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const register = useCallback(async (userData) => {
    if (!isSupabaseEnabled) {
      dispatch({ type: 'REGISTER', user: userData })
      return null
    }
    setAuthLoading(true)
    try {
      const { data, error } = await sbSignUp(userData.email, userData.password)
      if (error) throw error
      const initials = userData.name.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
      const { error: pErr } = await insertProfile({
        id: data.user.id,
        name: userData.name,
        phone: userData.phone || '',
        role: userData.role || 'member',
        initials,
      })
      if (pErr) throw pErr
      dispatch({ type: 'HYDRATE_USER', user: {
        id: data.user.id, name: userData.name, email: userData.email,
        phone: userData.phone || '', role: userData.role || 'member',
        initials, gymId: null, joinDate: new Date().toISOString().split('T')[0],
      }})
      dispatch({ type: 'LOGIN', userId: data.user.id })
      return data.user
    } finally {
      setAuthLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    if (isSupabaseEnabled) await sbSignOut()
    dispatch({ type: 'LOGOUT' })
  }, [])

  // ── Join gym (Supabase-aware) ───────────────────────────────────────────────
  const joinGym = useCallback(async (code) => {
    if (!isSupabaseEnabled) {
      const gym = stateRef.current.gyms.find(g => g.joinCode === code.trim().toUpperCase())
      if (!gym) throw new Error("That code doesn't match any gym.")
      dispatch({ type: 'JOIN_GYM', gymId: gym.id })
      return gym
    }
    const { data: gym, error } = await getGymByCode(code.trim())
    if (error || !gym) throw new Error("That code doesn't match any gym. Check with your coach and try again.")
    // Add gym to local state and join
    const localGym = { id: gym.id, name: gym.name, joinCode: gym.join_code, createdBy: gym.created_by, createdAt: gym.created_at }
    dispatch({ type: 'HYDRATE', profile: { ...stateRef.current.users.find(u => u.id === stateRef.current.currentUserId), gym_id: gym.id }, gym: localGym, workouts: [], logs: [], members: [] })
    await updateProfile(stateRef.current.currentUserId, { gym_id: gym.id })
    // Now hydrate full gym data
    await hydrateFromSupabase(stateRef.current.currentUserId, dispatch)
    return gym
  }, [])

  const currentUser = state.users.find(u => u.id === state.currentUserId) || null
  const currentGym = state.gyms.find(g => g.id === currentUser?.gymId) || null

  return (
    <AppContext.Provider value={{
      state,
      dispatch: enhancedDispatch,
      currentUser,
      currentGym,
      authReady,
      authLoading,
      login,
      register,
      logout,
      joinGym,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
