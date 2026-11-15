if(window.parent===window)throw Error('The expedition laboratory requires its field-log host. Use the standalone finale for independent testing.');
window.streamflowIntegration=await new Promise(resolve=>{
 const receive=e=>{if(e.source!==parent||e.origin!==location.origin||e.data?.type!=='lab-init')return;removeEventListener('message',receive);resolve(e.data.payload);};
 addEventListener('message',receive);parent.postMessage({type:'lab-ready'},location.origin);
});
window.streamflowFinaleData=window.streamflowIntegration.data;
await import('./app.mjs?integrated=1');
