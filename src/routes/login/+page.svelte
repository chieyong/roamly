<script lang="ts">
  import { signInWithGoogle } from '$lib/firebase/auth';
  import { user, authReady } from '$lib/stores/auth';
  import { goto } from '$app/navigation';

  let loading = $state(false);
  let error   = $state<string | null>(null);

  // If already signed in, go straight to the app
  $effect(() => {
    if ($authReady && $user) goto('/');
  });

  async function handleGoogleSignIn() {
    error   = null;
    loading = true;
    try {
      await signInWithGoogle();
      goto('/');
    } catch (e: any) {
      error   = e?.message ?? 'Sign-in failed. Please try again.';
      loading = false;
    }
  }
</script>

<div
  class="min-h-screen flex flex-col items-center justify-center px-6"
  style="background-color: #f9f8f5;"
>
  <!-- Logo / wordmark -->
  <div class="mb-10 text-center">
    <h1 class="text-3xl font-semibold tracking-tight" style="color: #1a1917;">roamly</h1>
    <p class="text-sm mt-1" style="color: #a09e98;">your personal travel planner</p>
  </div>

  <!-- Card -->
  <div
    class="w-full max-w-sm rounded-3xl p-8 space-y-5"
    style="background-color: white; border: 1px solid #e8e6e0; box-shadow: 0 4px 24px rgba(0,0,0,0.06);"
  >
    <div class="text-center space-y-1">
      <p class="text-base font-medium" style="color: #1a1917;">Sign in to continue</p>
      <p class="text-xs" style="color: #b0ada7;">Your trips are saved to your account</p>
    </div>

    <button
      onclick={handleGoogleSignIn}
      disabled={loading}
      class="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-2xl transition-all font-medium text-sm"
      style="background-color: {loading ? '#f4f3ef' : 'white'};
             border: 1px solid #e8e6e0;
             color: #1a1917;
             box-shadow: 0 1px 4px rgba(0,0,0,0.06);"
    >
      {#if loading}
        <span style="opacity: 0.5;">Signing in…</span>
      {:else}
        <!-- Google G icon -->
        <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      {/if}
    </button>

    {#if error}
      <p class="text-xs text-center" style="color: #d97706;">{error}</p>
    {/if}
  </div>

  <p class="mt-8 text-xs text-center" style="color: #c4c1bb;">
    Your data is private and only accessible with your Google account.
  </p>
</div>
