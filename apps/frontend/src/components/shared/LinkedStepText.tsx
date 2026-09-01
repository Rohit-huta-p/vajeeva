/**
 * LinkedStepText
 *
 * Renders a cook-step string that may contain rich markup added by the admin:
 *   [[term]]   → underlined, tappable — opens Google search for that term
 *   **text**   → bold
 *   • sentence → bullet list item (line starting with "• ")
 *
 * Plain text (no markup) renders identically to a bare <Text>.
 *
 * Usage:
 *   <LinkedStepText text={step.text} style={s.text} linkColor={colors.amber} />
 */
import React from 'react';
import { View, Text, Linking } from 'react-native';

interface Props {
  text: string;
  /** Base text style (font, size, color, lineHeight, etc.) */
  style: object | object[];
  /** Colour for tappable [[search link]] spans. Defaults to #E8B44A (amber). */
  linkColor?: string;
}

/**
 * Parse a single line of text for [[links]] and **bold** — returns an array
 * of plain strings and inline <Text> nodes suitable for nesting inside a <Text>.
 * Inherits the parent Text's base style; only overrides the delta (bold / color).
 */
function parseInline(text: string, linkColor: string): React.ReactNode[] {
  // Split on **bold** and [[link]] tokens — odd indices are matched tokens.
  const parts = text.split(/(\*\*[^*]+\*\*|\[\[.+?\]\])/g);

  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <Text key={i} style={{ fontWeight: '700' }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith('[[') && part.endsWith(']]')) {
      const term = part.slice(2, -2);
      return (
        <Text
          key={i}
          style={{ textDecorationLine: 'underline', color: linkColor }}
          onPress={() =>
            Linking.openURL(
              `https://www.google.com/search?q=${encodeURIComponent(term)}`,
            )
          }
        >
          {term}
        </Text>
      );
    }
    return part; // plain string — no wrapper needed
  });
}

export function LinkedStepText({ text, style, linkColor = '#E8B44A' }: Props) {
  const lines = text.split('\n').filter(l => l !== '');
  const hasBullets = lines.some(l => l.startsWith('• '));
  const hasInline  = /\*\*[^*]+\*\*|\[\[.+?\]\]/.test(text);

  // ── Fast path: completely plain single line ───────────────────────────────
  if (!hasBullets && !hasInline) {
    return <Text style={style}>{text}</Text>;
  }

  // ── Inline markup only, no bullets ───────────────────────────────────────
  if (!hasBullets) {
    return <Text style={style}>{parseInline(text, linkColor)}</Text>;
  }

  // ── Mix of plain lines and bullet lines ──────────────────────────────────
  return (
    <View>
      {lines.map((line, i) => {
        const prev = lines[i - 1];
        // Add a small gap when transitioning from plain text into a bullet block
        const topGap = line.startsWith('• ') && prev && !prev.startsWith('• ') ? 4 : 0;

        if (line.startsWith('• ')) {
          return (
            <View
              key={i}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                marginTop: topGap,
                marginBottom: 3,
                paddingLeft: 4,   // indent the whole bullet row
              }}
            >
              {/* Bullet dot */}
              <Text style={[style, { marginRight: 6, lineHeight: undefined }]}>•</Text>
              <Text style={[style, { flex: 1 }]}>
                {parseInline(line.slice(2), linkColor)}
              </Text>
            </View>
          );
        }

        // Non-bullet line — small gap after a bullet block
        const bottomGap = prev?.startsWith('• ') ? 4 : 0;
        return (
          <Text key={i} style={[style, { marginTop: bottomGap }]}>
            {parseInline(line, linkColor)}
          </Text>
        );
      })}
    </View>
  );
}
