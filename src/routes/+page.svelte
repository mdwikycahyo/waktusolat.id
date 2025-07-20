<script lang="ts">
  import { fly } from "svelte/transition";
  import { onMount } from "svelte";

  import kaabaImage from "../assets/images/kaaba.webp";
  import waktuSolatIcon from "../assets/icons/waktusolat.icon.webp";

  import { getPrayerTimes, type PrayerTime, type PrayerTimesResult } from "../lib/api";

  let prayerTimes = $state<PrayerTime[]>([]);
  let todayDateString = $state("");
  let visible = $state(false);
  let isLoading = $state(true);
  let error = $state("");

  function getTodayIndonesiaDate() {
    const now = new Date();

    const jakartaDate = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
    );

    const yyyy = jakartaDate.getFullYear();
    const mm = String(jakartaDate.getMonth() + 1).padStart(2, "0");
    const dd = String(jakartaDate.getDate()).padStart(2, "0");

    return `${yyyy}-${mm}-${dd}`;
  }

  async function fetchPrayerTimes(date: string) {
    try {
      isLoading = true;
      error = "";

      const now = new Date();
      const nowJakarta = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" })
      );
      const result: PrayerTimesResult = await getPrayerTimes(date, nowJakarta);
      
      prayerTimes = result.prayerTimes;
      todayDateString = result.formattedDate;

    } catch (e: any) {
      error = e.message || "Terjadi kesalahan";
    } finally {
      isLoading = false;
    }
  }

  onMount(async () => {
    const todayISO = getTodayIndonesiaDate();
    await fetchPrayerTimes(todayISO);
    setTimeout(() => {
      visible = true;
    }, 100);
  });
</script>

<div class="relative min-h-screen w-full overflow-hidden bg-[#000000] text-white">
  <!-- Background image with overlay -->
  <div class="absolute inset-0 z-0">
    <img
      src={kaabaImage}
      alt="Kaaba background"
      class="h-full w-full object-cover"
    />
    <div class="absolute inset-0 bg-[#000000]/15"></div>
  </div>

  <!-- Content container -->
  <div class="relative z-10 flex min-h-screen flex-col px-8 py-16">
    <!-- Location header -->
    <div class="mb-2 flex items-center justify-between">
      <div>
        <h1 class="text-4xl font-bold">Jakarta</h1>
        {#if visible}
          <div class="text-sm opacity-90">
            {#if isLoading}
              <div>Memuat tanggal...</div>
            {:else if error}
              <div class="text-red-400">{error}</div>
            {:else}
              <div>{todayDateString}</div>
            {/if}
          </div>
        {/if}
      </div>
    </div>

    <!-- Prayer times list -->
    <div class="my-auto space-y-2">
      {#each prayerTimes as prayer, i}
        {#if visible}
          <div
            in:fly={{ y: -20, delay: i * 150, duration: 300 }}
            class="flex items-center justify-between rounded-lg p-4"
            style={prayer.isCurrent
              ? "background: linear-gradient(to left, #FFD27F99 0%, #479CB299 34%, #00316799 66%, #000B2199 100%), rgba(0.6, 0.6, 0.6, 0.6);"
              : prayer.isNext
                ? "background: linear-gradient(to left, #00000080, #00000080), linear-gradient(to left, #FFD27F99 0%, #479CB299 34%, #00316799 66%, #000B2199 100%), rgba(0.1, 0.1, 0.1, 0.1);"
                : "background: rgba(0.5, 0.5, 0.5, 0.5);"}
          >
            <div>
              <div class="text-xl font-semibold">{prayer.name}</div>
              {#if prayer.isCurrent}
                <div class="flex items-end gap-2 text-sm my-1">
                  <img
                    src={waktuSolatIcon}
                    alt="Current prayer icon"
                    class="h-6 w-6"
                  />
                  <span>{prayer.currentInfo ? prayer.currentInfo : 'Sekarang'}</span>
                </div>
              {/if}
              {#if prayer.timeUntil}
                <div class="text-sm">{prayer.timeUntil}</div>
              {/if}
            </div>
            <div class="flex items-center gap-3">
              <div class="text-2xl font-semibold">{prayer.time}</div>
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
</div>
