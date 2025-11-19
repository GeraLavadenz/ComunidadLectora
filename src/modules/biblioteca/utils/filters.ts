// =====================================================
// 🔎 Utilidades de filtrado
// =====================================================
export function normalize(s: string) {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
