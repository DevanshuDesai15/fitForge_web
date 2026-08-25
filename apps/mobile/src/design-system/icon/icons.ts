import {
  AlertTriangle, ArrowLeft, BarChart3, Brain, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronLeft,
  ChevronRight, CircleHelp, Clock3, Dumbbell, Flame, History, Home, Info, LineChart,
  Lock, LogOut, Mail, Menu, Minus, MoreHorizontal, Pencil, Play, Plus, Search, Settings,
  Shuffle, Sparkles, Target, Trash2, TrendingUp, User, X, Zap,
} from 'lucide-react-native';

export const iconRegistry = {
  'alert-triangle': AlertTriangle, 'arrow-left': ArrowLeft, 'bar-chart-3': BarChart3, brain: Brain, calendar: CalendarDays,
  check: Check, 'check-circle-2': CheckCircle2, 'chevron-down': ChevronDown, 'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight, clock: Clock3, dumbbell: Dumbbell, flame: Flame,
  history: History, home: Home, info: Info, 'line-chart': LineChart, lock: Lock, mail: Mail,
  'log-out': LogOut, menu: Menu, minus: Minus, more: MoreHorizontal, pencil: Pencil,
  play: Play, plus: Plus, search: Search, settings: Settings, shuffle: Shuffle,
  sparkles: Sparkles, target: Target, trash: Trash2, 'trending-up': TrendingUp,
  user: User, x: X, zap: Zap,
} as const;

export type FitForgeIconName = keyof typeof iconRegistry;
export const fallbackIcon = CircleHelp;
