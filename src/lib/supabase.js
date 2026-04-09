import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// If env vars are not set, the app falls back to localStorage (demo mode)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

export const isSupabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey)

// ─── Auth ──────────────────────────────────────────────────────────────────────
export async function sbSignUp(email, password) {
  return supabase.auth.signUp({ email, password })
}

export async function sbSignIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password })
}

export async function sbSignOut() {
  return supabase.auth.signOut()
}

export async function sbGetSession() {
  return supabase.auth.getSession()
}

// ─── Profiles ─────────────────────────────────────────────────────────────────
export async function insertProfile(profile) {
  return supabase.from('profiles').insert(profile)
}

export async function updateProfile(id, data) {
  return supabase.from('profiles').update(data).eq('id', id)
}

export async function getProfile(id) {
  return supabase.from('profiles').select('*').eq('id', id).single()
}

export async function getGymMembers(gymId) {
  return supabase.from('profiles').select('*').eq('gym_id', gymId)
}

// ─── Gyms ─────────────────────────────────────────────────────────────────────
export async function insertGym(gym) {
  return supabase.from('gyms').insert(gym)
}

export async function getGymByCode(code) {
  return supabase.from('gyms').select('*').eq('join_code', code.toUpperCase()).single()
}

export async function getGymById(id) {
  return supabase.from('gyms').select('*').eq('id', id).single()
}

// ─── Workouts ─────────────────────────────────────────────────────────────────
export async function insertWorkout(workout) {
  return supabase.from('workouts').insert({
    id: workout.id,
    title: workout.title,
    date: workout.date,
    gym_id: workout.gymId,
    created_by: workout.createdBy,
    exercises: workout.exercises,
    warmup: workout.warmup || [],
    assigned_to: workout.assignedTo || null,
    from_program: workout.fromProgram || null,
    week_number: workout.weekNumber || null,
  })
}

export async function updateWorkout(id, data) {
  return supabase.from('workouts').update({
    title: data.title,
    exercises: data.exercises,
    warmup: data.warmup || [],
  }).eq('id', id)
}

export async function deleteWorkout(id) {
  return supabase.from('workouts').delete().eq('id', id)
}

export async function getGymWorkouts(gymId) {
  return supabase.from('workouts').select('*').eq('gym_id', gymId).order('date', { ascending: false })
}

// ─── Workout Logs ─────────────────────────────────────────────────────────────
export async function upsertWorkoutLog(log) {
  return supabase.from('workout_logs').upsert({
    id: log.id,
    user_id: log.userId,
    exercise_id: log.exerciseId,
    workout_id: log.workoutId,
    gym_id: log.gymId,
    exercise_name: log.exerciseName || '',
    sets: log.sets,
    notes: log.notes || '',
    logged_at: log.date || new Date().toISOString(),
  }, { onConflict: 'user_id,workout_id,exercise_id' })
}

export async function getGymLogs(gymId) {
  return supabase.from('workout_logs').select('*').eq('gym_id', gymId).order('logged_at', { ascending: false })
}

// ─── Habits ───────────────────────────────────────────────────────────────────
export async function upsertHabitDef(def) {
  return supabase.from('habit_defs').upsert({
    id: def.id,
    user_id: def.userId,
    name: def.name,
    description: def.description || '',
    emoji: def.emoji || '✅',
  })
}

export async function deleteHabitDef(id) {
  return supabase.from('habit_defs').delete().eq('id', id)
}

export async function getUserHabitDefs(userId) {
  return supabase.from('habit_defs').select('*').eq('user_id', userId)
}

export async function upsertHabitLog(log) {
  return supabase.from('habit_logs').upsert({
    id: log.id,
    habit_id: log.habitId,
    user_id: log.userId,
    date: log.date,
    completed: log.completed,
  }, { onConflict: 'habit_id,user_id,date' })
}

export async function deleteHabitLog(habitId, userId) {
  return supabase.from('habit_logs').delete()
    .eq('habit_id', habitId).eq('user_id', userId)
}

export async function getUserHabitLogs(userId) {
  return supabase.from('habit_logs').select('*').eq('user_id', userId)
}

// ─── Health Entries ───────────────────────────────────────────────────────────
export async function upsertHealthEntry(entry) {
  return supabase.from('health_entries').upsert({
    id: entry.id,
    user_id: entry.userId,
    metric: entry.metric,
    value: entry.value,
    value2: entry.value2 ?? null,
    date: entry.date,
    notes: entry.notes || '',
  }, { onConflict: 'id' })
}

export async function deleteHealthEntry(id) {
  return supabase.from('health_entries').delete().eq('id', id)
}

export async function getUserHealthEntries(userId) {
  return supabase.from('health_entries').select('*').eq('user_id', userId).order('date', { ascending: false })
}

// ─── Progress Photos ──────────────────────────────────────────────────────────
export async function upsertProgressPhoto(photo) {
  return supabase.from('progress_photos').upsert({
    id: photo.id,
    user_id: photo.userId,
    date: photo.date,
    caption: photo.caption || '',
    data_url: photo.dataUrl,
  }, { onConflict: 'id' })
}

export async function deleteProgressPhoto(id) {
  return supabase.from('progress_photos').delete().eq('id', id)
}

export async function getUserProgressPhotos(userId) {
  return supabase.from('progress_photos').select('*').eq('user_id', userId).order('date', { ascending: false })
}

// ─── Realtime Subscriptions ───────────────────────────────────────────────────
export function subscribeToGymWorkouts(gymId, callback) {
  return supabase
    .channel(`workouts:${gymId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'workouts',
      filter: `gym_id=eq.${gymId}`,
    }, callback)
    .subscribe()
}

export function subscribeToGymLogs(gymId, callback) {
  return supabase
    .channel(`logs:${gymId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'workout_logs',
      filter: `gym_id=eq.${gymId}`,
    }, callback)
    .subscribe()
}
