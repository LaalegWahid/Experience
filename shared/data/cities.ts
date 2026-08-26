

export type City = { city: string; country: string };

export const CITIES: City[] = [
  { city: "Casablanca", country: "Morocco" },
  { city: "Rabat", country: "Morocco" },
  { city: "Marrakesh", country: "Morocco" },
  { city: "Fes", country: "Morocco" },
  { city: "Tangier", country: "Morocco" },
  { city: "Agadir", country: "Morocco" },
  { city: "Meknes", country: "Morocco" },
  { city: "Oujda", country: "Morocco" },
  { city: "Kenitra", country: "Morocco" },
  { city: "Tetouan", country: "Morocco" },
  { city: "Essaouira", country: "Morocco" },
  { city: "El Jadida", country: "Morocco" },
  { city: "Paris", country: "France" },
  { city: "Marseille", country: "France" },
  { city: "Lyon", country: "France" },
  { city: "Madrid", country: "Spain" },
  { city: "Barcelona", country: "Spain" },
  { city: "Valencia", country: "Spain" },
  { city: "Seville", country: "Spain" },
  { city: "Lisbon", country: "Portugal" },
  { city: "Porto", country: "Portugal" },
  { city: "London", country: "United Kingdom" },
  { city: "Manchester", country: "United Kingdom" },
  { city: "Amsterdam", country: "Netherlands" },
  { city: "Berlin", country: "Germany" },
  { city: "Munich", country: "Germany" },
  { city: "Rome", country: "Italy" },
  { city: "Milan", country: "Italy" },
  { city: "Brussels", country: "Belgium" },
  { city: "Dublin", country: "Ireland" },
  { city: "Copenhagen", country: "Denmark" },
  { city: "Dubai", country: "United Arab Emirates" },
  { city: "Istanbul", country: "Türkiye" },
  { city: "Cairo", country: "Egypt" },
  { city: "Tunis", country: "Tunisia" },
  { city: "Algiers", country: "Algeria" },
  { city: "New York", country: "United States" },
  { city: "Los Angeles", country: "United States" },
  { city: "Miami", country: "United States" },
  { city: "Toronto", country: "Canada" },
  { city: "Montréal", country: "Canada" },
];

/** Cities whose name starts-with then includes the query, capped. */
export function searchCities(query: string, limit = 6): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES.slice(0, limit);
  const starts = CITIES.filter((c) => c.city.toLowerCase().startsWith(q));
  const includes = CITIES.filter(
    (c) => !c.city.toLowerCase().startsWith(q) && c.city.toLowerCase().includes(q),
  );
  return [...starts, ...includes].slice(0, limit);
}
