// File : /TeamSamsara.Workflow/app/src/shared/icons/iconRegistry.ts
// Version : 1.1.0
// Latest commit: core/app-shell
// Author : Gerrah
// Purpose : The only file that knows where each icon comes from; screens use the names.

import type { ComponentType } from "react";
import {
  Archive,
  ArrowLeft,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Clock,
  Copy,
  Download,
  Ellipsis,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Inbox,
  Info,
  Link,
  ListChecks,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  Menu,
  Monitor,
  Moon,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sun,
  Trash2,
  TriangleAlert,
  Upload,
  User,
  UserPlus,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { FaLinkedin } from "react-icons/fa6";
import {
  SiBluesky,
  SiDiscord,
  SiFacebook,
  SiInstagram,
  SiThreads,
  SiTiktok,
  SiTwitch,
  SiX,
  SiYoutube,
} from "react-icons/si";

export interface IconProps {
  className?: string;
  strokeWidth?: number;
  "aria-hidden"?: true;
}

type IconComponent = ComponentType<IconProps>;

// Names say what the icon means, not what it looks like, so a design change
// is one line here. Add new icons in the group that fits.
export const iconRegistry = {
  // Main menu
  calendar: Calendar,
  myTasks: ListChecks,
  workflows: Workflow,
  settings: Settings,

  // Actions
  add: Plus,
  check: Check,
  close: X,
  copy: Copy,
  edit: Pencil,
  trash: Trash2,
  archive: Archive,
  upload: Upload,
  download: Download,
  send: Send,
  search: Search,
  reset: RotateCcw,
  invite: UserPlus,
  more: Ellipsis,
  dragHandle: GripVertical,
  menu: Menu,
  logOut: LogOut,

  // Navigation
  back: ArrowLeft,
  previous: ChevronLeft,
  next: ChevronRight,
  chevronDown: ChevronDown,
  externalLink: ExternalLink,
  link: Link,

  // State and messages
  info: Info,
  warning: TriangleAlert,
  error: CircleAlert,
  time: Clock,
  loading: LoaderCircle,
  inbox: Inbox,

  // Account and access
  user: User,
  members: Users,
  permission: ShieldCheck,
  lock: Lock,
  email: Mail,
  showPassword: Eye,
  hidePassword: EyeOff,

  // Theme
  themeLight: Sun,
  themeDark: Moon,
  themeDevice: Monitor,

  // Brands (platforms and the Discord add-on)
  bluesky: SiBluesky,
  discord: SiDiscord,
  facebook: SiFacebook,
  instagram: SiInstagram,
  linkedin: FaLinkedin,
  threads: SiThreads,
  tiktok: SiTiktok,
  twitch: SiTwitch,
  x: SiX,
  youtube: SiYoutube,
} as const satisfies Record<string, IconComponent>;

export type IconName = keyof typeof iconRegistry;
