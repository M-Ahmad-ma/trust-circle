import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { absoluteUrl } from '@/api/session';
import type { ExperienceCard, WirePlace } from '@/api/types';
import { Stars } from '@/components/Stars';

function distanceLabel(distanceM?: number): string | null {
  if (typeof distanceM !== 'number') return null;
  return distanceM < 1000 ? `${Math.round(distanceM)} m` : `${(distanceM / 1000).toFixed(1)} km`;
}

/**
 * Same-kind places first, then the nearest. The server owns that ordering; this
 * only renders what it decided, so "related" cannot drift into a second,
 * client-side definition.
 */
export function RelatedPlacesRail({ places }: { places: WirePlace[] }) {
  if (places.length === 0) return null;

  return (
    <View className="mt-8">
      <View className="px-4">
        <Text className="font-display-semibold text-[18px] text-ink-900">Related places</Text>
        <Text className="mt-1 font-body text-[11.5px] leading-[17px] text-ink-400">
          The same kind of place, close by.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-3 grow-0"
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {places.map((place) => {
          const uri = absoluteUrl(place.coverPhoto);
          const distance = distanceLabel(place.distanceM);

          return (
            <Pressable
              key={place.id}
              onPress={() => router.push(`/place/${place.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${place.name}`}
              className="w-[168px] overflow-hidden rounded-card border border-hairline bg-paper-50 active:opacity-70">
              <View className="bg-surface" style={{ height: 92 }}>
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <MaterialCommunityIcons name="map-marker-outline" size={22} color="#b8a37c" />
                  </View>
                )}
              </View>

              <View className="p-3">
                <Text
                  numberOfLines={2}
                  className="font-body-semibold text-[13px] leading-[17px] text-ink-900">
                  {place.name}
                </Text>
                <Text numberOfLines={1} className="mt-1 font-body text-[10.5px] text-ink-400">
                  {place.category ?? 'Place'}
                  {place.city ? ` · ${place.city}` : ''}
                </Text>
                {distance && (
                  <Text className="mt-1.5 font-body-semibold text-[9.5px] uppercase tracking-widest text-primary-600">
                    {distance} away
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

/**
 * An experience is related when it was written about a nearby place — the
 * server ranks the anchor place's category first, then distance. `showPlace`
 * matters here: away from the place screen, the place name is the reason the
 * row is in the list at all.
 */
export function RelatedExperiences({
  title,
  subtitle,
  experiences,
  showPlace = false,
}: {
  title: string;
  subtitle?: string;
  experiences: ExperienceCard[];
  showPlace?: boolean;
}) {
  if (experiences.length === 0) return null;

  return (
    <View className="mt-8">
      <View className="px-4">
        <Text className="font-display-semibold text-[18px] text-ink-900">{title}</Text>
        {subtitle ? (
          <Text className="mt-1 font-body text-[11.5px] leading-[17px] text-ink-400">
            {subtitle}
          </Text>
        ) : null}
      </View>

      <ScrollView horizontal className="mt-3  px-4">
        {experiences.map((experience) => {
          const photo = experience.photos[0];
          const uri = photo ? absoluteUrl(photo.url) : null;

          return (
            <Pressable
              key={experience.id}
              onPress={() => router.push(`/experience/${experience.id}`)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${experience.reviewer.name}'s experience`}
              className="flex-row gap-3 mr-2 rounded-card border border-hairline bg-paper-50 p-3 active:opacity-70">
              <View className="h-[74px] w-[74px] overflow-hidden rounded-[10px] bg-surface">
                {uri ? (
                  <Image
                    source={{ uri }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View className="flex-1 items-center justify-center">
                    <MaterialCommunityIcons name="notebook-outline" size={20} color="#b8a37c" />
                  </View>
                )}
              </View>

              <View className="flex-1">
                {showPlace && (
                  <Text
                    numberOfLines={1}
                    className="font-body-semibold text-[9px] uppercase tracking-widest text-primary-600">
                    {experience.place.name}
                  </Text>
                )}
                <View className={`flex-row items-center gap-2 ${showPlace ? 'mt-1' : ''}`}>
                  <Text
                    numberOfLines={1}
                    className="flex-1 font-body-semibold text-[12.5px] text-ink-900">
                    {experience.reviewer.name}
                  </Text>
                  <Stars rating={experience.rating} size={10} gap={1} />
                </View>
                <Text
                  numberOfLines={2}
                  className="mt-1.5 font-body text-[11.5px] leading-[17px] text-ink-500">
                  {experience.review}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
