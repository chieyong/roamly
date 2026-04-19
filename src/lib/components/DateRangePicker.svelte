<script lang="ts">
  /**
   * DateRangePicker – kies een periode door twee datums te klikken in een kalender.
   * Gebruik: <DateRangePicker bind:startDate={...} bind:endDate={...} />
   */
  let {
    startDate = $bindable(''),
    endDate   = $bindable(''),
  }: {
    startDate: string;
    endDate:   string;
  } = $props();

  const MONTHS = ['Januari','Februari','Maart','April','Mei','Juni',
                  'Juli','Augustus','September','Oktober','November','December'];
  const DAY_HEADERS = ['Ma','Di','Wo','Do','Vr','Za','Zo'];

  let displayYear  = $state(new Date().getFullYear());
  let displayMonth = $state(new Date().getMonth());
  let hoverDate    = $state('');
  let inited       = $state(false);

  // Jump to the month of startDate when first rendered
  $effect(() => {
    if (!inited) {
      inited = true;
      if (startDate) {
        const d = new Date(startDate + 'T00:00:00');
        displayYear  = d.getFullYear();
        displayMonth = d.getMonth();
      }
    }
  });

  function daysInMonth(y: number, m: number) {
    return new Date(y, m + 1, 0).getDate();
  }

  // Monday = 0, …, Sunday = 6
  function firstWeekday(y: number, m: number) {
    return (new Date(y, m, 1).getDay() + 6) % 7;
  }

  function fmt(y: number, m: number, d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  const cells = $derived((() => {
    const out: (string | null)[] = [];
    const fw  = firstWeekday(displayYear, displayMonth);
    const dim = daysInMonth(displayYear, displayMonth);
    for (let i = 0; i < fw; i++)  out.push(null);
    for (let d = 1; d <= dim; d++) out.push(fmt(displayYear, displayMonth, d));
    return out;
  })());

  // The "effective end" is the confirmed endDate OR the hover date while user is picking
  const effectiveEnd = $derived(
    endDate || (startDate && hoverDate && hoverDate > startDate ? hoverDate : '')
  );

  function isStart(ds: string)   { return ds === startDate; }
  function isEnd(ds: string)     { return ds === endDate; }
  function isInRange(ds: string) {
    if (!startDate || !effectiveEnd) return false;
    return ds > startDate && ds < effectiveEnd;
  }
  function isHovered(ds: string) { return ds === hoverDate && startDate && !endDate; }

  const todayStr = new Date().toISOString().slice(0, 10);

  function clickDay(ds: string) {
    if (!startDate || endDate) {
      // Fresh selection
      startDate = ds;
      endDate   = '';
    } else if (ds === startDate) {
      // Deselect
      startDate = '';
      endDate   = '';
    } else if (ds < startDate) {
      // Clicked before current start → new start
      startDate = ds;
      endDate   = '';
    } else {
      // Clicked after start → set as end
      endDate = ds;
    }
  }

  function prevMonth() {
    if (displayMonth === 0) { displayMonth = 11; displayYear--; }
    else displayMonth--;
  }

  function nextMonth() {
    if (displayMonth === 11) { displayMonth = 0; displayYear++; }
    else displayMonth++;
  }

  function fmtLabel(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' });
  }

  function countNights(s: string, e: string): number {
    if (!s || !e) return 0;
    return Math.max(0, Math.round(
      (new Date(e + 'T00:00:00').getTime() - new Date(s + 'T00:00:00').getTime()) / 86400000
    ));
  }

  function cellBg(ds: string): string {
    if (isStart(ds) || isEnd(ds)) return '#0d9488';
    if (isInRange(ds) || isHovered(ds)) return 'transparent'; // wrapper handles range bg
    return 'transparent';
  }

  function wrapperBg(ds: string): string {
    if (isInRange(ds)) return '#ccfbf1';
    return 'transparent';
  }

  function cellColor(ds: string): string {
    if (isStart(ds) || isEnd(ds)) return 'white';
    if (isInRange(ds)) return '#0f766e';
    if (ds === todayStr) return '#0d9488';
    return '#1a1917';
  }
</script>

<div style="font-size: 12px; user-select: none;">
  <!-- Month navigation header -->
  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
    <button
      onclick={prevMonth}
      style="
        width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        background: transparent; color: #8b8a84;
        transition: background-color 0.15s;
      "
      onmouseenter={(ev) => { (ev.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
      onmouseleave={(ev) => { (ev.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      aria-label="Vorige maand"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M8 2L4 6l4 4"/>
      </svg>
    </button>

    <span style="font-weight: 600; color: #1a1917;">
      {MONTHS[displayMonth]} {displayYear}
    </span>

    <button
      onclick={nextMonth}
      style="
        width: 28px; height: 28px; border-radius: 8px; border: none; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        background: transparent; color: #8b8a84;
        transition: background-color 0.15s;
      "
      onmouseenter={(ev) => { (ev.currentTarget as HTMLElement).style.backgroundColor = '#f4f3ef'; }}
      onmouseleave={(ev) => { (ev.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
      aria-label="Volgende maand"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M4 2l4 4-4 4"/>
      </svg>
    </button>
  </div>

  <!-- Weekday headers -->
  <div style="display: grid; grid-template-columns: repeat(7, 1fr); margin-bottom: 2px;">
    {#each DAY_HEADERS as h}
      <div style="text-align: center; color: #b0ada7; padding: 3px 0; font-size: 11px;">{h}</div>
    {/each}
  </div>

  <!-- Calendar days -->
  <div style="display: grid; grid-template-columns: repeat(7, 1fr);">
    {#each cells as ds}
      {#if ds === null}
        <div style="height: 34px;"></div>
      {:else}
        <!-- Wrapper provides the range-highlight bar -->
        <div style="
          height: 34px;
          display: flex; align-items: center; justify-content: center;
          background-color: {wrapperBg(ds)};
        ">
          <button
            onclick={() => clickDay(ds)}
            onmouseenter={() => { if (startDate && !endDate) hoverDate = ds; }}
            onmouseleave={() => { hoverDate = ''; }}
            style="
              width: 30px; height: 30px;
              border-radius: 50%;
              border: {ds === todayStr && !isStart(ds) && !isEnd(ds) ? '1.5px solid #0d9488' : 'none'};
              background-color: {cellBg(ds)};
              color: {cellColor(ds)};
              font-weight: {isStart(ds) || isEnd(ds) || ds === todayStr ? '600' : '400'};
              cursor: pointer;
              display: flex; align-items: center; justify-content: center;
              outline: none;
              font-size: 12px;
              flex-shrink: 0;
            "
          >
            {new Date(ds + 'T00:00:00').getDate()}
          </button>
        </div>
      {/if}
    {/each}
  </div>

  <!-- Status / summary -->
  <div style="text-align: center; margin-top: 8px; min-height: 18px; color: #8b8a84;">
    {#if startDate && endDate}
      <span style="color: #0d9488; font-weight: 500;">
        {fmtLabel(startDate)} – {fmtLabel(endDate)}
        ·
        {countNights(startDate, endDate)} {countNights(startDate, endDate) === 1 ? 'nacht' : 'nachten'}
      </span>
    {:else if startDate}
      Selecteer einddatum…
    {:else}
      Selecteer begindatum
    {/if}
  </div>
</div>
