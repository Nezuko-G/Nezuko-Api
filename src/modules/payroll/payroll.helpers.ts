export function calcHoursPerDay(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    return eh + em / 60 - (sh + sm / 60);
}