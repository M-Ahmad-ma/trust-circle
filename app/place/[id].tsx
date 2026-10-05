import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ScrollView, Share, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CircleVisitedCard } from '@/components/place/CircleVisitedCard';
import { ExperienceCarousel } from '@/components/place/ExperienceCarousel';
import { ExperienceSignalsSection } from '@/components/place/ExperienceSignalsSection';
import { HeroCarousel } from '@/components/place/HeroCarousel';
import { actionBarHeight, PlaceActionBar } from '@/components/place/PlaceActionBar';
import { PlaceHeading } from '@/components/place/PlaceHeading';
import { members, placeCopy, places, signalLabels, viewer } from '@/data';
import { photo } from '@/theme/photoMap';
import type { Member } from '@/types';

export default function PlaceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [saved, setSaved] = useState(false);

  const place = useMemo(() => places.find((candidate) => candidate.id === id), [id]);

  const circle = useMemo(() => {
    if (!place) return [] as Member[];
    const byId = new Map(members.map((member) => [member.id, member]));
    return place.visitedBy
      .map((memberId) => byId.get(memberId))
      .filter((member): member is Member => member !== undefined);
  }, [place]);

  const authors = useMemo(() => {
    const map: Record<string, Member> = {};
    for (const member of members) map[member.id] = member;
    return map;
  }, []);

  const photos = useMemo(() => {
    const map: Record<string, ReturnType<typeof photo>> = {};
    for (const candidate of places) {
      for (const key of candidate.experiences.map((experience) => experience.photo)) {
        map[key] = photo(key);
      }
    }
    return map;
  }, []);

  if (!place) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-paper-100 px-8">
        <StatusBar style="dark" />
        <Text className="text-center font-display text-[20px] text-ink-800">
          We could not find that place.
        </Text>
        <Text className="text-center font-body text-[12px] text-ink-400">
          It may have been removed, or the link is out of date.
        </Text>
      </View>
    );
  }

  const heroHeight = Math.round(Math.min(300, width * 0.82));

  return (
    <View className="flex-1 bg-paper-100">
      <StatusBar style="light" />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: actionBarHeight(insets.bottom) }}>
        <HeroCarousel
          photos={place.photos.map((key) => photo(key))}
          height={heroHeight}
          topInset={insets.top}
          saved={saved}
          onToggleSave={() => setSaved((value) => !value)}
          onShare={() =>
            Share.share({
              title: place.name,
              message: `${place.name} — ${place.categoryLabel} in ${viewer.city}\n${place.address}`,
            })
          }
          onBack={() => router.back()}
        />

        <PlaceHeading
          name={place.name}
          categoryLabel={place.categoryLabel}
          city={viewer.city}
          openNow={place.openNow}
          closesAt={place.closesAt}
          rating={place.rating}
          reviews={place.reviews}
          address={place.address}
        />

        {circle.length > 0 && (
          <CircleVisitedCard
            people={circle}
            eyebrow={placeCopy.peopleYouKnow}
            visitedRecently={placeCopy.visitedRecently}
            ctaLabel={placeCopy.seeTheirReviews}
            onPress={() => {}}
          />
        )}

        {place.experiences.length > 0 && (
          <>
            <ExperienceCarousel
              experiences={place.experiences}
              authors={authors}
              photos={photos}
              title={placeCopy.experiences}
              seeAllLabel={placeCopy.seeAll}
              circleLabel={placeCopy.yourCircle}
              onSeeAll={() => {}}
              onOpenExperience={() => {}}
            />

            <ExperienceSignalsSection
              experiences={place.experiences}
              labels={signalLabels}
              note={placeCopy.signalsNote}
              title={placeCopy.experienceDetails}
            />
          </>
        )}

        <View className="h-6" />
      </ScrollView>

      <PlaceActionBar
        writeLabel={placeCopy.writeYourExperience}
        saveLabel={placeCopy.savePlace}
        savedLabel={placeCopy.saved}
        saved={saved}
        bottomInset={insets.bottom}
        onWrite={() => router.push(`/write?placeId=${place.id}`)}
        onToggleSave={() => setSaved((value) => !value)}
      />
    </View>
  );
}
