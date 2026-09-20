import type { SupabaseClient } from '@supabase/supabase-js';

export type LeaderboardEntry = {
  player_name: string;
  score: number;
  created_at: string;
};

type LeaderboardError = {code?:string;message?:string}|null;
type LeaderboardDb = {
  rpc?:(fn:string,args:Record<string,unknown>)=>PromiseLike<{error:LeaderboardError}>;
  from:(table:string)=>{
    delete:()=>({ilike:(column:string,pattern:string)=>PromiseLike<{error:LeaderboardError}>});
    insert:(row:{player_name:string;score:number})=>PromiseLike<{error:LeaderboardError}>;
    update:(row:{score:number})=>({ilike:(column:string,pattern:string)=>PromiseLike<{error:LeaderboardError}>});
  };
};

const env=(import.meta as ImportMeta & {env?:Record<string,string>}).env||{};
const supabaseUrl=env.VITE_SUPABASE_URL||'https://dzdwzqgbpnoiiepgnzsj.supabase.co';
const supabaseKey=env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_2OrMNBLTALyzCluq4-O45Q_znRlztw0';

let clientPromise:Promise<SupabaseClient>|undefined;
function getClient(){
  clientPromise??=import('@supabase/supabase-js').then(({createClient})=>createClient(supabaseUrl,supabaseKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  }));
  return clientPromise;
}

function cleanPlayerName(playerName:string){
  return playerName.trim().replace(/\s+/g,' ');
}

function escapeIlike(value:string){
  return value.replace(/\\/g,'\\\\').replace(/[%_]/g,'\\$&');
}

function errorText(error:LeaderboardError){
  return `${error?.code||''} ${error?.message||''}`.toLowerCase();
}

function isBlocked(error:LeaderboardError){
  return /42501|permission denied|not allowed|row-level security|rls/.test(errorText(error));
}

function isDuplicate(error:LeaderboardError){
  return error?.code==='23505'||/duplicate|unique/.test(errorText(error));
}

export function uniqueTopScores(entries:LeaderboardEntry[],limit=10){
  const seen=new Set<string>();
  const result:LeaderboardEntry[]=[];
  for(const entry of entries){
    const key=cleanPlayerName(entry.player_name).toLowerCase();
    if(!key||seen.has(key))continue;
    seen.add(key);
    result.push(entry);
    if(result.length>=limit)break;
  }
  return result;
}

export async function getTopScores(){
  const supabase=await getClient();
  const {data,error}=await supabase
    .from('leaderboard')
    .select('player_name,score,created_at')
    .order('score',{ascending:false})
    .order('created_at',{ascending:true})
    .limit(50);
  if(error)throw error;
  return uniqueTopScores((data||[]) as LeaderboardEntry[]);
}

export async function submitLeaderboardScore(playerName:string,score:number,supabase?:LeaderboardDb){
  const db=supabase??await getClient() as LeaderboardDb;
  const cleanName=cleanPlayerName(playerName);
  const cleanScore=Math.max(0,Math.min(1_000_000_000,Math.floor(score)));
  if(cleanName.length<2||cleanName.length>20)throw new Error('Enter a name between 2 and 20 characters.');
  if(typeof db.rpc==='function'){
    const {error:rpcError}=await db.rpc('replace_leaderboard_score',{p_name:cleanName,p_score:cleanScore});
    if(!rpcError)return cleanName;
  }
  const pattern=escapeIlike(cleanName);
  const {error:removeError}=await db.from('leaderboard').delete().ilike('player_name',pattern);
  if(removeError&&!isBlocked(removeError))throw removeError;
  const {error:insertError}=await db.from('leaderboard').insert({player_name:cleanName,score:cleanScore});
  if(!insertError)return cleanName;
  if(!isDuplicate(insertError)&&!isBlocked(insertError))throw insertError;
  const {error:updateError}=await db.from('leaderboard').update({score:cleanScore}).ilike('player_name',pattern);
  if(updateError)throw updateError;
  return cleanName;
}
