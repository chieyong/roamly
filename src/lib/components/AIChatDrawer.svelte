<script lang="ts">
  import type { Activity } from '$lib/types';

  let { activity, onClose }: { activity: Activity; onClose: () => void } = $props();

  type Message = { role: 'user' | 'assistant'; content: string };

  let messages  = $state<Message[]>([]);
  let input     = $state('');
  let loading   = $state(false);
  let scrollEl  = $state<HTMLElement | null>(null);

  // Auto-send an opening tip when the drawer mounts
  $effect(() => {
    if (messages.length === 0) sendMessage(null);
  });

  // Scroll to bottom whenever messages change
  $effect(() => {
    if (messages.length && scrollEl) {
      // Read messages.length to track the dependency
      void messages.length;
      setTimeout(() => scrollEl?.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' }), 50);
    }
  });

  async function sendMessage(userText: string | null) {
    // userText === null means auto-open tip (no user bubble shown)
    const text = userText ?? `Give me one key tip for: ${activity.title}`;
    if (userText) messages = [...messages, { role: 'user', content: userText }];
    input   = '';
    loading = true;

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
    } catch (e) {
      messages = [...messages, { role: 'assistant', content: 'Sorry, something went wrong. Try again.' }];
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
    <span class="text-xs font-medium" style="color: #0d9488;">✦ Ask AI about {activity.title}</span>
    <button
      onclick={onClose}
      class="text-xs px-2 py-1 rounded-lg transition-colors"
      style="color: #b0ada7;"
      aria-label="Close chat"
    >✕</button>
  </div>

  <!-- Messages -->
  <div
    bind:this={scrollEl}
    class="flex-1 overflow-y-auto px-4 py-3 space-y-3"
    style="min-height: 120px;"
  >
    {#if loading && messages.length === 0}
      <!-- Initial loading state -->
      <div class="flex items-center gap-1.5 pt-1" style="color: #a09e98;">
        <span class="text-xs">Thinking</span>
        <span class="flex gap-0.5">
          <span class="w-1 h-1 rounded-full bg-current animate-bounce" style="animation-delay: 0ms;"></span>
          <span class="w-1 h-1 rounded-full bg-current animate-bounce" style="animation-delay: 150ms;"></span>
          <span class="w-1 h-1 rounded-full bg-current animate-bounce" style="animation-delay: 300ms;"></span>
        </span>
      </div>
    {/if}

    {#each messages as msg}
      {#if msg.role === 'assistant'}
        <!-- AI bubble -->
        <div class="flex gap-2 items-start">
          <span class="text-xs flex-shrink-0 mt-0.5" style="color: #0d9488;">✦</span>
          <p class="text-xs leading-relaxed flex-1" style="color: #2a2926;">{msg.content}</p>
        </div>
      {:else}
        <!-- User bubble -->
        <div class="flex justify-end">
          <span
            class="text-xs px-3 py-2 rounded-2xl rounded-tr-sm max-w-[80%] leading-relaxed"
            style="background-color: #f4f3ef; color: #57564f;"
          >{msg.content}</span>
        </div>
      {/if}
    {/each}

    {#if loading && messages.length > 0}
      <!-- Typing indicator after user sends a follow-up -->
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

  <!-- Input bar -->
  <div
    class="flex items-center gap-2 px-3 py-2.5 flex-shrink-0"
    style="border-top: 1px solid #f0fdf9;"
  >
    <input
      bind:value={input}
      onkeydown={handleKeydown}
      disabled={loading}
      placeholder="Ask a follow-up…"
      class="flex-1 text-xs rounded-xl px-3 py-2 border focus:outline-none transition-colors"
      style="background-color: #fafaf8; border-color: #e8e6e0; color: #1a1917;
             opacity: {loading ? '0.5' : '1'};"
    />
    <button
      onclick={submit}
      disabled={loading || !input.trim()}
      class="flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all"
      style="background-color: {input.trim() && !loading ? '#0d9488' : '#e8e6e0'};
             color: {input.trim() && !loading ? 'white' : '#b0ada7'};"
      aria-label="Send"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="M1 6h10M6 1l5 5-5 5" stroke="currentColor" stroke-width="1.5"
              stroke-linecap="round" stroke-linejoin="round" fill="none"/>
      </svg>
    </button>
  </div>
</div>
