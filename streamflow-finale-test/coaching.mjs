export const hints={
 area:['Use the width and depth from the same station in the field log.','Multiply width × depth. Metres × metres gives square metres (m²).','Multiply the digits, then count the decimal places in both measurements. Recheck each copied value.'],
 discharge:['Copy the accepted area from the glass board and the matching velocity from the field log.','Discharge = area × velocity. m² × m/s = m³/s.','Keep the full multiplication result, or round to 2–4 decimal places. Do not add area and velocity.'],
 total:['Add all three station discharges from the glass board.','Line up the decimal points and use the full station values.','Add the first two values, then add the third. Round the final sum to two decimal places if you prefer.']
};
export class Narrator {
 constructor(bank,caption,button){this.bank=bank;this.caption=caption;this.button=button;this.audio=new Audio();this.audio.preload='auto';this.pending=null;this.token=0;this.audio.addEventListener('ended',()=>{this.button.textContent='Replay coaching';this.button.hidden=false;});button.onclick=()=>this.say(this.pending||this.current);}
 stop(){this.token++;this.audio.pause();this.audio.currentTime=0;this.pending=null;this.button.hidden=true;}
 async say(key){this.stop();const line=this.bank[key];if(!line)return;const token=this.token;this.current=key;this.caption.textContent=line.text;this.audio.src=line.file;this.button.textContent='Replay coaching';this.button.hidden=true;try{await this.audio.play();if(token!==this.token)return;}catch(e){if(token!==this.token)return;this.pending=key;this.button.textContent='Play Valerie’s coaching';this.button.hidden=false;}}
}
