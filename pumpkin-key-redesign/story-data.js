/* Measured on the supplied originals; coordinates are normalized at runtime. */
window.PUMPKIN_STORY = [
  {id:'scene1', title:'A walk after dark', alt:'Four friends walk a moonlit road. “I got cooked on my math test today.”', ms:2500, sound:'scene1_three_thud_tech_mystery.wav'},
  {id:'scene2', title:'The roadside sign', alt:'A wooden sign reads Haunted House Open Tomorrow Night.', prompt:'Click tomorrow.', target:[278,420,878,613], label:'TOMORROW plank'},
  {id:'scene3a', title:'A loose board', alt:'The TOMORROW plank starts to tilt.', prompt:'Click tomorrow again.', target:[278,417,862,658], label:'Tilted TOMORROW plank'},
  {id:'scene3b', title:'One more nudge', alt:'The TOMORROW plank hangs diagonally from the sign.', prompt:'One more time.', target:[462,430,950,733], label:'Falling TOMORROW plank'},
  {id:'scene3c', title:'Something is missing', alt:'TOMORROW has fallen away. The sign now reads Haunted House Open Night.', ms:2500},
  {id:'scene4', title:'Opening night?', alt:'The friends read the sign. “Look. This is the opening night of the haunted house.”', ms:2500, sound:'scene4_mystery_opportunity.wav'},
  {id:'scene5', title:'Up to the house', alt:'The friends approach the old house, passing the fallen TOMORROW board.', ms:2500, sound:'scene5_ominous_approach.wav'},
  {id:'scene6', title:'The stuck door', alt:'The friends try the mansion door. “Yo, this JAWN is STUCK!”', prompt:'Click the door.', target:[175,40,558,750], label:'Mansion door'},
  {id:'scene7', title:'An unexpected entrance', alt:'A friend kicks the wooden door open.', ms:1200, sound:'scene7_wood_break.wav'},
  {id:'scene8', title:'Locked inside', alt:'Inside the mansion: “It’s pretty dead for opening night… Hey, the door is closing…”', ms:2500, sound:'scene8_creaks_and_drips.wav'},
  {id:'scene9', title:'A voice on the intercom', alt:'An intercom warns that the house is locked down. The only way out is to make a pumpkin key.', voice:true, sound:'scene9-intercom.m4a'},
  {id:'scene10', title:'A way out', alt:'The friends find a laser and a laptop. “I know how to use this. We can use the laser to make the pumpkin key.”', prompt:'Click the laptop.', target:[1200,565,1490,859], label:'Laptop beside the laser', width:1536, height:1024},
  {id:'scene11', title:'Make the pumpkin key', alt:'A straight-on laptop in the old house.', width:1360, height:765}
].map(scene=>({...scene, width:scene.width||1672, height:scene.height||941, image:`assets/story/${scene.id}.png`}));
