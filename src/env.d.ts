declare namespace NodeJS {
  interface ProcessEnv {
    APPWRITE_ENDPOINT: string;
    APPWRITE_PROJECT_ID: string;
    APPWRITE_DATABASE_ID: string;
  }
}

declare var process: {
  env: NodeJS.ProcessEnv;
};
