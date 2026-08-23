import React from 'react';
import Svg, { Path, Circle, Ellipse } from 'react-native-svg';
import { colors } from '../../theme/tokens';

// Vector icons + food illustrations mirrored from prototypes/vajeeva-prototype.html
// (.ln = 1.7 stroke line icons; ill-* = flat illustrations in the token palette).

interface IconProps { size?: number; color?: string }

const ln = (color: string) => ({
  fill: 'none' as const,
  stroke: color,
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function IconBack({ size = 20, color = colors.ink }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M15 5l-7 7 7 7" /></Svg>;
}

export function IconSearch({ size = 20, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={11} cy={11} r={6.5} />
      <Path {...ln(color)} d="M16 16l4.5 4.5" />
    </Svg>
  );
}

export function IconHome({ size = 20, color = colors.muted }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M4 11l8-6.5 8 6.5v8a1 1 0 0 1-1 1h-4.5v-6h-5v6H5a1 1 0 0 1-1-1z" /></Svg>;
}

export function IconBook({ size = 20, color = colors.muted }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M7 4h11v16l-5.5-4L7 20z" /></Svg>;
}

export function IconMore({ size = 20, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle fill={color} cx={5.5} cy={12} r={1.7} />
      <Circle fill={color} cx={12} cy={12} r={1.7} />
      <Circle fill={color} cx={18.5} cy={12} r={1.7} />
    </Svg>
  );
}

export function IconPlay({ size = 15, color = colors.onGreen }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path fill={color} d="M8 6.5l10 5.5-10 5.5z" /></Svg>;
}

export function IconClock({ size = 13, color = colors.cmGreen }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={12} cy={12} r={8} />
      <Path {...ln(color)} d="M12 8v4.3l2.8 1.7" />
    </Svg>
  );
}

export function IconClose({ size = 13, color = colors.cmMuted }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M6 6l12 12M18 6L6 18" /></Svg>;
}

export function IconChev({ size = 18, color = colors.muted }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M9 5l7 7-7 7" /></Svg>;
}

export function IconEdit({ size = 15, color = colors.green }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M4 20h4L18.5 9.5a2 2 0 0 0-2.8-2.8L5 17z" />
      <Path {...ln(color)} d="M14.5 7.5l2.8 2.8" />
    </Svg>
  );
}

export function IconShield({ size = 16, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M12 3l7 3v5c0 4.6-3 7.9-7 9-4-1.1-7-4.4-7-9V6z" />
      <Path {...ln(color)} d="M9 12l2 2 4-4" />
    </Svg>
  );
}

export function IconInfo({ size = 16, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={12} cy={12} r={8.5} />
      <Path {...ln(color)} d="M12 11v5M12 8v.2" />
    </Svg>
  );
}

export function IconChat({ size = 16, color = colors.ink }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M5 6h14v9H9l-4 4z" /></Svg>;
}

export function IconStar({ size = 16, color = colors.ink }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z" /></Svg>;
}

export function IconLogout({ size = 16, color = colors.clay }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M13 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h7" />
      <Path {...ln(color)} d="M10 12h10M16.5 8l4 4-4 4" />
    </Svg>
  );
}

export function IconRuler({ size = 16, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M3 8h18v8H3z" />
      <Path {...ln(color)} d="M7 8v3M11 8v4M15 8v3M19 8v4" />
    </Svg>
  );
}

export function IconSun({ size = 16, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={12} cy={12} r={4} />
      <Path {...ln(color)} d="M12 3v2M12 19v2M3 12h2M19 12h2M6 6l1.4 1.4M16.6 16.6 18 18M18 6l-1.4 1.4M7.4 16.6 6 18" />
    </Svg>
  );
}

export function IconDoc({ size = 16, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M7 3h7l4 4v14H7z" />
      <Path {...ln(color)} d="M14 3v4h4" />
    </Svg>
  );
}

export function IconTrash({ size = 16, color = colors.clay }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" />
    </Svg>
  );
}

export function IconTheme({ size = 16, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={12} cy={12} r={8} />
      <Path fill={color} d="M12 4a8 8 0 0 0 0 16z" />
    </Svg>
  );
}

export function IconCheck({ size = 20, color = colors.cmGreen }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M5 12.5l4.5 4.5L19 7" /></Svg>;
}

export function IconUser({ size = 15, color = colors.green }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={12} cy={8.5} r={3.3} />
      <Path {...ln(color)} d="M5.5 19a6.5 6.5 0 0 1 13 0" />
    </Svg>
  );
}

export function IconFlame({ size = 11, color = colors.cmMuted }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M12 3c1 3 4 4.5 4 8a4 4 0 0 1-8 0c0-1.4.6-2.4 1.3-3.2C10 9 12 8 12 3z" /></Svg>;
}

export function IconLeaf({ size = 11, color = colors.green }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M5 19c0-8 6-13 14-13 0 8-5 13-13 13" />
      <Path {...ln(color)} d="M5 19c3-4 6-6 9-7" />
    </Svg>
  );
}

export function IconDrop({ size = 13, color = colors.green }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M12 4.2c2.8 3.7 5.3 6.2 5.3 9.3a5.3 5.3 0 0 1-10.6 0C6.7 10.4 9.2 7.9 12 4.2z" /></Svg>;
}

export function IconHeart({ size = 15, color = colors.clay }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M12 20s-7-4.6-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.4-7 10-7 10z" /></Svg>;
}

// Meta-row marks: steps (list) and yield (jar).
export function IconList({ size = 11, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M8 6h12M8 12h12M8 18h12" />
      <Circle fill={color} cx={4} cy={6} r={1.3} />
      <Circle fill={color} cx={4} cy={12} r={1.3} />
      <Circle fill={color} cx={4} cy={18} r={1.3} />
    </Svg>
  );
}

export function IconJar({ size = 11, color = colors.muted }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M8 4h8M7 8h10v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2z" />
      <Path {...ln(color)} d="M7 8l1-4M17 8l-1-4" />
    </Svg>
  );
}

export function IconHeartFilled({ size = 15, color = colors.clay }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path fill={color} d="M12 20.4S4.6 15.6 4.6 9.8A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.4 2.8c0 5.8-7.4 10.6-7.4 10.6z" /></Svg>;
}

// Caution triangle + prohibited circle — the fit badge's caution / avoid marks.
export function IconWarn({ size = 11, color = colors.amber2 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path {...ln(color)} d="M12 4.5l8.5 15h-17z" />
      <Path {...ln(color)} d="M12 10v4M12 16.6v.2" />
    </Svg>
  );
}

export function IconNo({ size = 11, color = colors.clay }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={12} cy={12} r={8.5} />
      <Path {...ln(color)} d="M6.2 6.2l11.6 11.6" />
    </Svg>
  );
}

export function IconShare({ size = 15, color = colors.ink }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle {...ln(color)} cx={6} cy={12} r={2.4} />
      <Circle {...ln(color)} cx={17} cy={6} r={2.4} />
      <Circle {...ln(color)} cx={17} cy={18} r={2.4} />
      <Path {...ln(color)} d="M8.1 11l6.8-3.8M8.1 13l6.8 3.8" />
    </Svg>
  );
}

export function IconFilter({ size = 15, color = colors.ink }: IconProps) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path {...ln(color)} d="M4 6h16M7 12h10M10 18h4" /></Svg>;
}

/** Sprout logo mark (mk-sprout): green stroke stem + leaf fills. */
export function MkSprout({ size = 18 }: { size?: number }) {
  const mk = { fill: 'none' as const, stroke: colors.green, strokeWidth: 2.1, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 32 32">
      <Path {...mk} d="M16 28V13" />
      <Path fill={colors.green} d="M16 15c-1-5-5-6.5-8.5-6.5C7 13 10 16 16 16Z" />
      <Path fill={colors.green} d="M16 13c1-4.5 4.5-6 7.5-6C23 11.5 20.5 14 16 14Z" />
    </Svg>
  );
}

/** Laddu illustration (ill-laddu). */
export function IllLaddu({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse fill={colors.sand} cx={32} cy={49} rx={19} ry={4.5} />
      <Circle fill={colors.amber} cx={32} cy={33} r={15} />
      <Circle fill={colors.amber2} cx={27} cy={30} r={1.5} />
      <Circle fill={colors.amber2} cx={35} cy={28} r={1.3} />
      <Circle fill={colors.amber2} cx={33} cy={37} r={1.6} />
      <Circle fill={colors.amber2} cx={26} cy={38} r={1.2} />
      <Circle fill={colors.amber2} cx={38} cy={34} r={1.4} />
      <Circle fill={colors.amber2} cx={31} cy={33} r={1.2} />
      <Ellipse fill={colors.green} cx={32} cy={19.5} rx={3.6} ry={2.3} />
    </Svg>
  );
}

/** Cup illustration (ill-cup). */
export function IllCup({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse fill={colors.sand} cx={31} cy={51} rx={17} ry={4} />
      <Path fill={colors.cream} d="M19 25h24l-2.6 20a4 4 0 0 1-4 3.5H25.6a4 4 0 0 1-4-3.5z" />
      <Path fill={colors.green} d="M20.4 25h21.2l-.7 5.4H21.1z" />
      <Path fill="none" stroke={colors.green} strokeWidth={2.4} strokeLinecap="round" d="M43.5 28a7 7 0 0 1 0 12" />
      <Path fill="none" stroke={colors.ink2} strokeWidth={1.5} strokeLinecap="round" opacity={0.45} d="M28 20c-2-2 2-4 0-6M36 20c-2-2 2-4 0-6" />
    </Svg>
  );
}

/** Bowl illustration (ill-bowl). */
export function IllBowl({ size = 48 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Ellipse fill={colors.sand} cx={32} cy={50} rx={18} ry={4} />
      <Path fill={colors.cream} d="M15 33a17 13 0 0 0 34 0z" />
      <Ellipse fill={colors.amber} cx={32} cy={33} rx={15} ry={4.6} />
      <Circle fill={colors.clay} cx={28} cy={32} r={1.7} />
      <Circle fill={colors.clay} cx={36} cy={33} r={1.5} />
      <Circle fill={colors.green} cx={32} cy={31.5} r={1.6} />
      <Path fill="none" stroke={colors.green} strokeWidth={2.6} strokeLinecap="round" d="M40 22l-6 9" />
      <Ellipse fill={colors.green} cx={41} cy={21} rx={3} ry={2} transform="rotate(35 41 21)" />
    </Svg>
  );
}

/** Recipe-detail hero illustration (ill-hero, 120x90). */
export function IllHero({ width = 174, height = 130 }: { width?: number; height?: number }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 120 90">
      <Ellipse fill={colors.cream} cx={60} cy={62} rx={46} ry={12} />
      <Ellipse fill={colors.sand} cx={60} cy={64} rx={46} ry={9} />
      <Circle fill={colors.amber} cx={44} cy={52} r={13} />
      <Circle fill={colors.amber2} cx={40} cy={50} r={1.4} />
      <Circle fill={colors.amber2} cx={47} cy={54} r={1.4} />
      <Circle fill={colors.amber2} cx={45} cy={49} r={1.2} />
      <Circle fill={colors.amber} cx={76} cy={52} r={13} />
      <Circle fill={colors.amber2} cx={72} cy={54} r={1.4} />
      <Circle fill={colors.amber2} cx={79} cy={50} r={1.4} />
      <Circle fill={colors.amber2} cx={77} cy={55} r={1.2} />
      <Circle fill={colors.amber} cx={60} cy={46} r={15} />
      <Circle fill={colors.amber2} cx={55} cy={44} r={1.5} />
      <Circle fill={colors.amber2} cx={64} cy={42} r={1.4} />
      <Circle fill={colors.amber2} cx={61} cy={49} r={1.6} />
      <Circle fill={colors.amber2} cx={66} cy={48} r={1.3} />
      <Ellipse fill={colors.green} cx={60} cy={30} rx={4} ry={2.6} />
      <Path fill="none" stroke={colors.green} strokeWidth={2.2} strokeLinecap="round" d="M92 40c-6 1-9 5-9 11" />
      <Ellipse fill={colors.green} cx={93} cy={39} rx={4} ry={2.4} transform="rotate(-30 93 39)" />
    </Svg>
  );
}

/** Category -> tile tint + illustration, per prototype (.ptile.s/.l/.m). */
export function categoryTint(category: string): string {
  if (category.startsWith('liq')) return colors.greenSoft;
  if (category.startsWith('semi')) return colors.claySoft;
  return colors.amberSoft;
}

export function CategoryIll({ category, size = 48 }: { category: string; size?: number }) {
  if (category.startsWith('liq')) return <IllCup size={size} />;
  if (category.startsWith('semi')) return <IllBowl size={size} />;
  return <IllLaddu size={size} />;
}
