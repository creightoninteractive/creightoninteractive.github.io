export const prototypeData={wetWidth:12,stations:[{width:3,depth:.31,velocity:.43},{width:3,depth:.63,velocity:.63},{width:3,depth:.37,velocity:.45}]};
export function cleanData(input){
 if(!input||!Number.isFinite(input.wetWidth)||input.wetWidth<=0||!Array.isArray(input.stations)||input.stations.length!==3)throw Error('Provide a positive wet width and three stations.');
 const stations=input.stations.map(s=>{const row={};for(const k of ['width','depth','velocity']){if(!Number.isFinite(s[k])||s[k]<(k==='width'?Number.EPSILON:0))throw Error('Invalid '+k);row[k]=s[k];}return row;});
 if(stations.reduce((a,s)=>a+s.width,0)>input.wetWidth+.000001)throw Error('Station widths exceed wet width.');
 return {wetWidth:input.wetWidth,stations};
}
const units={length:['m','metres','meters'],area:['m2','m²','m^2'],velocity:['m/s','ms-1','m·s−1'],discharge:['m3/s','m³/s','m^3/s']};
export function parseQuantity(raw,kind){
 const s=String(raw).trim().replace(/,/g,'.');
 const match=/^([+]?(?:\d+(?:\.\d*)?|\.\d+))\s*(.*?)$/.exec(s);
 if(!match)return {error:'Enter a non-negative number.'};
 const value=Number(match[1]),unit=match[2].toLowerCase().replace(/\s+/g,'');
 if(!Number.isFinite(value))return {error:'Enter a finite number.'};
 if(unit&&!units[kind]?.includes(unit))return {error:'Use '+({length:'m',area:'m²',velocity:'m/s',discharge:'m³/s'}[kind])+' for this field.'};
 return {value};
}
// Grade calculated values against the same two-decimal reference shown to students.
export const answerTolerance=.02;
export const roundedMatch=(actual,expected)=>Number.isFinite(actual)&&Math.abs(actual-Number(expected.toFixed(2)))<=answerTolerance+1e-9;
export class Calculation {
 constructor(input=prototypeData){this.data=cleanData(input);this.reset();}
 reset(){this.stage='area';this.accepted={area:[false,false,false],discharge:[false,false,false]};this.attempts={area:[0,0,0],discharge:[0,0,0],total:[0]};this.complete=false;}
 area(i){const s=this.data.stations[i];return s.width*s.depth;}
 discharge(i){return this.area(i)*this.data.stations[i].velocity;}
 total(){return this.data.stations.reduce((n,_,i)=>n+this.discharge(i),0);}
 validateRow(stage,i,raw){
  if(stage!==this.stage||!['area','discharge'].includes(stage))throw Error('Calculation stage is locked.');
  const s=this.data.stations[i],expected=stage==='area'?[s.width,s.depth,this.area(i)]:[this.area(i),s.velocity,this.discharge(i)],kinds=stage==='area'?['length','length','area']:['area','velocity','discharge'];
  const fields=raw.map((x,j)=>{const p=parseQuantity(x,kinds[j]);if(p.error)return {ok:false,error:p.error};const ok=(j===2||(stage==='discharge'&&j===0))?roundedMatch(p.value,expected[j]):Math.abs(p.value-expected[j])<=.00005;return {ok,error:ok?'':j<2?'Check this measurement against '+(stage==='discharge'&&j===0?'the glass board.':'your field log.'):'Check the multiplication and decimal point.'};});
  const ok=fields.length===3&&fields.every(f=>f.ok);if(ok)this.accepted[stage][i]=true;else this.attempts[stage][i]++;
  return {ok,fields,level:Math.min(this.attempts[stage][i],3)};
 }
 advance(){if(this.stage==='area'&&this.accepted.area.every(Boolean))this.stage='discharge';else if(this.stage==='discharge'&&this.accepted.discharge.every(Boolean))this.stage='total';else throw Error('Complete this stage first.');}
 validateTotal(raw){if(this.stage!=='total')throw Error('Total is locked.');const p=parseQuantity(raw,'discharge');const ok=!p.error&&roundedMatch(p.value,this.total());if(ok)this.complete=true;else this.attempts.total[0]++;return {ok,error:p.error||'Add the three station discharges shown on the board. Use two decimal places.',level:Math.min(this.attempts.total[0],3)};}
}
