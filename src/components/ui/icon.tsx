import {
  Atom,
  Bell,
  Boxes,
  BrainCircuit,
  Calculator,
  ChevronRight,
  Clock,
  Coins,
  Command,
  Compass,
  Dice5,
  Flame,
  GitBranch,
  Grid3x3,
  Heart,
  Home,
  Hourglass,
  Infinity as InfinityIcon,
  Landmark,
  LineChart,
  PackageOpen,
  Palette,
  Ruler,
  Scale,
  ScrollText,
  Shuffle,
  Sparkles,
  TrendingUp,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/**
 * Central icon registry. Tools reference icons by a **string name** (see
 * `IconName`) so the tool registry stays JSON-serializable and can cross the
 * Server→Client boundary. Add an icon here, then reference its key from
 * `data/tools.ts` or `data/categories.ts`.
 *
 * Only the icons actually used are imported, so tree-shaking keeps the bundle
 * lean even as the catalog grows.
 */
export const icons = {
  atom: Atom,
  bell: Bell,
  boxes: Boxes,
  "brain-circuit": BrainCircuit,
  calculator: Calculator,
  "chevron-right": ChevronRight,
  clock: Clock,
  coins: Coins,
  command: Command,
  compass: Compass,
  dice: Dice5,
  flame: Flame,
  "git-branch": GitBranch,
  grid: Grid3x3,
  heart: Heart,
  home: Home,
  hourglass: Hourglass,
  infinity: InfinityIcon,
  landmark: Landmark,
  "line-chart": LineChart,
  "package-open": PackageOpen,
  palette: Palette,
  ruler: Ruler,
  scale: Scale,
  "scroll-text": ScrollText,
  shuffle: Shuffle,
  sparkles: Sparkles,
  "trending-up": TrendingUp,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof icons;

export function getIcon(name: IconName): LucideIcon {
  return icons[name];
}

interface IconProps extends LucideProps {
  name: IconName;
}

/** Render a registry icon by name. Safe to use in Server Components. */
export function Icon({ name, ...props }: IconProps) {
  const LucideComp = icons[name];
  return <LucideComp {...props} />;
}
