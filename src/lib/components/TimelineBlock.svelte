<script lang="ts">
  import type { Location, Day } from '$lib/types';
  import { goto } from '$app/navigation';

  let {
    location,
    days,
    isActive = false
  }: {
    location: Location;
    days: Day[];
    isActive?: boolean;
  } = $props();

  function formatDate(dateStr: string) {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  const dayCount = $derived(() => {
    const start = new Date(location.startDate + 'T00:00:00');
    const end = new Date(location.endDate + 'T00:00:00');
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  });

  function openFirstDay() {
    if (days.length > 0) goto(`/day/${days[0].id}`);
  }

  const colorStyles: Record<string, string> = {
    'bg-teal-100':  'background: linear-gradient(135deg, #f0fdfa, #ccfbf1); border-color: #99f6e4;',
    'bg-blue-100':  'background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #bfdbfe;',
    'bg-amber-100': 'background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fde68a;',
    'bg-rose-100':  'background: linear-gradient(135deg, #fff1f2, #ffe4e6); border-color: #fecdd3;',
  };

  const gradStyle = $derived(colorStyles[location.color] ?? 'background: #f4f3ef; border-color: #e8e6e0;');
</script>

<button
  onclick={openFirstDay}
  class="group relative flex flex-col items-start gap-3 p-5 rounded-3xl border-2 transition-all duration-200
         hover:shadow-md hover:-translate-y-0.5 text-left w-full sm:w-48 flex-shrink-0"
  style="{gradStyle} {isActive ? 'outline: 2px solid #14b8a6; outline-offset: 2px;' : ''}"
>
  <span class="text-3xl leading-none">{location.emoji}</span>

  <div class="space-y-1">
    <p class="font-semibold text-base leading-snug" style="color: #2a2926;">{location.name}</p>
    <p class="text-xs" style="color: #8b8a84;">{location.country}</p>
  </div>

  <div class="mt-auto w-full">
    <p class="text-xs font-medium" style="color: #57564f;">
      {formatDate(location.startDate)} – {formatDate(location.endDate)}
    </p>
    <p class="text-xs mt-0.5" style="color: #8b8a84;">
      {dayCount()} {dayCount() === 1 ? 'day' : 'days'} · {days.length} planned
    </p>
  </div>

  <!-- Chevron -->
  <div class="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity" style="color: #8b8a84;">
    <svg class="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
      <path d="M6 3l5 5-5 5"/>
    </svg>
  </div>

  <!-- Day pills -->
  {#if days.length > 0}
    <div class="flex flex-wrap gap-1">
      {#each days.slice(0, 5) as day}
        <span class="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style="background-color: rgba(255,255,255,0.7); color: #57564f;">
          {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
        </span>
      {/each}
      {#if days.length > 5}
        <span class="text-[10px] px-1.5 py-0.5 rounded-full" style="background-color: rgba(255,255,255,0.7); color: #57564f;">+{days.length - 5}</span>
      {/if}
    </div>
  {/if}
</button>
