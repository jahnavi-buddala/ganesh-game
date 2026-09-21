import packedModels from './packed-models.json';
import {loadModelWithRetry} from './model-loading';
import type {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';

export async function loadPackedModel(loader:GLTFLoader,path:string){
  const packed=(packedModels as Record<string,string>)[path];
  if(!packed||typeof DecompressionStream==='undefined')return loadModelWithRetry(url=>loader.loadAsync(url),path);
  try{
    return await loadModelWithRetry(async url=>{
      const response=await fetch(url);
      if(!response.ok||!response.body)throw Error('Model download failed: '+response.status);
      // Some hosts send Content-Encoding:gzip and the browser already expands it.
      const stream=response.headers.get('content-encoding')?.includes('gzip')?response.body:response.body.pipeThrough(new DecompressionStream('gzip'));
      const buffer=await new Response(stream).arrayBuffer();
      const header=new DataView(buffer);
      if(buffer.byteLength<12||header.getUint32(0,true)!==0x46546c67||header.getUint32(8,true)!==buffer.byteLength)throw Error('Incomplete model download');
      return loader.parseAsync(buffer,path.slice(0,path.lastIndexOf('/')+1));
    },packed);
  }catch(error){
    console.warn('Retrying original model download.',error);
    return loadModelWithRetry(url=>loader.loadAsync(url),path);
  }
}
