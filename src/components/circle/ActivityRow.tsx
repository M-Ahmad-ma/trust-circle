import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ImageSourcePropType } from 'react-native';
import { Image, Text, View } from 'react-native';

import type { ActivityTone, Member } from '@/types';

const BADGE = 34;
const THUMB = 52;

/** Per-row accent, mirroring the design where each activity carries its own tone. */
const TONES: Record<ActivityTone, { badge: string; accent: string }> = {
  berry: { badge: '#a63039', accent: '#a63039' },
  gold: { badge: '#c6821e', accent: '#a06c22' },
  rose: { badge: '#bc7c80', accent: '#9b3f45' },
  sand: { badge: '#d9c8a8', accent: '#8a7a58' },
};

export type ActivityRowProps = {
  member: Member | undefined;
  verb: string;
  placeName: string;
  headline: string;
  time: string;
  quote: string;
  tone: ActivityTone;
  icon: string;
  photo?: ImageSourcePropType;
};

export function ActivityRow({
  member,
  verb,
  placeName,
  headline,
  time,
  quote,
  tone,
  icon,
  photo,
}: ActivityRowProps) {
  const { badge, accent } = TONES[tone];

  return (
    <View className="flex-row gap-3 px-4 py-4">
      <View
        className="items-center justify-center rounded-pill"
        style={{ width: BADGE, height: BADGE, backgroundColor: badge }}>
        <MaterialCommunityIcons
          name={icon as never}
          size={17}
          color={tone === 'sand' ? '#4a423b' : '#fdfaf4'}
        />
      </View>

      <View className="flex-1">
        <Text numberOfLines={1} className="font-body text-[12.5px] text-ink-700">
          <Text className="font-body-bold text-ink-800">{member?.name ?? 'Someone'}</Text>
          <Text className="text-ink-700"> {verb} </Text>
          {placeName.length > 0 && (
            <Text className="font-body-semibold text-ink-800">{placeName}</Text>
          )}
        </Text>

        <View className="mt-1.5 flex-row items-center">
          <View className="h-1.5 w-1.5 rounded-pill" style={{ backgroundColor: accent }} />
          <Text
            numberOfLines={1}
            className="ml-1.5 flex-1 font-body text-[11px]"
            style={{ color: accent }}>
            {headline}
          </Text>
          <Text className="font-body text-[11px] text-ink-400"> · {time}</Text>
        </View>

        <Text numberOfLines={1} className="mt-1.5 font-body text-[11px] text-ink-400">
          {quote}
        </Text>
      </View>

      {photo && (
        <Image
          source={photo}
          style={{ width: THUMB, height: THUMB, borderRadius: 8 }}
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
      )}
    </View>
  );
}
