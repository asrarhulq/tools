import { AU_KM, SPEED_OF_LIGHT_KM_S } from "../config";

export function formatDistanceKm(km: number): string {
  if (km >= AU_KM * 0.1) {
    return `${(km / AU_KM).toLocaleString(undefined, { maximumFractionDigits: 2 })} AU`;
  }
  if (km >= 1_000_000) {
    return `${(km / 1_000_000).toLocaleString(undefined, { maximumFractionDigits: 2 })} million km`;
  }
  return `${Math.round(km).toLocaleString()} km`;
}

export function formatMassKg(kg: number): string {
  const earthMasses = kg / 5.9724e24;
  if (earthMasses >= 0.01) {
    return `${kg.toExponential(3)} kg (${earthMasses.toLocaleString(undefined, { maximumFractionDigits: 2 })}× Earth)`;
  }
  return `${kg.toExponential(3)} kg`;
}

export function formatPeriod(days: number): string {
  if (days >= 365.25 * 2) {
    return `${(days / 365.25).toLocaleString(undefined, { maximumFractionDigits: 1 })} years`;
  }
  if (days >= 1) {
    return `${days.toLocaleString(undefined, { maximumFractionDigits: 1 })} days`;
  }
  return `${(days * 24).toLocaleString(undefined, { maximumFractionDigits: 1 })} hours`;
}

export function formatRotation(hours: number): string {
  const retrograde = hours < 0;
  const magnitude = Math.abs(hours);
  const text =
    magnitude >= 48
      ? `${(magnitude / 24).toLocaleString(undefined, { maximumFractionDigits: 1 })} days`
      : `${magnitude.toLocaleString(undefined, { maximumFractionDigits: 1 })} hours`;
  return retrograde ? `${text} (retrograde)` : text;
}

export function lightTravelTime(distanceKm: number): string {
  const seconds = distanceKm / SPEED_OF_LIGHT_KM_S;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  const hours = minutes / 60;
  return `${hours.toFixed(2)} hr`;
}

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
