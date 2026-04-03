import { motion } from 'framer-motion'
import type { DetectedIssue, BodyRegion } from '@/types'
import { cn } from '@/lib/cn'

interface BodyStrainMapProps {
  issues: DetectedIssue[]
  className?: string
}

/** Aggregate strain intensity per region across all issues */
function buildRegionHeatmap(issues: DetectedIssue[]): Record<string, number> {
  const map: Record<string, number> = {}
  for (const issue of issues) {
    for (const [region, intensity] of Object.entries(issue.strainMap)) {
      map[region] = Math.max(map[region] ?? 0, intensity as number)
    }
  }
  return map
}

function intensityToColor(intensity: number): string {
  if (intensity >= 0.7) return '#FF4757'      // danger
  if (intensity >= 0.4) return '#FFB72B'      // warning
  if (intensity >= 0.15) return '#4F8EF7'     // brand (mild)
  return 'rgba(255,255,255,0.06)'             // neutral
}

function intensityToLabel(intensity: number): string {
  if (intensity >= 0.7) return 'High strain'
  if (intensity >= 0.4) return 'Moderate strain'
  if (intensity >= 0.15) return 'Mild strain'
  return ''
}

interface RegionLabelProps {
  region: BodyRegion
  intensity: number
  x: number
  y: number
}

/** SVG body figure with heat-mapped regions */
export function BodyStrainMap({ issues, className }: BodyStrainMapProps) {
  const heatmap = buildRegionHeatmap(issues)

  const regions: RegionLabelProps[] = [
    { region: 'head_neck', intensity: heatmap.head_neck ?? 0, x: 100, y: 38 },
    { region: 'shoulders', intensity: heatmap.shoulders ?? 0, x: 100, y: 80 },
    { region: 'thoracic_spine', intensity: heatmap.thoracic_spine ?? 0, x: 100, y: 115 },
    { region: 'lumbar_spine', intensity: heatmap.lumbar_spine ?? 0, x: 100, y: 148 },
    { region: 'hips_pelvis', intensity: heatmap.hips_pelvis ?? 0, x: 100, y: 178 },
    { region: 'knees', intensity: heatmap.knees ?? 0, x: 100, y: 230 },
    { region: 'ankles_feet', intensity: heatmap.ankles_feet ?? 0, x: 100, y: 280 },
  ]

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <h3 className="text-sm font-semibold text-text-2 mb-3">Strain Map</h3>
      <svg
        viewBox="0 0 200 320"
        className="w-40"
        fill="none"
      >
        {/* Head */}
        <motion.ellipse
          cx="100" cy="38" rx="24" ry="26"
          fill={intensityToColor(heatmap.head_neck ?? 0)}
          fillOpacity="0.3"
          stroke={intensityToColor(heatmap.head_neck ?? 0)}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        />

        {/* Neck */}
        <motion.rect x="93" y="64" width="14" height="18" rx="4"
          fill={intensityToColor(heatmap.head_neck ?? 0)}
          fillOpacity="0.3"
          stroke={intensityToColor(heatmap.head_neck ?? 0)}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
        />

        {/* Shoulders + upper torso */}
        <motion.rect x="55" y="80" width="90" height="42" rx="8"
          fill={intensityToColor(Math.max(heatmap.shoulders ?? 0, heatmap.thoracic_spine ?? 0))}
          fillOpacity="0.3"
          stroke={intensityToColor(Math.max(heatmap.shoulders ?? 0, heatmap.thoracic_spine ?? 0))}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        />

        {/* Lower torso */}
        <motion.rect x="63" y="120" width="74" height="40" rx="6"
          fill={intensityToColor(Math.max(heatmap.lumbar_spine ?? 0, heatmap.hips_pelvis ?? 0))}
          fillOpacity="0.3"
          stroke={intensityToColor(Math.max(heatmap.lumbar_spine ?? 0, heatmap.hips_pelvis ?? 0))}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
        />

        {/* Hips */}
        <motion.rect x="60" y="158" width="80" height="28" rx="6"
          fill={intensityToColor(heatmap.hips_pelvis ?? 0)}
          fillOpacity="0.3"
          stroke={intensityToColor(heatmap.hips_pelvis ?? 0)}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        />

        {/* Left thigh */}
        <motion.rect x="63" y="185" width="30" height="52" rx="8"
          fill={intensityToColor(heatmap.knees ?? 0)}
          fillOpacity="0.25"
          stroke={intensityToColor(heatmap.knees ?? 0)}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        />

        {/* Right thigh */}
        <motion.rect x="107" y="185" width="30" height="52" rx="8"
          fill={intensityToColor(heatmap.knees ?? 0)}
          fillOpacity="0.25"
          stroke={intensityToColor(heatmap.knees ?? 0)}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
        />

        {/* Left shin */}
        <motion.rect x="68" y="238" width="22" height="50" rx="6"
          fill={intensityToColor(heatmap.ankles_feet ?? 0)}
          fillOpacity="0.25"
          stroke={intensityToColor(heatmap.ankles_feet ?? 0)}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        />

        {/* Right shin */}
        <motion.rect x="110" y="238" width="22" height="50" rx="6"
          fill={intensityToColor(heatmap.ankles_feet ?? 0)}
          fillOpacity="0.25"
          stroke={intensityToColor(heatmap.ankles_feet ?? 0)}
          strokeWidth="1.5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        />
      </svg>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3">
        {[
          { color: '#FF4757', label: 'High' },
          { color: '#FFB72B', label: 'Moderate' },
          { color: '#4F8EF7', label: 'Mild' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-text-3">{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
