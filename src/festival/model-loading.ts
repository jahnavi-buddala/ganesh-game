// Bump this only when replacing a public model at the same path. Older releases
// cached unversioned model URLs for a year, including stale responses.
export const MODEL_REVISION='festival-models-20260920';
export class RequiredModelError extends Error {}
export async function loadModelWithRetry<T>(load:(url:string)=>Promise<T>,path:string):Promise<T>{
  const url=path+(path.includes('?')?'&':'?')+'v='+MODEL_REVISION;
  let lastError:unknown;
  for(let attempt=0;attempt<3;attempt++){
    // A distinct URL also bypasses failed image/GLTF promises in loader caches.
    const request=attempt?url+'&retry='+Date.now()+'-'+attempt:url;
    try{return await load(request);}catch(error){lastError=error;}
  }
  throw lastError;
}
