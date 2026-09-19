import type { SupabaseClient } from '@supabase/supabase-js';

export type LeaderboardEntry = {
  player_name: string;
  score: number;
  created_at: string;
};

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL||'https://dzdwzqgbpnoiiepgnzsj.supabase.co';
const supabaseKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY||'sb_publishable_2OrMNBLTALyzCluq4-O45Q_znRlztw0';

let clientPromise:Promise<SupabaseClient>|undefined;
function getClient(){
  clientPromise??=import('@supabase/supabase-js').then(({createClient})=>createClient(supabaseUrl,supabaseKey,{
    auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  }));
  return clientPromise;
}

export async function getTopScores(){
  const supabase=await getClient();
  const {data,error}=await supabase
    .from('leaderboard')
    .select('player_name,score,created_at')
    .order('score',{ascending:false})
    .order('created_at',{ascending:true})
    .limit(10);
  if(error)throw error;
  return (data||[]) as LeaderboardEntry[];
}

export async function submitLeaderboardScore(playerName:string,score:number){
  const supabase=await getClient();
  const cleanName=playerName.trim().replace(/\s+/g,' ');
  const cleanScore=Math.max(0,Math.min(1_000_000_000,Math.floor(score)));
  if(cleanName.length<2||cleanName.length>20)throw new Error('Enter a name between 2 and 20 characters.');
  const {error}=await supabase.from('leaderboard').insert({player_name:cleanName,score:cleanScore});
  if(error)throw error;
  return cleanName;
}
