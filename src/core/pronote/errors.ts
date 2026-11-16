export class PronoteError extends Error {
  public code: string;
  constructor(message: string, code = 'PRONOTE_ERROR') {
    super(message);
    this.name = 'PronoteError';
    this.code = code;
  }
}

export class PronoteBadCredentialsError extends PronoteError {
  constructor(message = 'Identifiant ou mot de passe incorrect.') {
    super(message, 'BAD_CREDENTIALS');
    this.name = 'PronoteBadCredentialsError';
  }
}

export class PronoteExpiredSessionError extends PronoteError {
  constructor(message = 'Session expirée. Veuillez vous reconnecter.') {
    super(message, 'SESSION_EXPIRED');
    this.name = 'PronoteExpiredSessionError';
  }
}

export class PronoteNetworkError extends PronoteError {
  constructor(message = 'Impossible de contacter le serveur Pronote. Vérifiez votre connexion.') {
    super(message, 'NETWORK_ERROR');
    this.name = 'PronoteNetworkError';
  }
}

export class PronoteMaintenanceError extends PronoteError {
  constructor(message = 'Le serveur Pronote de votre établissement est actuellement en maintenance.') {
    super(message, 'MAINTENANCE');
    this.name = 'PronoteMaintenanceError';
  }
}

export class PronoteUnsupportedENTError extends PronoteError {
  constructor(message = 'Cet ENT nécessite une validation manuelle ou n’est pas encore supporté.') {
    super(message, 'UNSUPPORTED_ENT');
    this.name = 'PronoteUnsupportedENTError';
  }
}
