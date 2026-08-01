const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(__dirname, '../.env.local');
const envExamplePath = path.join(__dirname, '../.env.example');
const angularJsonPath = path.join(__dirname, '../angular.json');

let envFileContent = '';

if (fs.existsSync(envLocalPath)) {
  envFileContent = fs.readFileSync(envLocalPath, 'utf8');
} else if (fs.existsSync(envExamplePath)) {
  envFileContent = fs.readFileSync(envExamplePath, 'utf8');
}

function cleanValue(val) {
  if (!val) return '';
  let str = val.trim();
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    str = str.slice(1, -1);
  }
  return str.trim();
}

const envVars = {};
envFileContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
    const [key, ...valueParts] = trimmed.split('=');
    const rawVal = valueParts.join('=').trim();
    envVars[key.trim()] = cleanValue(rawVal);
  }
});

const appwriteEndpoint = process.env['APPWRITE_ENDPOINT'] || envVars['APPWRITE_ENDPOINT'] || 'https://sgp.cloud.appwrite.io/v1';
const appwriteProjectId = process.env['APPWRITE_PROJECT_ID'] || envVars['APPWRITE_PROJECT_ID'] || '6a6b908c00170e25d2d4';
const appwriteDatabaseId = process.env['APPWRITE_DATABASE_ID'] || envVars['APPWRITE_DATABASE_ID'] || '6a6b912b0013f04cef1e';
const appwriteStorageBucketId = process.env['APPWRITE_STORAGE_BUCKET_ID'] || envVars['APPWRITE_STORAGE_BUCKET_ID'] || '6a6dbf3f00123bfb3174';

const angularJsonRaw = fs.readFileSync(angularJsonPath, 'utf8');
const angularJson = JSON.parse(angularJsonRaw);

const projectName = Object.keys(angularJson.projects)[0] || 'planzy-angular';
const architect = angularJson.projects[projectName].architect;

// Clean up test options
if (architect.test && architect.test.options) {
  delete architect.test.options.define;
}

// Inject into build options
architect.build.options.define = architect.build.options.define || {};
architect.build.options.define['process.env.APPWRITE_ENDPOINT'] = JSON.stringify(appwriteEndpoint);
architect.build.options.define['process.env.APPWRITE_PROJECT_ID'] = JSON.stringify(appwriteProjectId);
architect.build.options.define['process.env.APPWRITE_DATABASE_ID'] = JSON.stringify(appwriteDatabaseId);
architect.build.options.define['process.env.APPWRITE_STORAGE_BUCKET_ID'] = JSON.stringify(appwriteStorageBucketId);

fs.writeFileSync(angularJsonPath, JSON.stringify(angularJson, null, 2), 'utf8');
console.log(`✔ Appwrite Project ID parsed: "${appwriteProjectId}"`);
console.log(`✔ Appwrite Storage Bucket ID: "${appwriteStorageBucketId}"`);
console.log('✔ Defined process.env in angular.json directly from .env.local!');
