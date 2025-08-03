// Types
export interface PrayerTime {
  name: string;
  time: string;
  isCurrent: boolean;
  isNext: boolean;
  hasSound: boolean;
  timeUntil?: string;
  currentInfo?: string;
}

// Partial type for API response (for clarity)
interface JadwalSholatApiResponse {
  status: boolean;
  data: {
    jadwal: {
      tanggal: string;
      subuh: string;
      dzuhur: string;
      ashar: string;
      maghrib: string;
      isya: string;
      terbit: string;
    };
  };
}

import { formatTanggalIndoFromApi } from "./date";

export interface PrayerTimesResult {
  prayerTimes: PrayerTime[];
  formattedDate: string;
  maghribTime: string; // "HH:mm"
}

export async function getPrayerTimes(date: string, nowJakarta: Date): Promise<PrayerTimesResult> {
  const res = await fetch(
    `https://api.myquran.com/v2/sholat/jadwal/1301/${date}`
  );
  if (!res.ok) throw new Error("Gagal mengambil jadwal sholat");
  const data: JadwalSholatApiResponse = await res.json();
  if (!data.status) throw new Error("API mengembalikan status false");
  const jadwal = data.data.jadwal;
  const prayers = [
    { name: "Subuh", time: jadwal.subuh },
    { name: "Zuhur", time: jadwal.dzuhur },
    { name: "Ashar", time: jadwal.ashar },
    { name: "Maghrib", time: jadwal.maghrib },
    { name: "Isya", time: jadwal.isya },
  ];

  // Convert prayer times to Date objects for comparison
  const prayerDateTimes = prayers.map(p => {
    const [hour, minute] = p.time.split(":").map(Number);
    const dt = new Date(nowJakarta);
    dt.setHours(hour, minute, 0, 0);
    return dt;
  });

  // Get terbit time as Date
  const [terbitHour, terbitMinute] = jadwal.terbit.split(":").map(Number);
  const terbitDate = new Date(nowJakarta);
  terbitDate.setHours(terbitHour, terbitMinute, 0, 0);

  // Check if now is after Isya
  const isyaIdx = prayers.length - 1;
  const isAfterIsya = nowJakarta >= prayerDateTimes[isyaIdx];

  let foundNext = false;
  let nextPrayerIdx = -1;
  if (!isAfterIsya) {
    prayers.forEach((p, i) => {
      if (!foundNext && nowJakarta < prayerDateTimes[i]) {
        nextPrayerIdx = i;
        foundNext = true;
      }
    });
  } else {
    // After Isya, next prayer is Subuh (index 0)
    nextPrayerIdx = 0;
  }

  function formatTimeUntil(ms: number) {
    const totalMinutes = Math.round(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours > 0) {
      return `Dalam ${hours} jam${minutes > 0 ? ` ${minutes} menit` : ""}`;
    } else {
      return `Dalam ${minutes} menit`;
    }
  }

  foundNext = false;
  const prayerTimes = prayers.map((p, i) => {
    let isCurrent = false;
    let isNext = false;
    let timeUntil;
    let currentInfo;
    const thisTime = prayerDateTimes[i];
    const nextTime = prayerDateTimes[i + 1] || null;
    if (p.name === "Subuh") {
      // Subuh is current if now is between Subuh and Terbit
      if (nowJakarta >= thisTime && nowJakarta < terbitDate) {
        isCurrent = true;
        currentInfo = `Sampai ${jadwal.terbit}`;
      }
    } else {
      if (nextTime) {
        isCurrent = nowJakarta >= thisTime && nowJakarta < nextTime;
      } else {
        // Last prayer (Isya): isCurrent if after this time
        isCurrent = nowJakarta >= thisTime;
      }
    }
    if (!isAfterIsya) {
      if (i === nextPrayerIdx) {
        isNext = true;
        const diff = thisTime.getTime() - nowJakarta.getTime();
        if (diff > 0) {
          timeUntil = formatTimeUntil(diff);
        }
      }
    } else {
      // After Isya: next prayer is Subuh (index 0)
      if (i === 0) {
        isNext = true;
        // Calculate tomorrow's Subuh time
        const subuhTomorrow = new Date(prayerDateTimes[0]);
        subuhTomorrow.setDate(subuhTomorrow.getDate() + 1);
        const diff = subuhTomorrow.getTime() - nowJakarta.getTime();
        if (diff > 0) {
          timeUntil = formatTimeUntil(diff);
        }
      }
    }
    return {
      name: p.name,
      time: p.time,
      isCurrent,
      isNext,
      hasSound: false,
      timeUntil,
      currentInfo,
    };
  });

  return {
    prayerTimes,
    formattedDate: formatTanggalIndoFromApi(jadwal.tanggal),
    maghribTime: jadwal.maghrib,
  };
}
