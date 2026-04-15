<script lang="ts">
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { getSharedTrip, type SharedTripSnapshot } from '$lib/firebase/firestore';
  import type { Activity, Section } from '$lib/types';

  const shareId = $derived(($page.params as Record<string, string>)['shareId'] ?? '');

  let snapshot = $state<SharedTripSnapshot | null>(null);
  let loading  = $state(true);
  let notFound = $state(false);

  onMount(async () => {
    try {
      const data = await getSharedTrip(shareId);
      if (!data) { notFound = true; }
      else { snapshot = data; }
    } catch {
      notFound = true;
    } finally {
      loading = false;
    }
  });

  // Groepeer activiteiten per dag en sectie
  function activitiesFor(dayId: string, section: Section): Activity[] {
    return (snapshot?.activities ?? [])
      .filter((a) => a.dayId === dayId && a.section === section)
      .sort((a, b) => a.order - b.order);
  }

  const sections: { key: Section; label: string }[] = [
    { key: 'morning',   label: 'ochtend' },
    { key: 'afternoon', label: 'middag'  },
    { key: 'evening',   label: 'avond'   },
  ];

  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', {
      weekday: 'long', day: 'numeric', month: 'long'
    });
  }
</script>

<svelte:head>
  <title>{snapshot ? `${snapshot.trip.name} – gedeeld` : 'Roamly'}</title>
</svelte:head>

<div class="min-h-screen" style="background-color: #fafaf8; font-family: 'Inter', system-ui, sans-serif;">

  {#if loading}
    <div class="flex items-center justify-center min-h-screen" style="color: #a09e98;">
      <span class="text-sm">Laden…</span>
    </div>

  {:else if notFound || !snapshot}
    <div class="flex flex-col items-center justify-center min-h-screen gap-3 px-6 text-center">
      <span style="font-size: 2rem;">🗺️</span>
      <p class="text-sm font-medium" style="color: #1a1917;">Planning niet gevonden</p>
      <p class="text-xs" style="color: #a09e98;">Deze link is verlopen of bestaat niet meer.</p>
      <a href="/" class="text-xs mt-2" style="color: #0d9488;">← Naar Roamly</a>
    </div>

  {:else}
    <!-- Header -->
    <header style="background-color: rgba(250,250,248,0.95); backdrop-filter: blur(8px); border-bottom: 1px solid #e8e6e0; position: sticky; top: 0; z-index: 30;">
      <div class="max-w-2xl mx-auto px-4 flex items-center justify-between" style="height: 56px;">
        <div class="flex items-center gap-2">
          <span>{snapshot.trip.coverEmoji ?? '✈️'}</span>
          <span class="text-sm font-semibold" style="color: #1a1917;">{snapshot.trip.name}</span>
        </div>
        <div class="flex items-center gap-2">
          <span
            class="text-xs px-2.5 py-1 rounded-full"
            style="background-color: {snapshot.canEdit ? '#fef9f0' : '#f4f3ef'};
                   color: {snapshot.canEdit ? '#b45309' : '#8b8a84'};
                   border: 1px solid {snapshot.canEdit ? '#fde68a' : '#e8e6e0'};"
          >
            {snapshot.canEdit ? '✏️ bewerken' : '👁 alleen lezen'}
          </span>
          <span class="text-xs" style="color: #a09e98;">door {snapshot.ownerName}</span>
        </div>
      </div>
    </header>

    <!-- Dagen -->
    <main class="max-w-2xl mx-auto px-4 py-8 space-y-8">
      {#each snapshot.days as day}
        {@const hasSomething = sections.some((s) => activitiesFor(day.id, s.key).length > 0)}
        {#if hasSomething}
          <div>
            <h2 class="text-xs font-semibold mb-3 uppercase tracking-wider" style="color: #a09e98; letter-spacing: 0.08em;">
              {formatDate(day.date)}
            </h2>

            <div class="space-y-4">
              {#each sections as { key, label }}
                {@const acts = activitiesFor(day.id, key)}
                {#if acts.length > 0}
                  <div>
                    <p class="text-xs mb-1.5" style="color: #c4c1bb; font-weight: 500;">{label}</p>
                    <div class="space-y-1.5">
                      {#each acts as activity}
                        <div
                          class="rounded-2xl px-4 py-3"
                          style="background-color: white; border: 1px solid #ece9e4;"
                        >
                          <div class="flex items-baseline justify-between gap-3">
                            <span class="text-sm font-medium" style="color: #1a1917;">{activity.title}</span>
                            {#if activity.time}
                              <span class="text-xs font-medium tabular-nums flex-shrink-0" style="color: #0d9488;">{activity.time}</span>
                            {/if}
                          </div>
                          {#if activity.location}
                            <p class="text-xs mt-0.5" style="color: #a09e98;">{activity.location}</p>
                          {/if}
                          {#if activity.notes}
                            <p class="text-xs mt-1 leading-relaxed" style="color: #8b8a84;">{activity.notes}</p>
                          {/if}
                        </div>
                      {/each}
                    </div>
                  </div>
                {/if}
              {/each}
            </div>
          </div>
        {/if}
      {/each}

      <p class="text-xs text-center pt-4" style="color: #c4c1bb;">
        Gemaakt met <a href="/" style="color: #0d9488;">Roamly</a>
      </p>
    </main>
  {/if}
</div>
