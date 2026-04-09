import { useState, useMemo, useRef } from 'react'
import { useApp } from '../context/AppContext'
import {
  Footprints, Moon, Scale, Percent, Flame, Heart, Activity,
  Camera, Plus, X, ChevronRight, Trash2, TrendingUp, TrendingDown,
  Minus, Upload, ChevronLeft,
} from 'lucide-react'

const TODAY = new Date().toISOString().split('T')[0]

// ─── Metric config ─────────────────────────────────────────────────────────────
const METRICS = [
  { key: 'weight',       label: 'Body Weight',    icon: Scale,      unit: 'lbs',  color: '#f97316', step: '0.1', placeholder: '145.5' },
  { key: 'body_fat',     label: 'Body Fat',        icon: Percent,    unit: '%',    color: '#a855f7', step: '0.1', placeholder: '18.5' },
  { key: 'steps',        label: 'Steps',           icon: Footprints, unit: 'steps',color: '#22c55e', step: '1',   placeholder: '8500' },
  { key: 'sleep',        label: 'Sleep',           icon: Moon,       unit: 'hrs',  color: '#3b82f6', step: '0.5', placeholder: '7.5' },
  { key: 'calories_in',  label: 'Caloric Intake',  icon: Flame,      unit: 'cal',  color: '#ef4444', step: '1',   placeholder: '2000' },
  { key: 'calories_burn',label: 'Caloric Burn',    icon: TrendingUp, unit: 'cal',  color: '#f59e0b', step: '1',   placeholder: '500'  },
  { key: 'resting_hr',   label: 'Resting HR',      icon: Heart,      unit: 'bpm',  color: '#ec4899', step: '1',   placeholder: '62'   },
  { key: 'blood_pressure',label: 'Blood Pressure', icon: Activity,   unit: 'mmHg', color: '#06b6d4', step: '1',   placeholder: '120'  },
  { key: 'lean_mass',    label: 'Lean Body Mass',  icon: TrendingUp, unit: 'lbs',  color: '#10b981', step: '0.1', placeholder: '120.0'},
]

function fmt(date) {
  if (!date) return ''
  const d = new Date(date + 'T12:00:00')
  const diff = Math.round((new Date(TODAY + 'T12:00:00') - d) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return `${diff}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Mini sparkline ────────────────────────────────────────────────────────────
function Sparkline({ values, color }) {
  if (!values || values.length < 2) return <div className="h-8" />
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 80, H = 28
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  }).join(' ')
  return (
    <svg width={W} height={H} className="overflow-visible opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

// ─── Metric Card ───────────────────────────────────────────────────────────────
function MetricCard({ metric, entries, onLog }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sorted[0]
  const sparkValues = [...sorted].reverse().slice(-10).map(e => e.value)

  const trend = sorted.length >= 2
    ? sorted[0].value - sorted[1].value
    : null

  const Icon = metric.icon

  return (
    <button
      onClick={() => onLog(metric)}
      className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col gap-2 hover:border-gray-600 transition-all active:scale-95 text-left"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color: metric.color }} />
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{metric.label}</span>
        </div>
        {trend !== null && (
          <span className={`text-[10px] font-bold flex items-center gap-0.5 ${
            trend < 0 ? 'text-green-400' : trend > 0 ? 'text-red-400' : 'text-gray-500'
          }`}>
            {trend < 0 ? <TrendingDown className="w-3 h-3" /> : trend > 0 ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
            {Math.abs(trend).toFixed(metric.step === '0.1' ? 1 : 0)}
          </span>
        )}
      </div>

      {latest ? (
        <>
          <div>
            <span className="text-2xl font-black text-white">
              {metric.key === 'blood_pressure' && latest.value2
                ? `${latest.value}/${latest.value2}`
                : metric.step === '0.1' ? latest.value.toFixed(1) : Math.round(latest.value).toLocaleString()}
            </span>
            <span className="text-xs text-gray-500 ml-1">{metric.unit}</span>
          </div>
          <div className="flex items-end justify-between">
            <span className="text-[10px] text-gray-600">{fmt(latest.date)}</span>
            <Sparkline values={sparkValues} color={metric.color} />
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center py-2 gap-1">
          <span className="text-gray-700 text-xs">No data yet</span>
          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: metric.color }}>
            <Plus className="w-3 h-3" /> Log first entry
          </div>
        </div>
      )}
    </button>
  )
}

// ─── Log Entry Modal ───────────────────────────────────────────────────────────
function LogModal({ metric, onClose, onSave }) {
  const [date, setDate] = useState(TODAY)
  const [value, setValue] = useState('')
  const [value2, setValue2] = useState('')   // for BP diastolic
  const [notes, setNotes] = useState('')
  const isBP = metric.key === 'blood_pressure'

  const handleSave = () => {
    const v = parseFloat(value)
    if (isNaN(v) || v <= 0) return
    const v2 = isBP ? parseFloat(value2) : null
    onSave({ date, value: v, value2: isBP && !isNaN(v2) ? v2 : null, notes })
    onClose()
  }

  const Icon = metric.icon

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: metric.color }} />
            <h3 className="font-bold">Log {metric.label}</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Date</label>
            <input type="date" className="input" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          {isBP ? (
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Systolic</label>
                <input type="number" className="input" placeholder="120" value={value} onChange={e => setValue(e.target.value)} />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-400 mb-1">Diastolic</label>
                <input type="number" className="input" placeholder="80" value={value2} onChange={e => setValue2(e.target.value)} />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs text-gray-400 mb-1">
                {metric.label} <span className="text-gray-600">({metric.unit})</span>
              </label>
              <input
                type="number" step={metric.step} className="input text-xl font-bold"
                placeholder={metric.placeholder} value={value} onChange={e => setValue(e.target.value)}
                autoFocus
              />
            </div>
          )}
          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes <span className="text-gray-600">(optional)</span></label>
            <input type="text" className="input" placeholder="e.g. after morning workout" value={notes} onChange={e => setNotes(e.target.value)} />
          </div>
          <div className="flex gap-3 pt-1">
            <button onClick={onClose} className="btn-ghost flex-1">Cancel</button>
            <button onClick={handleSave} className="btn-primary flex-1">Save</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── History Modal ─────────────────────────────────────────────────────────────
function HistoryModal({ metric, entries, onClose, onDelete }) {
  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date))
  const Icon = metric.icon

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4" style={{ color: metric.color }} />
            <h3 className="font-bold">{metric.label} History</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-2">
          {sorted.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">No entries yet</p>
          ) : sorted.map(e => (
            <div key={e.id} className="flex items-center gap-3 bg-gray-800 rounded-xl px-3 py-2.5">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">
                    {metric.key === 'blood_pressure' && e.value2
                      ? `${e.value}/${e.value2}`
                      : metric.step === '0.1' ? Number(e.value).toFixed(1) : Math.round(e.value).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-500">{metric.unit}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[11px] text-gray-500">{new Date(e.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                  {e.notes && <span className="text-[11px] text-gray-600 truncate italic">{e.notes}</span>}
                </div>
              </div>
              <button onClick={() => onDelete(e.id)} className="text-gray-700 hover:text-red-400 transition-colors p-1">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Progress Photos ───────────────────────────────────────────────────────────
function ProgressPhotos({ photos, onAdd, onDelete }) {
  const fileRef = useRef(null)
  const [caption, setCaption] = useState('')
  const [preview, setPreview] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [lightbox, setLightbox] = useState(null)

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      // Compress via canvas
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const maxW = 800
        const ratio = Math.min(maxW / img.width, maxW / img.height, 1)
        canvas.width = img.width * ratio
        canvas.height = img.height * ratio
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        setPreview(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleSave = () => {
    if (!preview) return
    onAdd({ photoData: preview, caption, date: TODAY })
    setPreview(null); setCaption(''); setShowAdd(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  const sorted = [...photos].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-orange-400" />
          <h3 className="font-bold text-sm text-white">Progress Photos</h3>
          {photos.length > 0 && <span className="text-xs text-gray-500">{photos.length} photo{photos.length !== 1 ? 's' : ''}</span>}
        </div>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300"
        >
          <Plus className="w-3.5 h-3.5" /> Add Photo
        </button>
      </div>

      {showAdd && (
        <div className="mb-4 bg-gray-800 rounded-xl p-4 space-y-3 border border-gray-700">
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-gray-600 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-orange-500/50 transition-colors"
            >
              <Upload className="w-6 h-6 text-gray-500" />
              <span className="text-sm text-gray-500">Tap to choose photo</span>
            </button>
          ) : (
            <div className="relative">
              <img src={preview} alt="preview" className="w-full h-48 object-cover rounded-xl" />
              <button
                onClick={() => { setPreview(null); if (fileRef.current) fileRef.current.value = '' }}
                className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
          <input
            type="text" className="input text-sm" placeholder="Caption (optional)"
            value={caption} onChange={e => setCaption(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={() => { setShowAdd(false); setPreview(null); setCaption('') }} className="btn-ghost flex-1 text-sm">Cancel</button>
            <button onClick={handleSave} disabled={!preview} className="btn-primary flex-1 text-sm disabled:opacity-40">Save Photo</button>
          </div>
        </div>
      )}

      {sorted.length === 0 && !showAdd ? (
        <div className="text-center py-8">
          <Camera className="w-10 h-10 text-gray-700 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Track your transformation</p>
          <p className="text-gray-600 text-xs mt-1">Add your first progress photo</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {sorted.map(photo => (
            <div key={photo.id} className="relative group">
              <button onClick={() => setLightbox(photo)} className="w-full aspect-square rounded-xl overflow-hidden">
                <img src={photo.photoData} alt="progress" className="w-full h-full object-cover" />
              </button>
              <div className="mt-1">
                <p className="text-[10px] text-gray-500 text-center">
                  {new Date(photo.date + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox.photoData} alt="progress" className="max-w-full max-h-[80vh] rounded-2xl object-contain" />
          <div className="mt-3 flex items-center gap-4">
            <span className="text-gray-400 text-sm">
              {new Date(lightbox.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            {lightbox.caption && <span className="text-gray-500 text-sm italic">"{lightbox.caption}"</span>}
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(lightbox.id); setLightbox(null) }}
              className="text-red-400 hover:text-red-300"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function Health() {
  const { state, dispatch, currentUser } = useApp()
  const [logging, setLogging] = useState(null)       // metric being logged
  const [viewing, setViewing] = useState(null)       // metric history open

  const myEntries = (state.healthEntries || []).filter(e => e.userId === currentUser?.id)
  const myPhotos  = (state.progressPhotos || []).filter(p => p.userId === currentUser?.id)

  const entriesByMetric = useMemo(() => {
    const map = {}
    METRICS.forEach(m => { map[m.key] = [] })
    myEntries.forEach(e => {
      if (map[e.metricType]) map[e.metricType].push(e)
    })
    return map
  }, [myEntries])

  const handleSaveEntry = (metric, data) => {
    dispatch({
      type: 'ADD_HEALTH_ENTRY',
      entry: {
        id: 'hentry-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        userId: currentUser.id,
        metricType: metric.key,
        value: data.value,
        value2: data.value2 || null,
        unit: metric.unit,
        date: data.date,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
      }
    })
  }

  const handleDeleteEntry = (id) => {
    dispatch({ type: 'DELETE_HEALTH_ENTRY', entryId: id })
  }

  const handleAddPhoto = (data) => {
    dispatch({
      type: 'ADD_PROGRESS_PHOTO',
      photo: {
        id: 'photo-' + Date.now() + '-' + Math.random().toString(36).slice(2),
        userId: currentUser.id,
        date: data.date,
        caption: data.caption || '',
        photoData: data.photoData,
        createdAt: new Date().toISOString(),
      }
    })
  }

  const handleDeletePhoto = (id) => {
    dispatch({ type: 'DELETE_PROGRESS_PHOTO', photoId: id })
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Health</h1>
        <p className="text-gray-400 text-sm mt-0.5">Track your body metrics and progress</p>
      </div>

      {/* Metric cards grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {METRICS.map(metric => (
          <div key={metric.key} className="relative">
            <MetricCard
              metric={metric}
              entries={entriesByMetric[metric.key] || []}
              onLog={setLogging}
            />
            {(entriesByMetric[metric.key] || []).length > 0 && (
              <button
                onClick={() => setViewing(metric)}
                className="absolute bottom-2 right-2 text-gray-700 hover:text-gray-400 transition-colors"
                title="View history"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Progress Photos */}
      <ProgressPhotos
        photos={myPhotos}
        onAdd={handleAddPhoto}
        onDelete={handleDeletePhoto}
      />

      {/* Apple Health note */}
      <div className="mt-5 bg-blue-950/30 border border-blue-900/30 rounded-2xl p-4 flex gap-3">
        <span className="text-xl flex-shrink-0">📱</span>
        <div>
          <p className="text-sm font-semibold text-blue-300">Apple Health / Google Fit sync</p>
          <p className="text-xs text-blue-400/70 mt-0.5">
            Auto-sync from your health app requires a native iOS or Android app.
            For now, log your stats manually — we're working on it.
          </p>
        </div>
      </div>

      {/* Modals */}
      {logging && (
        <LogModal
          metric={logging}
          onClose={() => setLogging(null)}
          onSave={(data) => handleSaveEntry(logging, data)}
        />
      )}
      {viewing && (
        <HistoryModal
          metric={viewing}
          entries={entriesByMetric[viewing.key] || []}
          onClose={() => setViewing(null)}
          onDelete={handleDeleteEntry}
        />
      )}
    </div>
  )
}
