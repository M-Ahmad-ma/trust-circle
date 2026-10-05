import { useMemo, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { ActivityRow } from '@/components/circle/ActivityRow';
import { CircleHeader } from '@/components/circle/CircleHeader';
import { CircleSearch } from '@/components/circle/CircleSearch';
import { PeopleRail } from '@/components/circle/PeopleRail';
import { Screen } from '@/components/Screen';
import { circleActivities, circleCopy, members } from '@/data';
import { photo } from '@/theme/photoMap';
import type { Member } from '@/types';

export default function CircleScreen() {
  const [query, setQuery] = useState('');

  const memberById = useMemo(() => {
    const map: Record<string, Member> = {};
    for (const member of members) map[member.id] = member;
    return map;
  }, []);

  const needle = query.trim().toLowerCase();

  const people = useMemo(() => {
    if (!needle) return members;
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(needle) || member.relation.toLowerCase().includes(needle)
    );
  }, [needle]);

  const activities = useMemo(() => {
    if (!needle) return circleActivities;
    return circleActivities.filter((activity) => {
      const member = memberById[activity.memberId];
      return (
        member?.name.toLowerCase().includes(needle) ||
        activity.placeName.toLowerCase().includes(needle) ||
        activity.verb.toLowerCase().includes(needle) ||
        activity.quote.toLowerCase().includes(needle)
      );
    });
  }, [needle, memberById]);

  return (
    <Screen className="bg-paper-50" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 28 }}>
        <CircleHeader
          eyebrow={circleCopy.eyebrow}
          title={circleCopy.title}
          subtitle={circleCopy.subtitle}
          inviteLabel={circleCopy.addPerson}
          onInvite={() => {}}
        />

        <View className="mx-4 mt-5 h-px bg-border" />

        <PeopleRail
          people={people}
          total={members.length}
          inCircleLabel={circleCopy.peopleInCircle}
          seeAllLabel={circleCopy.seeAll}
          onSeeAll={() => {}}
          onOpenPerson={() => {}}
        />

        <CircleSearch
          value={query}
          placeholder={circleCopy.searchPlaceholder}
          onChange={setQuery}
        />

        <View className="mt-7 px-4">
          <Text className="font-body-semibold text-2xs uppercase text-ink-400">
            {circleCopy.recentActivity}
          </Text>
        </View>

        {activities.length === 0 ? (
          <View className="items-center gap-1.5 px-8 py-14">
            <Text className="text-center font-display-semibold text-[16px] text-ink-700">
              Nobody matches “{query.trim()}”
            </Text>
            <Text className="text-center font-body text-[12px] text-ink-400">
              Try a first name, a relation, or a place.
            </Text>
          </View>
        ) : (
          <View className="mt-1">
            {activities.map((activity, index) => (
              <View key={activity.id}>
                {index > 0 && <View className="h-px bg-border" />}
                <ActivityRow
                  member={memberById[activity.memberId]}
                  verb={activity.verb}
                  placeName={activity.placeName}
                  headline={activity.headline}
                  time={activity.time}
                  quote={activity.quote}
                  tone={activity.tone}
                  icon={activity.icon}
                  photo={photo(activity.photo)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
