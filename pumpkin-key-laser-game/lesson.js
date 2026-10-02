/* All rectangles use the ORIGINAL 960 × 540 image, never browser pixels.
   Tune these data values to adapt the engine to another screenshot lesson. */
window.ONSHAPE_LESSON = {
  width: 960, height: 540,
  scoring: {pointsPerStep: 1, wrongLimit: 3},
  steps: [
    { title: 'Find your front view.', instruction: 'Click Front on the View Cube in the upper-right.', hint: 'Look at the View Cube in the upper-right. Choose its Front face.', type: 'click', targets: [{x1:879,y1:90,x2:907,y2:117}] },
    { title: 'Start a new sketch.', instruction: 'Click Sketch in the upper-left toolbar.', hint: 'Look along the upper-left toolbar, just above the feature tree.', type: 'click', targets: [{x1:70,y1:34,x2:112,y2:53}] },
    { title: 'Choose the Front plane.', instruction: 'Click Front in the feature tree, or select the large Front plane.', hint: 'Use the Front row on the left, or the large blue plane in the workspace.', type: 'click', targets: [{x1:37,y1:120,x2:79,y2:139},{x1:350,y1:55,x2:745,y2:443}] },
    { title: 'Find the image tools.', instruction: 'Click the small dropdown arrow beside the image / DXF tool.', hint: 'Look near the middle of the top toolbar. Use the tiny arrow immediately to the right of the image / DXF icon.', type: 'click', targets: [{x1:466,y1:34,x2:477,y2:53}] },
    { title: 'Insert an image.', instruction: 'Choose Insert image from the open dropdown menu.', hint: 'Choose the second command in the dropdown you just opened.', type: 'click', targets: [{x1:445,y1:66,x2:536,y2:90}] },
    { title: 'Bring in your file.', instruction: 'Click Import… at the bottom of the Insert an image panel.', hint: 'Look at the bottom-left corner of the image panel on the left.', type: 'click', targets: [{x1:131,y1:307,x2:190,y2:329}] },
    { title: 'Choose the pumpkin template.', instruction: 'First click the Pumpkin-Template file row. Then click Open.', hint: 'First select the Pumpkin-Template row near the top of the file window. Then press Open at its lower-right.', type: 'orderedClicks', targets: [{x1:117,y1:114,x2:410,y2:137},{x1:347,y1:271,x2:405,y2:297}] },
    { title: 'Select your imported image.', instruction: 'Click Pumpkin-Template.jpg in the Onshape image list.', hint: 'Select the imported Pumpkin-Template.jpg entry in the left panel.', type: 'click', targets: [{x1:136,y1:130,x2:289,y2:158}] },
    // Expanded from the teacher's revised drag reference; exclude its labels and arrow.
    // A small movement threshold keeps the larger zones forgiving while requiring down-right motion.
    { title: 'Make room for your image.', instruction: 'Press in the upper-left area of the sketch. Hold, drag down-right, and release in the lower-right area.', hint: 'Press anywhere in START. Keep holding, move diagonally down-right, then release in END. Use Show hint to see both larger zones.', type: 'drag', startRegion: {x1:337,y1:83,x2:553,y2:197}, endRegion: {x1:530,y1:278,x2:780,y2:410}, minDx:20, minDy:20 }
  ].map((step, i) => ({...step,
    title: ["Step 1: Let's look at the front view!", "Time to add a sketch!", "Whoops! Where do we put the sketch?", "Time to add our cool picture to the sketch!", "Almost there. Let's insert it!", "Where's that sneaky import button?", "Oh cool, we're adding a pumpkin!", "Time to put that pumpkin in our sketch!", "Click and drag!"][i],
    hint: ["Look at the View Cube in the upper-right.", "Look at the upper-left toolbar.", "Choose the Front plane. You can use the feature tree or the large plane in the workspace.", "Look near the image/DXF tool in the top toolbar; use the small dropdown arrow.", "The command is inside the dropdown you just opened.", "Look at the bottom-left of the Insert an image panel.", "First select the Pumpkin-Template file. Then press Open.", "Select the imported Pumpkin-Template.jpg entry in the left panel.", "Press in the upper-left of the sketch, keep holding, drag diagonally down-right, then release."][i],
    image: `assets/10_2_26_DE1${i ? '(' + i + ')' : ''}.png`
  }))
};
window.ONSHAPE_SFX = Object.fromEntries(Object.entries({correct:'correct_chime',wrong:'wrong_boop',hint:'hint_ping',pointLost:'point_lost',complete:'completion_fanfare'}).map(([key,file])=>[key,`assets/sfx/${file}.wav`]));

// Screen IDs come from filenames, not challenge ordinals. The unnumbered base is 0.
window.ONSHAPE_LESSON.steps.forEach(s=>{s.id=Number(s.image.match(/\((\d+)\)/)?.[1] ?? 0);s.scored=true;});
window.ONSHAPE_LESSON.steps[6].afterSelection='File selected. Now click Open.';
// New references were measured in the same 960 × 540 logical coordinate space.
// The originals are wider than 16:9; rendering keeps their natural proportions.
window.ONSHAPE_LESSON.steps.push(...[
  {id:9, title:"Let's size up our pumpkin!", hint:'Choose the dimension tool in the top toolbar.',type:'click',targets:[{x1:482,y1:21,x2:505,y2:45}]},
  {id:10,title:'Give that pumpkin a dimension!',hint:'First select the left vertical edge of the image rectangle. Then place the dimension farther to the left.',type:'orderedClicks',targets:[{x1:403,y1:180,x2:435,y2:399},{x1:300,y1:173,x2:339,y2:416}],afterSelection:'Edge selected. Now place the dimension to its left.'},
  {id:11,title:'Make it 50 millimeters tall!',hint:'Clear the selected dimension and type 50 mm. Pause briefly after typing; the next screen asks you to confirm.',type:'textInput',field:{x1:295,y1:253,x2:345,y2:270},initialValue:'91.95194 mm',acceptedValues:['50','50mm','50 mm'],inputLabel:'Pumpkin height in millimeters'},
  {id:12,title:'Lock in that pumpkin size!',hint:'Click the green check beside the 50 mm dimension.',type:'click',targets:[{x1:341,y1:251,x2:358,y2:273}]},
  {id:13,title:"Let's trace that pumpkin!",hint:'Choose the spline tool in the top toolbar.',type:'click',targets:[{x1:227,y1:20,x2:245,y2:44}]},
  {id:14,title:'Looking great! Finish the sketch.',hint:'Click the green check in the Sketch panel.',type:'click',targets:[{x1:206,y1:43,x2:224,y2:63}]},
  {id:15,title:'Give our pumpkin some thickness!',hint:'Select Sketch 1 in the feature tree first. Then click Extrude in the upper-left toolbar.',type:'orderedClicks',targets:[{x1:21,y1:155,x2:78,y2:174},{x1:102,y1:23,x2:121,y2:45}],afterSelection:'Sketch selected. Now choose Extrude.'},
  {id:16,title:'Three millimeters should do it!',hint:'Replace the Depth value with 3 mm. Pause after typing, then confirm on the next screen.',type:'textInput',field:{x1:164,y1:135,x2:213,y2:153},initialValue:'25 mm',acceptedValues:['3','3mm','3 mm'],inputLabel:'Extrusion depth in millimeters'},
  {id:17,title:'Our pumpkin is taking shape!',hint:'Click the green check in the Extrude panel.',type:'click',targets:[{x1:205,y1:42,x2:224,y2:63}]},
  {id:18,title:"Let's get a new perspective!",hint:'Click the upper-right corner of the View Cube to see the part in perspective.',type:'click',targets:[{x1:914,y1:70,x2:935,y2:92}]},
  {id:19,title:'Time to right-click on the Part Studio 1 tab.',hint:'Right-click the Part Studio 1 tab at the bottom-left. A Chromebook two-finger trackpad click works too.',type:'rightClick',targets:[{x1:40,y1:519,x2:141,y2:539}]},
  {id:20,title:'Quick, create a drawing.',hint:'Choose Create Drawing of Part 1 in the open menu.',type:'click',targets:[{x1:59,y1:424,x2:154,y2:439}]},
  {id:21,title:"We're going custom.",hint:'Choose the Custom template tab at the top of the dialog.',type:'click',targets:[{x1:334,y1:40,x2:414,y2:66}]},
  {id:22,title:"We don't need a border.",hint:'Choose Do not include on the Border row.',type:'click',targets:[{x1:579,y1:73,x2:635,y2:96}]},
  {id:23,title:"We don't need a title block.",hint:'Choose Do not include on the Titleblock row.',type:'click',targets:[{x1:581,y1:94,x2:640,y2:115}]},
  {id:24,title:"Okay, let's do it!",hint:'Click OK at the bottom-right of the drawing dialog.',type:'click',targets:[{x1:641,y1:333,x2:669,y2:360}]},
  {id:25,title:'Click the pumpkin to put it on the drawing.',hint:'Click the pumpkin preview near the middle of the white drawing sheet.',type:'click',targets:[{x1:439,y1:206,x2:553,y2:339}]},
  {id:26,title:'No more drawings on the drawing. Press the Escape key.',hint:'Press the physical Escape key on your keyboard. No mouse click is needed.',type:'keyPress',key:'Escape'},
  {id:27,title:"All right, now let's right-click on the drawing tab and get this thing done!",hint:'Right-click the Part 1 Drawing 1 tab along the bottom of the screen.',type:'rightClick',targets:[{x1:142,y1:521,x2:244,y2:539}]},
  {id:28,title:'Time to export it.',hint:'Choose Export in the menu above the drawing tab.',type:'click',targets:[{x1:143,y1:501,x2:245,y2:516}]},
  {id:29,title:'Everything looks good! Export it!',hint:'Click the blue Export button at the bottom of the dialog.',type:'click',targets:[{x1:550,y1:371,x2:590,y2:395}]},
  {id:30,title:'Sending pumpkin drawing to be laser cut!',type:'finale',scored:false}
].map(s=>({...s,scored:s.scored!==false,image:`assets/10_2_26_DE1(${s.id}).png`})));

// Native dimensions prevent layout shifts and preserve the supplied screenshots.
const imageSizes={"10_2_26_DE1(1).png": [960, 540], "10_2_26_DE1(10).png": [1892, 962], "10_2_26_DE1(11).png": [1897, 962], "10_2_26_DE1(12).png": [1897, 956], "10_2_26_DE1(13).png": [1897, 956], "10_2_26_DE1(14).png": [1897, 956], "10_2_26_DE1(15).png": [1897, 962], "10_2_26_DE1(16).png": [1897, 958], "10_2_26_DE1(17).png": [1897, 956], "10_2_26_DE1(18).png": [1897, 955], "10_2_26_DE1(19).png": [1897, 955], "10_2_26_DE1(2).png": [960, 540], "10_2_26_DE1(20).png": [1897, 959], "10_2_26_DE1(21).png": [1897, 906], "10_2_26_DE1(22).png": [1897, 906], "10_2_26_DE1(23).png": [1897, 903], "10_2_26_DE1(24).png": [1897, 905], "10_2_26_DE1(25).png": [1897, 906], "10_2_26_DE1(26).png": [1897, 906], "10_2_26_DE1(27).png": [1897, 958], "10_2_26_DE1(28).png": [1897, 958], "10_2_26_DE1(29).png": [1897, 958], "10_2_26_DE1(3).png": [960, 540], "10_2_26_DE1(30).png": [1897, 960], "10_2_26_DE1(4).png": [960, 540], "10_2_26_DE1(5).png": [960, 540], "10_2_26_DE1(6).png": [960, 540], "10_2_26_DE1(7).png": [960, 540], "10_2_26_DE1(8).png": [960, 540], "10_2_26_DE1(9).png": [1889, 960], "10_2_26_DE1.png": [960, 540]};
window.ONSHAPE_LESSON.steps.forEach(s=>{[s.imageWidth,s.imageHeight]=imageSizes[s.image.split('/').pop()];});
