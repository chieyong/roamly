<script lang="ts">
  import { goto } from '$app/navigation';
  import { trip, daysByLocation } from '$lib/stores/trip';
  import MaybeList from '$lib/components/MaybeList.svelte';

  const tripDuration = $derived(() => {
    const start = new Date($trip.startDate + 'T00:00:00');
    const end = new Date($trip.endDate + 'T00:00:00');
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  });

  function formatDateFull(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
    });
  }

  function formatDateShort(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { month: 'short', day: 'numeric' });
  }

  // Each location block height = dayCount × PX_PER_DAY, with a minimum
  const PX_PER_DAY = 52;
  const MIN_HEIGHT = 80;

  function blockHeight(dayCount: number) {
    return Math.max(MIN_HEIGHT, dayCount * PX_PER_DAY);
  }

  const colorBg: Record<string, string> = {
    'bg-teal-100':  'background: linear-gradient(135deg, #f0fdfa, #ccfbf1); border-color: #5eead4;',
    'bg-blue-100':  'background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #93c5fd;',
    'bg-amber-100': 'background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fcd34d;',
    'bg-rose-100':  'background: linear-gradient(135deg, #fff1f2, #ffe4e6); border-color: #fca5a5;',
  };

  function colorStyle(key: string) {
    return colorBg[key] ?? 'background: #f4f3ef; border-color: #d4d1c8;';
  }
</script>

<!-- Hero -->
<div class="mb-8">
  <p class="text-xs font-semibold uppercase tracking-widest mb-2" style="color: #14b8a6; letter-spacing: 0.12em;">Your journey</p>
  <h1 class="text-3xl font-bold" style="color: #1a1917; letter-spacing: -0.02em;">{$trip.name}</h1>
  <div class="flex items-center gap-3 flex-wrap mt-2">
    <p class="text-sm" style="color: #57564f;">
      {formatDateFull($trip.startDate)} → {formatDateFull($trip.endDate)}
    </p>
    <span class="px-2.5 py-0.5 rounded-full text-xs font-medium" style="background-color: #f0fdfa; color: #0d9488;">
      {tripDuration()} days
    </span>
  </div>
</div>

<!-- Vertical proportional timeline -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div class="lg:col-span-2">
    <h2 class="text-xs font-semibold uppercase tracking-widest mb-5" style="color: #8b8a84; letter-spacing: 0.12em;">
      Destinations
    </h2>

    <div class="flex gap-0">
      <!-- Timeline spine -->
      <div class="flex flex-col items-center mr-4 flex-shrink-0" style="width: 20px;">
        {#each $daysByLocation as { location, days }, i}
          {@const h = blockHeight(days.length)}
          <div class="flex flex-col items-center" style="height: {h}px;">
            <!-- Dot -->
            <div
              class="w-3 h-3 rounded-full flex-shrink-0 mt-5 z-10"
              style="background-color: #14b8a6; box-shadow: 0 0 0 3px #f0fdfa;"
            ></div>
            <!-- Line (not after last) -->
            {#if i < $daysByLocation.length - 1}
              <div class="flex-1 w-px mt-1" style="background-color: #d4d1c8;"></div>
            {/if}
          </div>
        {/each}
      </div>

      <!-- Location blocks -->
      <div class="flex-1 flex flex-col">
        {#each $daysByLocation as { location, days }, i}
          {@const h = blockHeight(days.length)}
          <button
            onclick={() => days.length > 0 && goto(`/day/${days[0].id}`)}
            class="group w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 hover:shadow-md hover:border-opacity-100"
            style="height: {h}px; {colorStyle(location.color)} margin-bottom: {i < $daysByLocation.length - 1 ? '0' : '0'};"
          >
            <div class="flex items-start justify-between h-full">
              <div class="flex gap-3 items-start">
                <span class="text-2xl leading-none mt-0.5 flex-shrink-0">{location.emoji}</span>
                <div>
                  <p class="font-semibold text-base leading-snug" style="color: #1a1917;">{location.name}</p>
                  <p class="text-xs mt-0.5" style="color: #8b8a84;">
                    {formatDateShort(location.startDate)} – {formatDateShort(location.endDate)}
                    <span class="mx-1">·</span>
                    {days.length} {days.length === 1 ? 'day' : 'days'}
                  </p>

                  <!-- Day pills — only show if enough height -->
                  {#if h >= 120}
                    <div class="flex flex-wrap gap-1 mt-3">
                      {#each days as day}
                        <a
                          href="/day/{day.id}"
                          onclick={(e) => e.stopPropagation()}
                          class="text-[11px] px-2 py-1 rounded-full font-medium transition-colors hover:opacity-80"
                          style="background-color: rgba(255,255,255,0.65); color: #57564f;"
                        >
                          {new Date(day.date + 'T00:00:00').toLocaleDateString('nl-NL', { weekday: 'short', day: 'numeric' })}
                        </a>
                      {/each}
                    </div>
                  {/if}
                </div>
              </div>

              <!-- Chevron -->
              <div class="opacity-0 group-hover:opacity-100 transition-opacity mt-1 flex-shrink-0 ml-2" style="color: #8b8a84;">
                <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M6 3l5 5-5 5"/>
                </svg>
              </div>
            </div>
          </button>

          <!-- Gap between blocks, visually connecting to spine -->
          {#if i < $daysByLocation.length - 1}
            <div style="height: 0;"></div>
          {/if}
        {/each}
      </div>
    </div>
  </div>

  <!-- Sidebar: Maybe list -->
  <div class="lg:col-span-1">
    <div class="sticky" style="top: 80px;">
      <MaybeList />
    </div>
  </div>
</div>
