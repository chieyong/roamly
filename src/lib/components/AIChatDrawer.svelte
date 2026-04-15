<script lang="ts">
  import type { Activity } from '$lib/types';
  import { canUseAi, incrementAiCall, aiQuotaRemaining, MAX_GUEST_CALLS } from '$lib/stores/aiQuota';
  import { signInWithGoogle } from '$lib/firebase/auth';
  import { user } from '$lib/stores/auth';

  let { activity, onClose }: { activity: Activity; onClose: () => void } = $props();

  type Message = { role: 'user' | 'assistant'; content: string };

  let messages = $state<Message[]>([]);
  let input    = $state('');
  let loading  = $state(false);
  let scrollEl = $state<HTMLElement | null>(null);
  let signingIn = $state(false);

  // Toon login-gate als het quotum op is en de gebruiker niet ingelogd is
  const showGate = $derived(!$user && $aiQuotaRemaining <= 0);

  // Stuur automatisch een openingstip zodra de drawer opent (mits quotum beschikbaar)
  $effect(() => {
    if (messages.length === 0 && !showGate) sendMessage(null);
  });

  // Scroll naar beneden bij nieuw bericht
  $effect(() => {
    void messages.length;
    if (scrollEl) setTimeout(() => scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' }), 50);
  });

  async function sendMessage(userText: string | null) {
    if (!canUseAi()) return;

    const text = userText ?? `Geef één tip voor: ${activity.title}${activity.location ? ` in ${activity.location}` : ''}`;
    if (userText) messages = [...messages, { role: 'user', content: userText }];
    input   = '';
    loading = true;
    incrementAiCall();

    try {
      const res = await fetch('/api/ai', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          activity,
          messages: [...messages, { role: 'user', content: text }],
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      messages = [...messages, { role: 'assistant', content: data.reply }];
    } catch {
      messages = [...messages, { role: 'assistant', content: 'Er is iets misgegaan. Probeer het opnieuw.' }];
    } finally {
      loading = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(); }
  }

  function submit() {
    const t = input.trim();
    if (!t || loading) return;
    sendMessage(t);
  }

  async function handleLogin() {
    signingIn = true;
    try { await signInWithGoogle(); }
    catch { /* popup gesloten */ }
    finally { signingIn = false; }
  }
</script>

<div
  class="rounded-b-2xl overflow-hidden flex flex-col"
  style="background-color: white; border: 1px solid #c4f1ea; border-top: none; max-height: 340px;"
>
  <!-- Header -->
  <div
    class="flex items-center justify-between px-4 py-2.5 flex-shrink-0"
    style="border-bottom: 1px solid #f0fdf9; background-color: #f8fffe;"
  >
    <span class="text-xs font-medium" style="color: #0d9488;">✦ AI-assistent — {activity.title}</span>
    <div class="flex items-center gap-2">
      {#if !$user}
        <span class="text-xs" style="color: #b0ada7;">{$aiQuotaRemaining}/{MAX_GUEST_CALLS} gratis</span>
      {/if}
      <button onclick={onClose} class="text-xs px-2 py-1 rounded-lg" style="color: #b0ada7;" aria-label="Sluiten">✕</button>
    </div>
  </div>

  {#if showGate}
    <!-- ── Login gate ─────────────────────────────────────────────────────── -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 py-8 gap-4 text-center">
      <span style="font-size: 1.5rem;">✦</span>
      <div>
        <p class="text-sm font-medium" style="color: #1a1917;">Je hebt {MAX_GUEST_CALLS} gratis vragen gebruikt</p>
        <p class="text-xs mt-1" style="color: #a09e98;">Log in voor onbeperkte AI-hulp bij je reisplanning</p>
      </div>
      <button
        onclick={handleLogin}
        disabled={signingIn}
        class="flex items-center gap-2 text-xs px-4 py-2.5 rounded-2xl font-medium transition-all"
        style="background-color: #1a1917; color: white; opacity: {signingIn ? '0.6' : '1'};"
      >
        {#if signingIn}
          Even wachten…
        {:else}
          <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Inloggen met Google
        {/if}
      </button>
    </div>

  {:else}
    <!-- ── Berichten ──────────────────────────────────────────────────────── -->
    <div bind:this={scrollEl} class="flex-1 overflow-y-auto px-4 py-3 space-y-3" style="min-height: 120px;">
      {#if loading && messages.length === 0}
        <div class="flex items-center gap-1.5 pt-1" style="color: #a09e98;">
          <span class="text-xs">Bezig met nadenken</span>
          <span class="flex gap-0.5">
            <span class="w-1 h-1 rounded-full bg-current animate-bounce" style="animation-delay: 0ms;"></span>
            <span class="w-1 h-1 rounded-full bg-current animate-bounce" style="animation-delay: 150ms;"></span>
            <span class="w-1 h-1 rounded-full bg-current animate-bounce" style="animation-delay: 300ms;"></span>
          </span>
        </div>
      {/if}

      {#each messages as msg}
        {#if msg.role === 'assistant'}
          <div class="flex gap-2 items-start">
            <span class="text-xs flex-shrink-0 mt-0.5" style="color: #0d9488;">✦</span>
            <p class="text-xs leading-relaxed flex-1" style="color: #2a2926;">{msg.content}</p>
          </div>
        {:else}
          <div class="flex justify-end">
            <span class="text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed"
              style="background-color: #f4f3ef; color: #57564f;">{msg.content}</span>
          </div>
        {/if}
      {/each}

      {#if loading && messages.length > 0}
        <div class="flex gap-2 items-center">
          <span class="text-xs flex-shrink-0" style="color: #0d9488;">✦</span>
          <span class="flex gap-0.5">
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background-color: #0d9488; animation-delay: 0ms;"></span>
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background-color: #0d9488; animation-delay: 150ms;"></span>
            <span class="w-1.5 h-1.5 rounded-full animate-bounce" style="background-color: #0d9488; animation-delay: 300ms;"></span>
          </span>
        </div>
      {/if}
    </div>

    <!-- ── Invoerregel ────────────────────────────────────────────────────── -->
    <div class="flex items-center gap-2 px-3 py-2.5 flex-shrink-0" style="border-top: 1px solid #f0fdf9;">
      <input
        bind:value={input}
        onkeydown={handleKeydown}
        disabled={loading}
        placeholder="Stel een vervolgvraag…"
        class="flex-1 text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors"
        style="background-color: #fafaf8; border-color: #e8e6e0; color: #1a1917; opacity: {loading ? '0.5' : '1'};"
      />
      <button
        onclick={submit}
        disabled={loading || !input.trim()}
        class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
        style="background-color: {input.trim() && !loading ? '#0d9488' : '#e8e6e0'};
               color: {input.trim() && !loading ? 'white' : '#b0ada7'};"
        aria-label="Versturen"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round" fill="none"/>
        </svg>
      </button>
    </div>
  {/if}
</div>
