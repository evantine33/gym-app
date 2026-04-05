#!/usr/bin/env node
/**
 * Sends today's motivational quote to all Gymi subscribers via OneSignal.
 * Run daily at 8am via GitHub Actions.
 *
 * Env vars required:
 *   ONESIGNAL_APP_ID       — from OneSignal dashboard
 *   ONESIGNAL_REST_API_KEY — from OneSignal dashboard → Settings → Keys & IDs
 */

const QUOTES = [
  // Consistency & Habit
  "Show up. Every single day. That's the whole secret.",
  "You don't have to be great to start, but you have to start to be great.",
  "The pain you feel today is the strength you feel tomorrow.",
  "Discipline is choosing between what you want now and what you want most.",
  "Results happen over time, not overnight. Work hard, stay consistent.",
  "Small daily improvements lead to stunning long-term results.",
  "Fall in love with the process and the results will come.",
  "Success isn't given — it's earned in the gym, every rep, every day.",
  "Do it again. And again. And again. That's how champions are built.",
  "You will never always be motivated, so you must learn to be disciplined.",

  // Mindset
  "The only bad workout is the one that didn't happen.",
  "Your body can stand almost anything. It's your mind you have to convince.",
  "Push yourself because no one else is going to do it for you.",
  "Strength doesn't come from what you can do — it comes from overcoming what you thought you couldn't.",
  "The harder the battle, the sweeter the victory.",
  "Believe in yourself and all that you are. Know that there's something inside you that's greater than any obstacle.",
  "Whether you think you can or think you can't, you're right.",
  "Your mind will quit 100 times before your body does. Feel the pain and do it anyway.",
  "The difference between try and triumph is a little 'umph.'",
  "Champions aren't made in gyms. Champions are made from something deep inside them.",

  // Progress & Growth
  "Progress, not perfection.",
  "Every rep counts. Every set matters. Every workout brings you closer.",
  "You are one workout away from a good mood.",
  "Don't wish for a good body, work for it.",
  "Be stronger than your excuses.",
  "When you feel like quitting, think about why you started.",
  "The body achieves what the mind believes.",
  "No shortcuts. No excuses. Just hard work and results.",
  "Today's workout is tomorrow's warm-up.",
  "You don't get what you wish for — you get what you work for.",

  // Community & Team
  "Surround yourself with people who push you to be your best.",
  "Iron sharpens iron. We make each other better.",
  "Your gym family is watching. Show them what you're made of.",
  "A team that trains together, wins together.",
  "You're not doing this alone. We've got you.",
  "The energy you bring lifts everyone around you.",
  "There's no traffic on the extra mile.",
  "Good things come to those who sweat.",
  "We don't just build bodies here — we build people.",
  "One more rep. For yourself, and for the person next to you.",

  // Tough Love
  "Stop waiting for the perfect moment. Take the moment and make it perfect.",
  "The clock is ticking. Are you becoming the person you want to be?",
  "Sweat now, shine later.",
  "If it doesn't challenge you, it won't change you.",
  "Tired? Good. That means you're working.",
  "Excuses burn zero calories.",
  "Sore today, strong tomorrow.",
  "You didn't come this far to only come this far.",
  "The gym doesn't care about your feelings. It only responds to your effort.",
  "Pain is temporary. Quitting lasts forever.",

  // Health & Longevity
  "Take care of your body — it's the only place you have to live.",
  "Fitness is not about being better than someone else. It's about being better than you used to be.",
  "Health is not a destination — it's a way of living.",
  "Move your body like you love it.",
  "Your future self is watching you right now through your memories. Make them proud.",
  "Eat well, train hard, sleep better, repeat.",
  "Every workout is a step toward the best version of you.",
  "A healthy outside starts from the inside.",
  "Strong is beautiful. In every shape, every size.",
  "Investing in yourself is the best investment you will ever make.",

  // Classic Quotes
  "We are what we repeatedly do. Excellence, then, is not an act, but a habit. — Aristotle",
  "It's not about having time. It's about making time.",
  "A year from now you'll wish you had started today.",
  "The secret of getting ahead is getting started. — Mark Twain",
  "If it were easy, everyone would do it. Hard is what makes it great.",
  "Your potential is endless. Go do what you were created to do.",
  "Nothing worth having comes easy.",
  "You are tougher than you think.",
  "One day or day one — you decide.",
  "Be the energy you want to attract.",

  // Day-specific feel-good
  "New day. New goals. Same fire.",
  "Today is a great day to get better.",
  "Make today count. Future you will thank you.",
  "Rise up. Show up. Never give up.",
  "Every morning you have two choices: sleep with your dreams or wake up and chase them.",
  "Today's effort is tomorrow's result.",
  "You woke up today — now go earn something.",
  "Start where you are. Use what you have. Do what you can.",
  "Your only limit is you.",
  "Good morning. Let's make it a great training day. 💪",
]

const APP_ID = process.env.ONESIGNAL_APP_ID
const REST_KEY = process.env.ONESIGNAL_REST_API_KEY

if (!APP_ID || !REST_KEY) {
  console.error('❌ Missing ONESIGNAL_APP_ID or ONESIGNAL_REST_API_KEY environment variables.')
  process.exit(1)
}

// Pick today's quote — same for all members on the same day
const dayOfYear = Math.floor(
  (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
)
const quote = QUOTES[dayOfYear % QUOTES.length]
const day = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

console.log(`📅 ${day}`)
console.log(`💬 Quote: "${quote}"`)
console.log(`📤 Sending to all subscribers...`)

const body = JSON.stringify({
  app_id: APP_ID,
  included_segments: ['Total Subscriptions'],
  headings: { en: `Gymi Daily — ${new Date().toLocaleDateString('en-US', { weekday: 'long' })}` },
  contents: { en: quote },
  url: 'https://getgymi.ai',
  chrome_web_icon: 'https://getgymi.ai/vite.svg',
  firefox_icon: 'https://getgymi.ai/vite.svg',
})

const res = await fetch('https://onesignal.com/api/v1/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${REST_KEY}`,
  },
  body,
})

const json = await res.json()

// "No subscribers yet" is not a real error — just means no one has opted in yet
if (json.errors?.includes('All included players are not subscribed')) {
  console.log('⚠️  No subscribers yet — once members enable notifications in the app, they will receive this quote.')
  process.exit(0)
}

if (!res.ok || json.errors) {
  console.error('❌ Failed to send:', JSON.stringify(json, null, 2))
  process.exit(1)
}

console.log(`✅ Sent! Notification ID: ${json.id}`)
console.log(`   Recipients: ${json.recipients ?? 'unknown'}`)
