import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import vertexShader from "./shaders/vertexShader.glsl";
import fragmentShader from "./shaders/fragmentShader.glsl";
import vertexParticlesInitial from './shaders/vertexParticlesInitial.glsl';
import { getRandomColor } from "./utils.js";
import simVertex from "./shaders/simVertex.glsl";
import simFragment from "./shaders/simFragment.glsl";
class Sketch {
  constructor(containerId) {
    this.container = document.getElementById(containerId);

    // Основные параметры
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.scene = this.createScene();
    this.camera = this.createCamera();
    this.renderer = this.createRenderer();
    this.controls = this.addOrbitControls();
    this.cube = this.createCube();
    this.clock;
    this.time = 0;
    this.fboTexture;
    this.material;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2(0, 0);
    this.dummy;
    // Запускаем инициализацию
    this.init();
  }

  async init() {
    this.clock = new THREE.Clock();

    // Обработчики событий
    this.addEventListeners();

    // Добавляем освещение
    this.addLight();

    this.setupFBO();
    this.createCube();

    // Добавляем объекты на сцену
    this.addObjects();

    // Запуск анимации
    this.animate();
  }

  getRenderTarget() {
    const renderTarget = new THREE.WebGLRenderTarget(this.width, this.height, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
    });

    return renderTarget;
  }

  setupFBO() {
    this.size = 256;
    this.fbo = this.getRenderTarget();
    this.fbo1 = this.getRenderTarget();

    this.fboScene = new THREE.Scene();
    this.fboCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.fboCamera.position.set(0, 0, 0.5);
    this.fboCamera.lookAt(0, 0, 0);

    let geometry = new THREE.PlaneGeometry(2, 2);

    this.data = new Float32Array(this.size * this.size * 4);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let index = (i + j * this.size) * 4;
        let theta = Math.random() * Math.PI * 2;
        let r = 0.5 + 0.5 * Math.random();
        this.data[index + 0] = r * Math.cos(theta);
        this.data[index + 1] = r * Math.sin(theta);
        this.data[index + 2] = 1;
        this.data[index + 3] = 1;
      }
    }

    this.fboTexture = new THREE.DataTexture(
      this.data,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.fboTexture.magFilter = THREE.NearestFilter;
    this.fboTexture.minFilter = THREE.NearestFilter;
    this.fboTexture.needsUpdate = true;

    this.fboMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uPositions: { value: this.fboTexture },
        uInfo: {value: null},
        time: { value: 0 },
        uMouse: { value: new THREE.Vector2(0,0)}
      },
      vertexShader: simVertex,
      fragmentShader: simFragment,
    });

    this.infoarray = new Float32Array(this.size * this.size * 4);

    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let index = (i + j * this.size) * 4;
        let theta = Math.random() * Math.PI * 2;
        let r = 0.5 + 0.5 * Math.random();
        this.infoarray[index + 0] = 0.5 + Math.random();
        this.infoarray[index + 1] = 0.5 + Math.random();
        this.infoarray[index + 2] = 1;
        this.infoarray[index + 3] = 1;
      }
    }

    this.info = new THREE.DataTexture(
      this.infoarray,
      this.size,
      this.size,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this.info.magFilter = THREE.NearestFilter;
    this.info.minFilter = THREE.NearestFilter;
    this.info.needsUpdate = true;
    this.fboMaterial.uniforms.uInfo.value = this.info;


    this.fboMesh = new THREE.Mesh(geometry, this.fboMaterial);
    this.fboScene.add(this.fboMesh);

    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.fboScene, this.fboCamera);
    this.renderer.setRenderTarget(this.fbo1);
    this.renderer.render(this.fboScene, this.fboCamera);
  }

  // Создание сцены
  createScene() {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x333333);
    return scene;
  }

  // Создание камеры
  createCamera() {
    const fov = 70;
    const aspect = this.width / this.height;
    const near = 0.1;
    const far = 1000;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 0, 5);
    return camera;
  }

  // Создание рендера
  createRenderer() {
    const renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(this.width, this.height);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    if (this.container) {
      this.container.appendChild(renderer.domElement);
    } else {
      console.error(`Элемент с id "${this.containerId}" не найден.`);
    }

    return renderer;
  }

  addLight() {
    const hemiLight = new THREE.HemisphereLight(0x099ff, 0xaa5500);
    this.scene.add(hemiLight);

    // this.scene.fog = new THREE.FogExp2(0x000000, 0.3);
  }

  createCube() {
    // this.size = 256;
    this.material = new THREE.ShaderMaterial({
      extensions: {
        directives: '#extension GL_OES_standard_derivatives : enable'
      },
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        time: { value: 0 },
        uPositions: { value: null },
        resolution: { value: new THREE.Vector4() }
      },
      vertexShader: vertexParticlesInitial,
      fragmentShader: fragmentShader,
    });
    this.count = this.size**2;
    let geometry = new THREE.BufferGeometry();
    let positions = new Float32Array(this.count * 3);
    let uv = new Float32Array(this.count * 2);
    for (let i = 0; i < this.size; i++) {
      for (let j = 0; j < this.size; j++) {
        let index = (i + j * this.size);
        positions[index * 3 + 0] = Math.random();
        positions[index * 3 + 1] = Math.random();
        positions[index * 3 + 2] = 0;
        uv[index * 2 + 0] = i / this.size;
        uv[index * 2 + 1] = j / this.size;
      }
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));

    this.material.uniforms.uPositions.value = this.fboTexture;
    this.points = new THREE.Points(geometry, this.material)
    this.scene.add(this.points)
  }

  // Добавление OrbitControls
  addOrbitControls() {
    return new OrbitControls(this.camera, this.renderer.domElement);
  }

  addObjects() {
    // this.scene.add(this.cube);
  }

  // Обработчик изменения размеров окна
  onWindowResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
  }

  onMouseMove(evt) {
    this.pointer.x = (evt.clientX / this.width) * 2 - 1;
    this.pointer.y = -(evt.clientY / this.height) * 2 + 1;

    this.raycaster.setFromCamera(this.pointer, this.camera);
    let intersects = this.raycaster.intersectObject(this.dummy);
    if (intersects.length > 0) {
      let {x, y} = intersects[0].point;
      this.fboMaterial.uniforms.uMouse.value = new THREE.Vector2(x, y)
    }

  }

  // Добавление обработчиков событий
  addEventListeners() {
    this.dummy = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshBasicMaterial()
    )
    window.addEventListener("resize", this.onWindowResize.bind(this));

    window.addEventListener("mousemove", this.onMouseMove.bind(this), false);
  }

  // Анимация
  animate() {
    // this.cube.material.uniforms.time.value = delta;
    this.time += 0.05;
    const delta = this.clock.getDelta();
    this.material.uniforms.time.value = this.time;
    this.fboMaterial.uniforms.time.value = this.time;
    requestAnimationFrame(this.animate.bind(this));

    this.fboMaterial.uniforms.uPositions.value = this.fbo1.texture;
    this.material.uniforms.uPositions.value = this.fbo.texture;

    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.fboScene, this.fboCamera);
    this.renderer.setRenderTarget(null);
    this.renderer.render(this.scene, this.camera);

    // this.controls.update();
    // this.renderer.setRenderTarget(null);
    // this.renderer.render(this.fboScene, this.fboCamera)

    let temp = this.fbo;
    this.fbo = this.fbo1;
    this.fbo1 = temp;
  }
}

// Запуск инициализации, передаем id элемента
export default Sketch;

// Чтобы запустить, просто нужно создать экземпляр класса
// const sketch = new Sketch('canvas');
