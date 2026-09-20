import type { SupabaseClient } from '@supabase/supabase-js';

export type LeaderboardEntry = {
  player_name: string;
  score: number;
  created_at: string;
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

export async function submitLeaderboardScore(playerName:string,score:number,supabase?:SupabaseClient){
  const db=supabase??await getClient();
  const cleanName=cleanPlayerName(playerName);
  const cleanScore=Math.max(0,Math.min(1_000_000_000,Math.floor(score)));
  if(cleanName.length<2||cleanName.length>20)throw new Error('Enter a name between 2 and 20 characters.');
  const {error:removeError}=await db.from('leaderboard').delete().ilike('player_name',escapeIlike(cleanName));
  if(removeError)throw removeError;
  const {error}=await db.from('leaderboard').insert({player_name:cleanName,score:cleanScore});
  if(error)throw error;
  return cleanName;
}
