import { 
  Folder, Flame, Zap, Activity, Calendar, Target, Lightbulb, 
  Rocket, BarChart, Star, Briefcase, Home, Palette,
  Clock, Heart, Shield, Trophy, Users, Settings
} from 'lucide-react'

export const SECTION_ICON_MAP = {
  folder: { icon: Folder, color: 'text-blue-500' },
  flame: { icon: Flame, color: 'text-red-500' },
  zap: { icon: Zap, color: 'text-purple-500' },
  activity: { icon: Activity, color: 'text-green-500' },
  calendar: { icon: Calendar, color: 'text-green-500' },
  target: { icon: Target, color: 'text-purple-500' },
  lightbulb: { icon: Lightbulb, color: 'text-amber-500' },
  rocket: { icon: Rocket, color: 'text-indigo-500' },
  'bar-chart': { icon: BarChart, color: 'text-cyan-500' },
  star: { icon: Star, color: 'text-yellow-500' },
  briefcase: { icon: Briefcase, color: 'text-gray-600' },
  home: { icon: Home, color: 'text-green-600' },
  palette: { icon: Palette, color: 'text-pink-500' },
  clock: { icon: Clock, color: 'text-orange-500' },
  heart: { icon: Heart, color: 'text-red-400' },
  shield: { icon: Shield, color: 'text-emerald-500' },
  trophy: { icon: Trophy, color: 'text-yellow-600' },
  users: { icon: Users, color: 'text-blue-600' },
  settings: { icon: Settings, color: 'text-gray-500' },
  // Emoji to Lucide icon mappings
  '⭐': { icon: Star, color: 'text-yellow-500' },
  '⚡': { icon: Zap, color: 'text-purple-500' },
  '⏳': { icon: Clock, color: 'text-orange-500' },
  '📋': { icon: Briefcase, color: 'text-gray-600' },
  '✅': { icon: Target, color: 'text-green-500' }
}

export const ICON_OPTIONS = [
  { icon: Folder, name: 'folder', color: 'text-blue-500' },
  { icon: Flame, name: 'flame', color: 'text-red-500' },
  { icon: Zap, name: 'zap', color: 'text-purple-500' },
  { icon: Activity, name: 'activity', color: 'text-green-500' },
  { icon: Calendar, name: 'calendar', color: 'text-green-500' },
  { icon: Target, name: 'target', color: 'text-purple-500' },
  { icon: Lightbulb, name: 'lightbulb', color: 'text-amber-500' },
  { icon: Rocket, name: 'rocket', color: 'text-indigo-500' },
  { icon: BarChart, name: 'bar-chart', color: 'text-cyan-500' },
  { icon: Star, name: 'star', color: 'text-yellow-500' },
  { icon: Briefcase, name: 'briefcase', color: 'text-gray-600' },
  { icon: Home, name: 'home', color: 'text-green-600' },
  { icon: Palette, name: 'palette', color: 'text-pink-500' },
  { icon: Clock, name: 'clock', color: 'text-orange-500' },
  { icon: Heart, name: 'heart', color: 'text-red-400' },
  { icon: Shield, name: 'shield', color: 'text-emerald-500' },
  { icon: Trophy, name: 'trophy', color: 'text-yellow-600' },
  { icon: Users, name: 'users', color: 'text-blue-600' },
  { icon: Settings, name: 'settings', color: 'text-gray-500' }
]

export const renderSectionIcon = (iconName, size = 20, className = '') => {
  const iconData = SECTION_ICON_MAP[iconName]
  if (!iconData) {
    return <Folder size={size} className={`text-gray-500 ${className}`} />
  }
  
  const IconComponent = iconData.icon
  return <IconComponent size={size} className={`${iconData.color} ${className}`} />
}