export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

export type FirebaseRuntimeConfig = {
  config: FirebaseWebConfig;
  useEmulator: boolean;
};

export type FirebaseEnvironment = Record<string, string | boolean | undefined>;

const PRODUCTION_PROJECT_ID = 'briz-4ef3a';
const EMULATOR_PROJECT_ID = 'demo-briz-security';

const emulatorConfig: FirebaseWebConfig = {
  apiKey: 'demo-key',
  authDomain: `${EMULATOR_PROJECT_ID}.firebaseapp.com`,
  projectId: EMULATOR_PROJECT_ID,
  storageBucket: `${EMULATOR_PROJECT_ID}.appspot.com`,
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:0000000000000000000000',
};

function readRequired(environment: FirebaseEnvironment, key: string): string {
  const value = environment[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Firebase configuration is incomplete: set ${key} for this deployment environment.`);
  }
  return value.trim();
}

export function resolveFirebaseRuntimeConfig(
  environment: FirebaseEnvironment,
  deploymentEnvironment: string,
  mode: string,
): FirebaseRuntimeConfig {
  const deployment = deploymentEnvironment.toLowerCase();
  const useEmulator = environment.VITE_USE_FIREBASE_EMULATOR === 'true' || environment.VITE_USE_FIREBASE_EMULATOR === true;

  if (useEmulator) {
    if (deployment === 'production' || deployment === 'preview') {
      throw new Error(`Firebase Emulator cannot be enabled in Vercel ${deployment}.`);
    }
    return { config: emulatorConfig, useEmulator: true };
  }

  if (deployment === 'preview') {
    if (environment.VITE_FIREBASE_ENVIRONMENT !== 'staging') {
      throw new Error('Firebase is disabled for Vercel Preview until a dedicated staging Firebase project is configured.');
    }
  } else if (deployment === 'production') {
    if (environment.VITE_FIREBASE_ENVIRONMENT !== 'production') {
      throw new Error('Vercel Production requires VITE_FIREBASE_ENVIRONMENT=production.');
    }
  } else {
    if (mode === 'development') {
      throw new Error('Firebase is disabled for local development. Set VITE_USE_FIREBASE_EMULATOR=true and start Firebase Emulator Suite.');
    }
    if (environment.VITE_FIREBASE_ENVIRONMENT !== 'staging') {
      throw new Error('Local non-emulator builds require a dedicated staging Firebase project.');
    }
  }

  const config: FirebaseWebConfig = {
    apiKey: readRequired(environment, 'VITE_FIREBASE_API_KEY'),
    authDomain: readRequired(environment, 'VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: readRequired(environment, 'VITE_FIREBASE_PROJECT_ID'),
    storageBucket: readRequired(environment, 'VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: readRequired(environment, 'VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: readRequired(environment, 'VITE_FIREBASE_APP_ID'),
    measurementId: typeof environment.VITE_FIREBASE_MEASUREMENT_ID === 'string'
      ? environment.VITE_FIREBASE_MEASUREMENT_ID.trim()
      : undefined,
  };

  if (deployment === 'production' && config.projectId !== PRODUCTION_PROJECT_ID) {
    throw new Error(`Vercel Production must use Firebase project ${PRODUCTION_PROJECT_ID}.`);
  }
  if (deployment !== 'production' && config.projectId === PRODUCTION_PROJECT_ID) {
    throw new Error(`Firebase project ${PRODUCTION_PROJECT_ID} is forbidden outside Vercel Production.`);
  }

  return { config, useEmulator: false };
}
