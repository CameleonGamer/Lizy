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
    pronoteUrl: 'https://0750655e.index-education.net/pronote/eleve.html',
    type: 'Lycée',
    distanceKm: 0.8,
  },
  {
    id: '0750656F',
    name: 'Lycée Henri IV',
    city: 'Paris',
    postalCode: '75005',
    pronoteUrl: 'https://0750656f.index-education.net/pronote/eleve.html',
    type: 'Lycée',
    distanceKm: 1.5,
  },
  {
    id: '0750657G',
    name: 'Lycée Louis-le-Grand',
    city: 'Paris',
    postalCode: '75005',
    pronoteUrl: 'https://0750657g.index-education.net/pronote/eleve.html',
    type: 'Lycée',
    distanceKm: 1.7,
  },
  {
    id: '0690026J',
    name: 'Lycée du Parc',
    city: 'Lyon',
    postalCode: '69006',
    pronoteUrl: 'https://0690026j.index-education.net/pronote/eleve.html',
    type: 'Lycée',
    distanceKm: 2.3,
  },
  {
    id: '0330028A',
    name: 'Lycée Michel Montaigne',
    city: 'Bordeaux',
    postalCode: '33000',
    pronoteUrl: 'https://0330028a.index-education.net/pronote/eleve.html',
    type: 'Lycée',
    distanceKm: 3.1,
  },
];

/**
 * Normalizes any Pronote URL so it directly targets the Student (eleve.html) endpoint
 */
export function formatPronoteStudentUrl(rawUrl: string): string {
  let u = rawUrl.trim();
  if (!u.startsWith('http://') && !u.startsWith('https://')) {
    u = 'https://' + u;
  }
  u = u.replace(/\/+$/, '');
  if (!u.endsWith('eleve.html')) {
    if (u.endsWith('/pronote')) {
      u = `${u}/eleve.html`;
    } else {
      u = `${u}/pronote/eleve.html`;
    }
  }
  return u;
}

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

function mapApiRecords(results: any[], userLat?: number, userLon?: number): SchoolEstablishment[] {
  return results
    .map((r: any) => {
      const uai = (r.numero_uai || '').toLowerCase();
      const dist =
        userLat !== undefined && userLon !== undefined && r.latitude && r.longitude
          ? calculateDistanceKm(userLat, userLon, r.latitude, r.longitude)
          : undefined;

      return {
        id: r.numero_uai || '0000000X',
        name: r.appellation_officielle || r.nom_etablissement || 'Établissement Scolaire',
        city: r.libelle_commune || '',
        postalCode: r.code_postal_uai || '',
        pronoteUrl: formatPronoteStudentUrl(`https://${uai}.index-education.net/pronote/`),
        type: r.denomination_principale || r.nature_uai_libe || 'Établissement',
        distanceKm: dist,
      };
    })
    .sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
}

function fallbackSearch(queryText: string): SchoolEstablishment[] {
  const q = queryText.toLowerCase().trim();
  return FALLBACK_SCHOOLS.filter(
    (s) =>
      s.name.toLowerCase().includes(q) ||
      s.city.toLowerCase().includes(q) ||
      s.postalCode.includes(q) ||
      s.id.toLowerCase().includes(q)
  );
}

export const SchoolDirectory = {
  /**
   * Geolocation search: Finds nearby middle schools (Collèges) & high schools (Lycées)
   * Strictly ordered by proximity (distance ascending) with extended 30km radius and limit=100
   */
  async getNearbySchools(): Promise<SchoolEstablishment[]> {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        return FALLBACK_SCHOOLS;
      }

      let location;
      try {
        location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
      } catch {
        location = await Location.getLastKnownPositionAsync();
      }

      if (!location) {
        return FALLBACK_SCHOOLS;
      }

      const { latitude, longitude } = location.coords;

      // Query Open Data National Education API ordered strictly by distance
      const query = `within_distance(position, geom'POINT(${longitude} ${latitude})', 30km) AND (denomination_principale LIKE '%LYCEE%' OR denomination_principale LIKE '%COLLEGE%' OR denomination_principale LIKE '%SEGPA%' OR denomination_principale LIKE '%LP %' OR denomination_principale LIKE '%LPO%' OR denomination_principale LIKE '%LGT%' OR denomination_principale LIKE '%2D DEGRE%' OR denomination_principale LIKE '%ENSEIGNT ADAPTE%' OR appellation_officielle LIKE '%LYCEE%' OR appellation_officielle LIKE '%COLLEGE%' OR appellation_officielle LIKE '%CITE SCOLAIRE%' OR appellation_officielle LIKE '%INSTITUTION%' OR appellation_officielle LIKE '%ENSEMBLE SCOLAIRE%')`;
      const orderBy = `distance(position, geom'POINT(${longitude} ${latitude})')`;
      const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/records?where=${encodeURIComponent(query)}&order_by=${encodeURIComponent(orderBy)}&limit=100`;

      const res = await fetch(url);
      if (!res.ok) {
        return FALLBACK_SCHOOLS;
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        return FALLBACK_SCHOOLS;
      }

      return mapApiRecords(data.results, latitude, longitude);
    } catch {
      return FALLBACK_SCHOOLS;
    }
  },

  /**
   * Search by name, city, postal code, or RNE/UAI code
   */
  async searchSchools(queryText: string): Promise<SchoolEstablishment[]> {
    if (!queryText.trim()) return FALLBACK_SCHOOLS;

    try {
      const q = queryText.trim().replace(/'/g, '');
      const where = `(appellation_officielle LIKE '%${q}%' OR libelle_commune LIKE '%${q}%' OR code_postal_uai LIKE '%${q}%' OR numero_uai LIKE '%${q}%') AND (denomination_principale LIKE '%LYCEE%' OR denomination_principale LIKE '%COLLEGE%' OR denomination_principale LIKE '%SEGPA%' OR denomination_principale LIKE '%LP%' OR denomination_principale LIKE '%LPO%' OR denomination_principale LIKE '%LGT%' OR denomination_principale LIKE '%2D DEGRE%' OR appellation_officielle LIKE '%LYCEE%' OR appellation_officielle LIKE '%COLLEGE%' OR appellation_officielle LIKE '%CITE SCOLAIRE%' OR appellation_officielle LIKE '%INSTITUTION%' OR appellation_officielle LIKE '%ENSEMBLE SCOLAIRE%')`;
      const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/records?where=${encodeURIComponent(where)}&order_by=${encodeURIComponent('appellation_officielle asc')}&limit=40`;

      const res = await fetch(url);
      if (!res.ok) {
        return fallbackSearch(queryText);
      }

      const data = await res.json();
      if (!data.results || data.results.length === 0) {
        // Fallback with looser query without type filtering for special institutions
        const looseWhere = `(appellation_officielle LIKE '%${q}%' OR libelle_commune LIKE '%${q}%' OR code_postal_uai LIKE '%${q}%' OR numero_uai LIKE '%${q}%')`;
        const looseUrl = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-adresse-et-geolocalisation-etablissements-premier-et-second-degre/records?where=${encodeURIComponent(looseWhere)}&limit=30`;
        const looseRes = await fetch(looseUrl);
        if (looseRes.ok) {
          const looseData = await looseRes.json();
          if (looseData.results && looseData.results.length > 0) {
            return mapApiRecords(looseData.results);
          }
        }
        return fallbackSearch(queryText);
      }

      return mapApiRecords(data.results);
    } catch {
      return fallbackSearch(queryText);
    }
  },
};
