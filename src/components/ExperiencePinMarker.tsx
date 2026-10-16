import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import type { ExperienceCard } from '@/api/types';
import { Avatar } from '@/components/Avatar';
import { relationshipStyle } from '@/theme/relationship';

type ExperiencePinMarkerProps = {
  experience: ExperienceCard;
  selected: boolean;
  onPress: (id: string) => void;
};

const BRASS = '#de9a34';

/**
 * README §9 — an experience pin is a *person's* pin. The disc is the reviewer's
 * face (or their monogram, which is the common case: most people have no avatar),
 * because "who said this" is the question a map of reviews exists to answer. The
 * rating rides as a small badge rather than the disc's content, so it stays
 * legible at city zoom without displacing the face.
 *
 * The ring is the *server-computed* relationship for this viewer, never the
 * author's stored visibility — the same review is red to a direct friend and
 * yellow to a stranger, and the client cannot derive that. A 1-star review from
 * your Circle is still red, because the colour encodes proximity, not quality.
 * That is why the ring is kept rather than replaced by the avatar.
 */
export function ExperiencePinMarker({ experience, selected, onPress }: ExperiencePinMarkerProps) {
  const style = relationshipStyle(experience.relationship.type);

  const disc = selected ? 50 : 38;
  const ringWidth = selected ? 3 : 2;
  const inner = disc - ringWidth * 2;

  const label = `${experience.reviewer.name} rated ${experience.place.name} ${experience.rating} out of 5, ${experience.relationship.label}`;

  return (
    <View style={{ width: disc, height: disc }}>
      <Pressable
        onPress={() => onPress(experience.id)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected }}
        style={{
          width: disc,
          height: disc,
          borderRadius: disc / 2,
          backgroundColor: style.wash,
          borderWidth: ringWidth,
          borderColor: style.color,
          alignItems: 'center',
          justifyContent: 'center',
          shadowColor: '#1c1815',
          shadowOpacity: selected ? 0.28 : 0.14,
          shadowRadius: selected ? 10 : 5,
          shadowOffset: { width: 0, height: selected ? 4 : 2 },
          elevation: selected ? 6 : 2,
        }}>
        {/* Fills the inner box so the face sits flush inside the relationship
            ring without covering it — the same treatment PinMarker gives a
            place's cover photo. */}
        <Avatar user={experience.reviewer} size={inner} />

        {/* Rating badge. Brass and paper rather than the relationship colour:
            the ring already speaks for proximity, and two competing colours on a
            38px disc turn into noise. */}
        <View
          className="absolute flex-row items-center rounded-pill border border-sand-300 bg-paper-50"
          style={{
            right: -2,
            bottom: -2,
            gap: 1,
            paddingHorizontal: selected ? 4 : 3,
            paddingVertical: selected ? 1.5 : 1,
          }}>
          <MaterialCommunityIcons name="star" size={selected ? 9 : 8} color={BRASS} />
          <Text
            className="font-body-bold"
            style={{
              fontSize: selected ? 10 : 8.5,
              lineHeight: selected ? 12 : 10,
              color: '#4a423b',
            }}>
            {experience.rating}
          </Text>
        </View>
      </Pressable>

      {/* Nameplate for the selected review — the only moment the map names a
          person, so it stays out of the way until a pin is actually chosen. */}
      {selected && (
        <View className="absolute items-center" style={{ top: disc + 7, left: -70, width: 180 }}>
          <View className="rounded-pill px-3 py-1" style={{ backgroundColor: style.color }}>
            <Text numberOfLines={1} className="font-body-semibold text-[11px] text-paper-50">
              {experience.reviewer.name} · {experience.place.name}
            </Text>
          </View>
          <View
            className="absolute -top-1 h-2 w-2 rotate-45"
            style={{ alignSelf: 'center', backgroundColor: style.color }}
          />
        </View>
      )}
    </View>
  );
}
