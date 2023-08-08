(function (ActionAppCore, $) {

  var ControlSpecs = {
    options: {
      padding: false
    },
    content: [{
      ctl: "spot",
      name: "puppet_stage",
      styles: "min-height:400px;",
      text: '<div appuse="loading-dimmer" class="ui active dimmer"><div class="ui loader"></div></div>'
    }]
  }

  var ControlCode = {};
  var GLTFLoader = ActionAppCore.three.addons.GLTFLoader;
  var OrbitControls = ActionAppCore.three.addons.OrbitControls;


  /**
  * Slide Single Animation Manually
  */
  class ManualAnimator {

    constructor(theModel, theAnimations) {
      this.animNames = [];
      this.clipActionIndex = {};
      var self = this;
      this.mixer = new THREE.AnimationMixer(theModel);

      this.animClips = theAnimations.map(function(aVal) {
        var tmpClip = THREE.AnimationClip.findByName(theAnimations, aVal.name);
        var tmpNewClip = self.mixer.clipAction(tmpClip);
        self.clipActionIndex[aVal.name] = tmpNewClip;
        self.animNames.push(aVal.name);
        return tmpNewClip;
      });

    }
    getClip(theName) {
      return this.clipActionIndex[theName];
    }
    gotoTime(theSeconds) {
      this.mixer.time = 0;
      for (var i = 0; i < this.mixer._actions.length; i++) {
        this.mixer._actions[i].time = 0;
      }
      this.mixer.update(theSeconds);
    }
  }




  //===============================
  let model,model2,
  camera,
  renderer,
  currClip,currClip2,
  currAnim = 0;


  ControlCode.cycleAnimationSelection = cycleAnimationSelection;
  function cycleAnimationSelection() {
    if (currClip) {
      currClip.stop();
      currClip2.stop()
    }
    currAnim++;
    if (currAnim >= this.manualControl.animNames.length) {
      currAnim = 0;
    }
    var tmpNewAnimName = this.manualControl.animNames[currAnim];
    currClip = this.manualControl.getClip(tmpNewAnimName);
    currClip2 = this.manualControl2.getClip(tmpNewAnimName);
    this.page.loadSpot('animation-name', tmpNewAnimName);
    currClip.play();
    currClip2.play();
  }

  function loop() {
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }


  ControlCode._onResize = function() {
    var tmpEl = this.getEl();
    this.sizeControl = this.sizeControl || {};
    var sizeControl = this.sizeControl;
    sizeControl.innerWidth = tmpEl.innerWidth();
    sizeControl.innerHeight = tmpEl.innerHeight();
    this.camera.aspect = sizeControl.innerWidth / sizeControl.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(sizeControl.innerWidth, sizeControl.innerHeight);

    this.render();
  }




  ControlCode.render = render;
  function render() {
    if (this.renderer)
      this.renderer.render(this.scene, this.camera);
  }


  ControlCode.initScene = initScene;
  function initScene() {
    var self = this;
    
    const container = this.getSpot('puppet_stage').get(0);
    camera = new THREE.PerspectiveCamera(80,
      this.getEl().innerWidth / this.getEl().innerHeight,
      0.1,
      1000);

    camera.position.z = 30;
    camera.position.x = 0;
    camera.position.y = -3;

    this.camera = camera;

    scene = new THREE.Scene();
    this.scene = scene;

    // Add lights
    let hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.9);
    hemiLight.position.set(0, 50, 0);
    // Add hemisphere light to scene
    scene.add(hemiLight);

    let d = 8.25;
    let dirLight = new THREE.DirectionalLight(0xffffff, 0.84);
    dirLight.position.set(-8, 12, 8);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024);
    dirLight.shadow.camera.near = 0.1;
    dirLight.shadow.camera.far = 1500;
    dirLight.shadow.camera.left = d * -1;
    dirLight.shadow.camera.right = d;
    dirLight.shadow.camera.top = d;
    dirLight.shadow.camera.bottom = d * -1;
    // Add directional Light to scene
    scene.add(dirLight);






    renderer = new THREE.WebGLRenderer( {
      antialias: true,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(this.getEl().innerWidth, this.getEl().innerHeight);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1;
    container.appendChild(renderer.domElement);
    this.renderer = renderer;

    var toRender = render.bind(self);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', toRender); // use if there is no animation loop
    controls.minDistance = 2;
    controls.maxDistance = 10;
    controls.target.set(0, 0, - 0.2);
    controls.update();


    var tmpPending = [];
    var tmpLoaded = {};

    function loadResource(theLoader, theSource, theName, theTarget) {
      var dfd = jQuery.Deferred();
      var tmpTarget = theTarget || tmpLoaded;
      theLoader.load(theSource, function(theReply) {
        tmpTarget[theName] = theReply;
        dfd.resolve(true);
      })
      return dfd.promise();
    }

    var tmpModelLoc2 = './res/chars/jolleen/v1/';
    var tmpModelName2 = 'jolleen.gltf';

    var tmpModelLoc = './res/chars/michelle/versions/split2/';
    var tmpModelName = 'michelle.gltf';


    const loaderAnim = new GLTFLoader().setPath('./res/chars/stacy/models/');
    const loader = new GLTFLoader().setPath(tmpModelLoc);
    const loader2 = new GLTFLoader().setPath(tmpModelLoc2);
    
    const loaderTexture = new THREE.TextureLoader();
    var mainTexture;
    var gltf;
    tmpPending.push(loadResource(loader, tmpModelName, 'gltf', tmpLoaded));
    tmpPending.push(loadResource(loader2, tmpModelName2, 'gltf2', tmpLoaded));
    tmpPending.push(loadResource(loaderAnim, 'stacy_lightweight.glb', 'gltfanim', tmpLoaded));

    this.mats = {};
    
    $.whenAll(tmpPending).then(function() {
      var tmpRes = tmpLoaded.gltf;
      var tmpRes2 = tmpLoaded.gltf2;
      self.animations = tmpLoaded.gltfanim.animations
      
      
      model = tmpRes.scene;
      model2 = tmpRes2.scene;

      self.model = model;
      model.scale.set(4, 4, 4);
      model.position.y = -4;
      model.position.x = 3;

      self.model2 = model2;
      model2.scale.set(4, 4, 4);
      model2.position.y = -4;
      model2.position.x = -3;
      
      
      window.tmpMats = {};
      //var tmp("Headphone_Inside")
      self.mats.model = {}
      model.traverse(o => {
        if (o.isMesh) {
          if( o.material && o.material.metalness){
            o.material.metalness = 0;
          }
          if( o.material && o.material.name){
            self.mats.model[o.material.name] = o.material;
          }
          
        }
        
      });
      
      self.mats.model2 = {}
      model2.traverse(o => {
        if (o.isMesh) {
          if( o.material && o.material.metalness){
            o.material.metalness = 0;
          }
          if( o.material && o.material.name){
            self.mats.model2[o.material.name] = o.material;
          }
        }
      });
      
      self.mainChar = tmpRes.scene;
      scene.add(model);
      scene.add(model2);


      loop();

     self.manualControl = new ManualAnimator(self.model, self.animations);
     self.manualControl2 = new ManualAnimator(self.model2, self.animations);

      self.moveanim = self.page.getByAttr$({
        ctlname: 'moveanim'
      }).get(0);
      self.moveanim.addEventListener("input",
        (event) => {
          self.manualControl.gotoTime(event.target.value/100);
          self.manualControl2.gotoTime(event.target.value/100);
        });

        

        self.cycleAnimationSelection();
        ThisApp.getByAttr$({appuse:"loading-dimmer"}).remove();

      

    })

    


  }

  
  ControlCode.setup = setup;
  function setup() {
    //--- Placeholder
  }

  
  ControlCode._onInit = _onInit;
  function _onInit() {

    //--- Quick access to parent page
    this.page = this.context.page.controller;
    //--- For transparent browser use
    ThisApp.util.clearToTop(this.getSpot$('puppet_stage'));

    //--- Initialize the 3D scene
    this.initScene();


  }

  var ThisControl = {
    specs: ControlSpecs,
    options: {
      proto: ControlCode,
      parent: ThisApp
    }};
  return ThisControl;
})(ActionAppCore, $);