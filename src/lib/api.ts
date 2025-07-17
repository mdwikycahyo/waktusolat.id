/**
 * API client for fetching prayer times from AlAdhan.com API
 */

// Types for prayer times data
export interface PrayerTime {
    name: string;
    time: string;
    isNext: boolean;
    isCurrent: boolean;
    hasSound: boolean;
    timeUntil?: string;
  }
  
  export interface PrayerTimesResponse {
    code: number;
    status: string;
    data: {
      timings: {
        Fajr: string;
        Sunrise: string;
        Dhuhr: string;
        Asr: string;
        Sunset: string;
        Maghrib: string;
        Isha: string;
        Imsak: string;
        Midnight: string;
        Firstthird: string;
        Lastthird: string;
      };
      date: {
        readable: string;
        timestamp: string;
        gregorian: {
          date: string;
          format: string;
          day: string;
          weekday: { en: string };
          month: { number: number; en: string };
          year: string;
          designation: { abbreviated: string; expanded: string };
        };
        hijri: {
          date: string;
          format: string;
          day: string;
          weekday: { en: string; ar: string };
          month: { number: number; en: string; ar: string };
          year: string;
          designation: { abbreviated: string; expanded: string };
          holidays: string[];
        };
      };
      meta: {
        latitude: number;
        longitude: number;
        timezone: string;
        method: {
          id: number;
          name: string;
          params: { Fajr: number; Isha: number };
          location: { latitude: number; longitude: number };
        };
        latitudeAdjustmentMethod: string;
        midnightMode: string;
        school: string;
        offset: { Imsak: number; Fajr: number; Sunrise: number; Dhuhr: number; Asr: number; Maghrib: number; Sunset: number; Isha: number; Midnight: number };
      };
    };
  }
  
  // Define prayer name type
  type PrayerName = 'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha';
  
  // Indonesian prayer names mapping
  const prayerNamesIndonesian: Record<PrayerName, string> = {
    Fajr: 'Subuh',
    Dhuhr: 'Zuhur',
    Asr: 'Ashar',
    Maghrib: 'Maghrib',
    Isha: 'Isya'
  };
  
  /**
   * Fetch prayer times for a specific city
   * @param city City name
   * @param country Country name
   * @returns Promise with prayer times data
   */
  export async function fetchPrayerTimes(city: string = 'Jakarta', country: string = 'Indonesia'): Promise<PrayerTime[]> {
    try {
      // Get current date in YYYY-MM-DD format
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      // Fetch prayer times from AlAdhan API
      const url = `https://api.aladhan.com/v1/timingsByCity/${dateStr}?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=11`; // Method 11 is for Indonesia
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch prayer times: ${response.statusText}`);
      }
      
      const data: PrayerTimesResponse = await response.json();
      
      // Process the data to match our application format
      return processPrayerTimes(data, today);
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      // Return mock data in case of error
      return getMockPrayerTimes();
    }
  }
  
  /**
   * Process the API response to match our application format
   * @param data API response data
   * @param currentTime Current time for determining current/next prayer
   * @returns Formatted prayer times
   */
  function processPrayerTimes(data: PrayerTimesResponse, currentTime: Date): PrayerTime[] {
    const { timings } = data.data;
    const prayerTimes: PrayerTime[] = [];
    
    // We only need the 5 main prayers
    const mainPrayers: PrayerName[] = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    
    // Current hour and minute
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    
    // Convert current time to minutes since midnight for easy comparison
    const currentTimeInMinutes = currentHour * 60 + currentMinute;
    
    // Track the current prayer index
    let currentPrayerIndex = -1;
    
    // First pass: find the current prayer (most recent prayer that has passed)
    for (let i = 0; i < mainPrayers.length; i++) {
      const prayer = mainPrayers[i];
      const timeStr = timings[prayer as keyof typeof timings];
      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      const prayerTimeInMinutes = hour * 60 + minute;
      
      if (prayerTimeInMinutes <= currentTimeInMinutes) {
        currentPrayerIndex = i;
      }
    }
    
    // Determine next prayer index
    const nextPrayerIndex = currentPrayerIndex === -1 ? 0 : (currentPrayerIndex + 1) % mainPrayers.length;
    
    // Process each prayer time
    mainPrayers.forEach((prayer, index) => {
      // Type assertion to ensure TypeScript knows this is a valid key
      const timeStr = timings[prayer as keyof typeof timings];
      const [hourStr, minuteStr] = timeStr.split(':');
      const hour = parseInt(hourStr, 10);
      const minute = parseInt(minuteStr, 10);
      
      // Set current and next flags
      const isCurrent = index === currentPrayerIndex;
      const isNext = index === nextPrayerIndex;
      
      // Format the time as HH:MM
      const formattedTime = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      prayerTimes.push({
        name: prayerNamesIndonesian[prayer],
        time: formattedTime,
        isCurrent,
        isNext,
        hasSound: Math.random() > 0.5, // Random for now, can be replaced with user preferences
      });
    });
    
    // Calculate time until next prayer
    if (nextPrayerIndex !== -1) {
      const nextPrayer = mainPrayers[nextPrayerIndex];
      const nextTimeStr = timings[nextPrayer as keyof typeof timings];
      const [nextHour, nextMinute] = nextTimeStr.split(':').map(Number);
      const nextTimeInMinutes = nextHour * 60 + nextMinute;
      
      // Calculate minutes until next prayer
      let minutesUntil;
      
      // If next prayer is tomorrow (i.e., we're after Isha and before Fajr)
      if (nextPrayerIndex === 0 && currentPrayerIndex === mainPrayers.length - 1) {
        minutesUntil = nextTimeInMinutes + (24 * 60 - currentTimeInMinutes);
      } else if (nextTimeInMinutes < currentTimeInMinutes) {
        // Edge case: if next prayer time is earlier than current time
        // (shouldn't happen with our logic, but just in case)
        minutesUntil = nextTimeInMinutes + (24 * 60 - currentTimeInMinutes);
      } else {
        minutesUntil = nextTimeInMinutes - currentTimeInMinutes;
      }
      
      const hoursUntil = Math.floor(minutesUntil / 60);
      const remainingMinutes = minutesUntil % 60;
      
      // Format the time until string
      let timeUntilStr;
      if (hoursUntil > 0) {
        timeUntilStr = `Dalam ${hoursUntil} jam ${remainingMinutes} menit`;
      } else {
        timeUntilStr = `Dalam ${remainingMinutes} menit`;
      }
      
      // Add the time until to the next prayer
      prayerTimes[nextPrayerIndex].timeUntil = timeUntilStr;
    }
    
    return prayerTimes;
  }
  
  /**
   * Get mock prayer times for fallback
   * @returns Mock prayer times
   */
  function getMockPrayerTimes(): PrayerTime[] {
    return [
      { name: 'Subuh', time: '04:43', isNext: false, isCurrent: false, hasSound: true },
      { name: 'Zuhur', time: '11:59', isNext: false, isCurrent: false, hasSound: false },
      { name: 'Ashar', time: '15:21', isNext: false, isCurrent: false, hasSound: true },
      { name: 'Maghrib', time: '17:53', isNext: false, isCurrent: true, hasSound: false },
      { name: 'Isya', time: '19:07', isNext: true, isCurrent: false, hasSound: true, timeUntil: 'Dalam 1 jam 15 menit' }
    ];
  }
  
  /**
   * Get location information
   * @returns Location information including city, Islamic date, and Gregorian date
   */
  export function getLocationInfo() {
    // This would ideally come from a geolocation API or user preferences
    // For now, we'll return mock data
    return {
      location: 'Jakarta',
      islamicDate: '18 Ramadhan 1442 H',
      gregorianDate: 'Kamis, 16 Juli 2025'
    };
  }