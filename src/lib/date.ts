
/**
 * Format API 'tanggal' string (e.g. 'Sabtu, 19/07/2025') to 'Sabtu, 19 Juli 2025'.
 */
export function formatTanggalIndoFromApi(apiTanggal: string): string {
  const [dayName, datePart] = apiTanggal.split(", ");
  const [day, month, year] = datePart.split("/");
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = months[monthIdx];
  return `${dayName}, ${parseInt(day, 10)} ${monthName} ${year}`;
}