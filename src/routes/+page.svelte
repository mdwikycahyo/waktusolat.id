<script lang="ts">
    import { onMount } from 'svelte';
    import { fly } from 'svelte/transition';
    
    // Import the Kaaba image and icon
    import kaabaImage from '../assets/images/kaaba.webp';
    import waktuSolatIcon from '../assets/icons/waktusolat.icon.webp';
    
    // Import API functions
    import { fetchPrayerTimes, getLocationInfo, type PrayerTime } from '$lib/api';
  
    // Animation control
    let visible = false;
    
    // Data states
    let prayerTimes: PrayerTime[] = [];
    let location = '';
    let islamicDate = '';
    let gregorianDate = '';
    let loading = true;
    let error = '';
    
    // Fetch prayer times data
    async function loadPrayerTimes() {
      try {
        // Get prayer times for Jakarta
        prayerTimes = await fetchPrayerTimes('Jakarta', 'Indonesia');
        
        // Get location info
        const locationInfo = getLocationInfo();
        location = locationInfo.location;
        islamicDate = locationInfo.islamicDate;
        gregorianDate = locationInfo.gregorianDate;
        
        loading = false;
      } catch (err) {
        console.error('Failed to load prayer times:', err);
        error = 'Gagal memuat waktu solat. Silakan coba lagi nanti.';
        loading = false;
      }
    }
    
    // Set visible to true after component is mounted and load data
    onMount(() => {
      // Load prayer times
      loadPrayerTimes();
      
      // Small delay to ensure smooth animation after page load
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
          <h1 class="text-4xl font-bold">{location}</h1>
          <div class="text-sm opacity-90">
            <div>{islamicDate}</div>
            <div>{gregorianDate}</div>
          </div>
        </div>
        <button 
          class="flex items-center gap-1 rounded-full bg-[#000000]/50 px-3 py-1.5 text-sm hover:bg-[#000000]/70 transition-colors"
          on:click={() => {
            // In a real app, this would open a location picker
            // For now, we'll just toggle between Jakarta and Bandung
            const newLocation = location === 'Jakarta' ? 'Bandung' : 'Jakarta';
            loading = true;
            setTimeout(async () => {
              try {
                prayerTimes = await fetchPrayerTimes(newLocation, 'Indonesia');
                location = newLocation;
                loading = false;
              } catch (err) {
                console.error('Failed to load prayer times:', err);
                error = `Gagal memuat waktu solat untuk ${newLocation}. Silakan coba lagi nanti.`;
                loading = false;
              }
            }, 500); // Simulate network delay
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          Ubah Lokasi
        </button>
      </div>
  
      <!-- Prayer times list -->
      <div class="mt-auto space-y-2">
        {#if loading}
          <div class="flex flex-col items-center justify-center py-8">
            <div class="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
            <div class="mt-4 text-center">Memuat waktu solat...</div>
          </div>
        {:else if error}
          <div class="rounded-lg bg-red-500/20 p-4 text-center">
            <div class="text-xl font-semibold">Error</div>
            <div class="mt-2">{error}</div>
            <button 
              class="mt-4 rounded-lg bg-white/20 px-4 py-2 font-medium hover:bg-white/30"
              on:click={loadPrayerTimes}
            >
              Coba Lagi
            </button>
          </div>
        {:else}
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
                      <img src={waktuSolatIcon} alt="Current prayer icon" class="h-6 w-6" />
                      <span>Sekarang</span>
                    </div>
                  {/if}
                  {#if prayer.timeUntil}
                    <div class="text-sm">{prayer.timeUntil}</div>
                  {/if}
                </div>
                <div class="flex items-center gap-3">
                  <div class="text-2xl font-semibold">{prayer.time}</div>
                  <button 
                    class="focus:outline-none"
                    on:click={() => {
                      // Toggle sound for this prayer time (would be connected to storage in a real app)
                      prayerTimes = prayerTimes.map((p, idx) => 
                        idx === i ? { ...p, hasSound: !p.hasSound } : p
                      );
                    }}
                  >
                    {#if prayer.hasSound}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M19.114 5.636a9 9 0 0 1 0 12.728M16.463 8.288a5.25 5.25 0 0 1 0 7.424M6.75 8.25l4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                    {:else}
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-5 w-5">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 9.75 19.5 12m0 0 2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25m-10.5-6 4.72-4.72a.75.75 0 0 1 1.28.53v15.88a.75.75 0 0 1-1.28.53l-4.72-4.72H4.51c-.88 0-1.704-.507-1.938-1.354A9.009 9.009 0 0 1 2.25 12c0-.83.112-1.633.322-2.396C2.806 8.756 3.63 8.25 4.51 8.25H6.75Z" />
                      </svg>
                    {/if}
                  </button>
                </div>
              </div>
            {/if}
          {/each}
        {/if}
      </div>
    </div>
  </div>
  