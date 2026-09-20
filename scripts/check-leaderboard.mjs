import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ts from 'typescript';
const source=readFileSync(new URL('../src/leaderboard.ts',import.meta.url),'utf8');
const {outputText}=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}});
const {submitLeaderboardScore,uniqueTopScores}=await import('data:text/javascript;base64,'+Buffer.from(outputText).toString('base64'));

function mockDb(rows, {denyDelete=false}={}){
  const calls=[];
  const db={
    from(table){
      assert.equal(table,'leaderboard');
      return {
        delete(){
          return {
            async ilike(column,pattern){
              calls.push({op:'delete',column,pattern});
              if(denyDelete)return {error:{message:'permission denied for table leaderboard'}};
              const rx=new RegExp('^'+pattern.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i');
              for(let i=rows.length-1;i>=0;i--)if(rx.test(rows[i].player_name))rows.splice(i,1);
              return {error:null};
            },
          };
        },
        async insert(row){
          calls.push({op:'insert',row});
          if(rows.some(r=>r.player_name.toLowerCase()===row.player_name.toLowerCase()))return {error:{code:'23505',message:'duplicate'}};
          rows.push({player_name:row.player_name,score:row.score,created_at:'now'});
          return {error:null};
        },
        update(row){
          return {
            async ilike(column,pattern){
              calls.push({op:'update',column,pattern,row});
              const rx=new RegExp('^'+pattern.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$','i');
              let count=0;
              for(const item of rows)if(rx.test(item.player_name)){item.score=row.score;count++;}
              return {error:null,data:count?[{}]:[]};
            },
          };
        },
      };
    },
  };
  return {db,calls,rows};
}

const first=mockDb([]);
assert.equal(await submitLeaderboardScore('  Ram  ', 1200, first.db),'Ram');
assert.equal(first.calls[0].op,'delete');
assert.equal(first.calls[0].column,'player_name');
assert.equal(first.calls[0].pattern,'Ram');
assert.deepEqual(first.calls[1],{op:'insert',row:{player_name:'Ram',score:1200}});
assert.equal(first.rows.length,1);

const again=mockDb([{player_name:'Ram',score:1200,created_at:'old'},{player_name:'ram',score:800,created_at:'older'}]);
assert.equal(await submitLeaderboardScore('ram', 450, again.db),'ram');
assert.equal(again.rows.length,1);
assert.equal(again.rows[0].player_name,'ram');
assert.equal(again.rows[0].score,450);
console.log('PASS a second submit with the same name replaces every previous row');

const blocked=mockDb([{player_name:'Mira',score:10,created_at:'old'}],{denyDelete:true});
assert.equal(await submitLeaderboardScore('Mira', 99, blocked.db),'Mira');
assert.equal(blocked.rows.length,1);
assert.equal(blocked.rows[0].score,99);
console.log('PASS submit still saves when delete is not allowed');

const board=uniqueTopScores([
  {player_name:'Asha',score:900,created_at:'1'},
  {player_name:'asha',score:400,created_at:'2'},
  {player_name:'Dev',score:800,created_at:'3'},
],10);
assert.deepEqual(board.map(r=>r.player_name),['Asha','Dev']);
console.log('PASS the displayed top ten shows each name once');
