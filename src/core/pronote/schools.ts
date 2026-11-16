import * as Location from 'expo-location';

export interface SchoolEstablishment {
  id: string; // UAI / RNE code (e.g. 0750655E)
  name: string;
  city: string;
  postalCode: string;
  pronoteUrl: string;
  type: string;
  distanceKm?: number;
}

const FALLBACK_SCHOOLS: SchoolEstablishment[] = [
  {
    id: '0750655E',
    name: 'Lycée Condorcet',
    city: 'Paris',
    postalCode: '75009',
    pronoteUrl: 'https://0750655e.index-education.net/pronote/',
    type: 'Lycée',
    distanceKm: 0.8,
  },
  {
    id: '0750656F',
    name: 'Lycée Henri IV',
    city: 'Paris',
    postalCode: '75005',
    pronoteUrl: 'https://0750656f.index-education.net/pronote/',
    type: 'Lycée',
    distanceKm: 1.5,
  },
  {
    id: '0750657G',
    name: 'Lycée Louis-le-Grand',
    city: 'Paris',
    postalCode: '75005',
    pronoteUrl: 'https://0750657g.index-education.net/pronote/',
    type: 'Lycée',
    distanceKm: 1.7,
  },
  {
    id: '0690026J',
    name: 'Lycée du Parc',
    city: 'Lyon',
    postalCode: '69006',
    pronoteUrl: 'https://0690026j.index-education.net/pronote/',
    type: 'Lycée',
    distanceKm: 2.3,
  },
  {
    id: '0330028A',
    name: 'Lycée Michel Montaigne',
    city: 'Bordeaux',
    postalCode: '33000',
    pronoteUrl: 'https://0330028a.index-education.net/pronote/',
    type: 'Lycée',
    distanceKm: 3.1,
  },
];

/**
 * Calculates straight line distance between two coordinates in kilometers
 */
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const SchoolDirectory = {
  /**
   * Geolocation search: Finds nearby middle schools (Collèges) & high schools (Lycées)
   */
  async getNearbySchools(): Promise<SchoolEstablishment[]> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return FALLBACK_SCHOOLS;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = location.coords;

      // Query Open Data National Education API within 20km radius
      const query = `within_distance(position, geom'POINT(${longitude} ${latitude})', 20km) AND (denomination_principale LIKE '%LYCEE%' OR denomination_principale LIKE '%COLLEGE%')`;
      const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/records?where=${encodeURIComponent(query)}&limit=25`;

      const res = await fetch(url);
      if (!res.ok) {
        return FALLBACK_SCHOOLS;
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return FALLBACK_SCHOOLS;
      }

      return data.results.map((r: any) => {
        const uai = (r.numero_uai || '').toLowerCase();
        const dist = r.latitude && r.longitude 
          ? calculateDistanceKm(latitude, longitude, r.latitude, r.longitude)
          : undefined;

        return {
          id: r.numero_uai || '0000000X',
          name: r.appellation_officielle || r.nom_etablissement || 'Établissement Scolaire',
          city: r.libelle_commune || '',
          postalCode: r.code_postal_uai || '',
          pronoteUrl: `https://${uai}.index-education.net/pronote/`,
          type: r.denomination_principale || 'Établissement',
          distanceKm: dist,
        };
      }).sort((a: SchoolEstablishment, b: SchoolEstablishment) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
    } catch (err) {
      return FALLBACK_SCHOOLS;
    }
  },

  /**
   * Search by name, city, or postal code
   */
  async searchSchools(queryText: string): Promise<SchoolEstablishment[]> {
    if (!queryText.trim()) return FALLBACK_SCHOOLS;

    try {
      const q = queryText.trim().replace(/'/g, '');
      const where = `(appellation_officielle LIKE '%${q}%' OR libelle_commune LIKE '%${q}%' OR code_postal_uai LIKE '%${q}%') AND (denomination_principale LIKE '%LYCEE%' OR denomination_principale LIKE '%COLLEGE%')`;
      const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/records?where=${encodeURIComponent(where)}&limit=20`;

      const res = await fetch(url);
      if (!res.ok) {
        return FALLBACK_SCHOOLS.filter(
          (s) =>
            s.name.toLowerCase().includes(queryText.toLowerCase()) ||
            s.city.toLowerCase().includes(queryText.toLowerCase()) ||
            s.postalCode.includes(queryText)
        );
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.map((r: any) => {
        const uai = (r.numero_uai || '').toLowerCase();
        return {
          id: r.numero_uai || '0000000X',
          name: r.appellation_officielle || r.nom_etablissement || 'Établissement Scolaire',
          city: r.libelle_commune || '',
          postalCode: r.code_postal_uai || '',
          pronoteUrl: `https://${uai}.index-education.net/pronote/`,
          type: r.denomination_principale || 'Établissement',
        };
      });
    } catch (err) {
      return FALLBACK_SCHOOLS.filter(
        (s) =>
          s.name.toLowerCase().includes(queryText.toLowerCase()) ||
          s.city.toLowerCase().includes(queryText.toLowerCase()) ||
          s.postalCode.includes(queryText)
      );
    }
  },
};
