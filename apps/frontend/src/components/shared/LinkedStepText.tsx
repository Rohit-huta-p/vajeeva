/**
 * LinkedStepText
 *
 * Renders a cook-step string that may contain [[term]] markup added by the admin.
 * Each [[term]] becomes an underlined, tappable span that opens a Google search
 * for that term in the device's default browser.
 *
 * Usage:
 *   <LinkedStepText text={step.text} style={s.text} linkColor={colors.amber} />
 *
 * Plain text (no [[...]]) renders identically to a bare <Text>.
 */
import React from 'react';
import { Text, Linking } from 'react-native';

interface Props {
  text: string;
  /** Base text style (font, size, color, lineHeight, etc.) */
  style: object | object[];
  /** Colour for the tappable link spans. Defaults to '#E8B44A' (amber). */
  linkColor?: string;
}

export function LinkedStepText({ text, style, linkColor = '#E8B44A' }: Props) {
  // Split on [[...]] — odd-indexed parts are the link terms.
  const parts = text.split(/\[\[(.+?)\]\]/g);

  if (parts.length === 1) {
    // No [[...]] in text — fast path, identical to a plain <Text>.
    return <Text style={style}>{text}</Text>;
  }

  return (
    <Text style={style}>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <Text
            key={i}
            style={[style, { textDecorationLine: 'underline', color: linkColor }]}
            onPress={() =>
              Linking.openURL(
                `https://www.google.com/search?q=${encodeURIComponent(part)}`,
              )
            }
          >
            {part}
          </Text>
        ) : (
          part
        ),
      )}
    </Text>
  );
}
