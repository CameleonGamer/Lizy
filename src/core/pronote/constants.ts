// List of supported ENT (Espaces Numériques de Travail) across French regions
export interface ENTDefinition {
  id: string;
  name: string;
  region: string;
  urlPattern?: string;
  casEndpoint?: string;
}

export const SUPPORTED_ENTS: ENTDefinition[] = [
  {
    id: 'none',
    name: 'Pronote Direct (Sans ENT)',
    region: 'National',
  },
  {
    id: 'educonnect',
    name: 'ÉduConnect (National Éducation Nationale)',
    region: 'France Entière',
    casEndpoint: 'https://educonnect.education.gouv.fr/idp/profile/SAML2/Redirect/SSO',
  },
  {
    id: 'monlycee_idf',
    name: 'MonLycée.net (Île-de-France)',
    region: 'Île-de-France',
    casEndpoint: 'https://monlycee.net/cas/login',
  },
  {
    id: 'neo_paris',
    name: 'Paris Classe Numérique (Collèges Paris)',
    region: 'Paris',
    casEndpoint: 'https://ent.parisclassenumerique.fr/cas/login',
  },
  {
    id: 'atrium_sud',
    name: 'Atrium Sud (Région Sud PACA)',
    region: 'Provence-Alpes-Côte d’Azur',
    casEndpoint: 'https://www.atrium-sud.fr/cas/login',
  },
  {
    id: 'lycee_connecte',
    name: 'Lycée Connecté (Nouvelle-Aquitaine)',
    region: 'Nouvelle-Aquitaine',
    casEndpoint: 'https://mon.lyceeconnecte.fr/cas/login',
  },
  {
    id: 'toutatice',
    name: 'Toutatice (Bretagne)',
    region: 'Bretagne',
    casEndpoint: 'https://www.toutatice.fr/idp/profile/SAML2/Redirect/SSO',
  },
  {
    id: 'elyco',
    name: 'e-lyco (Pays de la Loire)',
    region: 'Pays de la Loire',
    casEndpoint: 'https://cas.e-lyco.fr/cas/login',
  },
  {
    id: 'monbureaunumerique',
    name: 'Mon Bureau Numérique (Grand Est)',
    region: 'Grand Est',
    casEndpoint: 'https://cas.monbureaunumerique.fr/login',
  },
  {
    id: 'oze',
    name: 'Ozé (Hauts-de-France / Yvelines)',
    region: 'Hauts-de-France / IdF',
    casEndpoint: 'https://enc.hautsdeseine.fr/cas/login',
  },
];

export const PRONOTE_APP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
