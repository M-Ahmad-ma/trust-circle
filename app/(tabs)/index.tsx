import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { CategoryRail } from '@/components/CategoryRail';
import { ExploreHeader } from '@/components/ExploreHeader';
import { ExploreMap } from '@/components/ExploreMap';
import { PlaceDetailCard } from '@/components/PlaceDetailCard';
import { PlaceList } from '@/components/PlaceList';
import { Screen } from '@/components/Screen';
import { SearchField } from '@/components/SearchField';
import { ViewModeToggle } from '@/components/ViewModeToggle';
import { categories, defaultPlaceId, greeting, members, places, searchPlaceholder } from '@/data';
import type { Member, ViewMode } from '@/types';

const memberById = new Map(members.map((member) => [member.id, member]));

function peopleFor(ids: string[]): Member[] {
  return ids
    .map((id) => memberById.get(id))
    .filter((member): member is Member => member !== undefined);
}

export default function ExploreScreen() {
  const [category, setCategory] = useState('all');
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<ViewMode>('map');
  const [selectedId, setSelectedId] = useState(defaultPlaceId);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return places.filter((place) => {
      const inCategory = category === 'all' || place.category === category;
      const inQuery =
        needle === '' ||
        place.name.toLowerCase().includes(needle) ||
        place.neighbourhood.toLowerCase().includes(needle) ||
        place.categoryLabel.toLowerCase().includes(needle);

      return inCategory && inQuery;
    });
  }, [category, query]);

  const selected = visible.find((place) => place.id === selectedId) ?? visible[0];

  const resolvedVisible = useMemo(
    () => visible.map((place) => ({ ...place, visitedBy: peopleFor(place.visitedBy) })),
    [visible]
  );

  return (
    <Screen className="bg-paper-100" edges={['top']}>
      <ExploreHeader
        eyebrow={greeting.eyebrow}
        title={greeting.title}
        onOpenAlerts={() => {}}
        unreadAlerts={3}
      />

      <SearchField
        value={query}
        placeholder={searchPlaceholder}
        onChange={setQuery}
        onOpenFilters={() => {}}
      />

      <CategoryRail categories={categories} selectedId={category} onSelect={setCategory} />

      <View className="relative mt-4 flex-1 overflow-hidden">
        {mode === 'map' ? (
          <ExploreMap places={visible} selectedId={selected?.id ?? ''} onSelect={setSelectedId} />
        ) : (
          <PlaceList
            places={resolvedVisible}
            selectedId={selected?.id ?? ''}
            onSelect={setSelectedId}
            emptyMessage="Nothing your circle has been to, here yet."
          />
        )}

        <ViewModeToggle mode={mode} onModeChange={setMode} />
      </View>

      {selected && (
        <PlaceDetailCard
          place={{
            ...selected,
            visitedBy: peopleFor(selected.visitedBy),
          }}
          onViewPlace={() => router.push(`/place/${selected.id}`)}
        />
      )}
    </Screen>
  );
}
