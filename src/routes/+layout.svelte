<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { trip } from '$lib/stores/trip';
  import { goto } from '$app/navigation';

  let { children } = $props();
</script>

<svelte:head>
  <title>Roamly – {$trip.name}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
</svelte:head>

<div class="min-h-screen" style="background-color: #fafaf8; font-family: 'Inter', system-ui, sans-serif;">
  <!-- Top nav -->
  <header class="sticky top-0 z-30" style="background-color: rgba(250,250,248,0.85); backdrop-filter: blur(8px); border-bottom: 1px solid #e8e6e0;">
    <div class="max-w-5xl mx-auto px-6 flex items-center justify-between" style="height: 56px;">
      <button
        onclick={() => goto('/')}
        class="flex items-center gap-2 transition-opacity hover:opacity-70"
      >
        <span style="font-size: 1.25rem;">{$trip.coverEmoji ?? '✈️'}</span>
        <span style="font-weight: 600; font-size: 0.875rem; color: #2a2926;">{$trip.name}</span>
      </button>

      <div class="flex items-center gap-4">
        <span style="font-size: 0.75rem; color: #8b8a84;" class="hidden sm:block">
          {new Date($trip.startDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          –
          {new Date($trip.endDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>

        <a
          href="/"
          style="font-size: 0.75rem; padding: 6px 12px; border-radius: 12px; transition: all 0.15s;
                 {$page.url.pathname === '/' ? 'background-color: #ccfbf1; color: #0f766e; font-weight: 500;' : 'color: #8b8a84;'}"
        >Overview</a>
      </div>
    </div>
  </header>

  <main class="max-w-5xl mx-auto px-6 py-8">
    {@render children()}
  </main>
</div>
