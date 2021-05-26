/** @format */

import { createTileGroupsFromBatchIDs } from "ud-viz/src/Components/3DTiles/3DTilesUtils";
import { TemporalGraphWindow } from "ud-viz/src/Widgets/Temporal/View/TemporalGraphWindow";
import { MeshEditorModel } from "./MeshEditorModel";
import { THREE } from "ud-viz";

export class MeshEditorView {
  constructor(goView) {
    //parent
    this.goView = goView;
    //root UI
    this.rootHtml = document.createElement("div");
    this.rootHtml.classList.add("root_MeshEditorView");

    //MeshEditor Model
    if (!goView.model) throw new Error("no model");
    this.model = new MeshEditorModel(goView.model);

    //raycaster
    this.raycaster = new THREE.Raycaster();

    //html
    this.hiddenMeshesList = null;
    this.selectedObject = null;

    this.intersects = null;

    this.init();
  }

  html() {
    return this.rootHtml;
  }

  init() {
    this.model.init();

    this.initUI();

    this.initCallbacks();
  }

  initUI() {
    //Selected Object
    const labelSelectedObjected = document.createElement("div");
    labelSelectedObjected.innerHTML = "Selected Object";
    this.rootHtml.appendChild(labelSelectedObjected);
    this.selectedObject = labelSelectedObjected;

    //hidden meshes preview
    const labelHiddenMeshesList = document.createElement("div");
    labelHiddenMeshesList.innerHTML = "Hidden Meshes";
    this.rootHtml.appendChild(labelHiddenMeshesList);
    const hiddenMeshesList = document.createElement("ul");
    this.rootHtml.appendChild(hiddenMeshesList);
    this.hiddenMeshesList = hiddenMeshesList;

    this.updateUI();
  }

  meshHTML(mesh){
    const _this = this;
    const result = document.createElement('li');
    result.innerHTML = mesh.name;
    result.onmouseover = function() {
      console.log(_this.model.dictMeshParent[mesh]);
      _this.model.dictMeshParent[mesh].add(mesh);
    }

    return result;
  }

  updateUI() {
    const _this = this;
    //update hidden meshes list
    const list = _this.hiddenMeshesList;
    while (list.firstChild) {
      list.removeChild(list.firstChild);
    }

    this.model.getHiddenMeshes().forEach(function (mesh) {
      list.appendChild(_this.meshHTML(mesh));
    });
  }

  dispose() {
    const _this = this;
    const canvas = _this.goView.getRenderer().domElement;
    canvas.onpointermove = null;
    _this.rootHtml.parentElement.removeChild(_this.rootHtml);
  }

  initCallbacks() {
    const _this = this;
    const canvas = _this.goView.getRenderer().domElement;
    const getObjectOnHover = function (event) {
      //1. sets the mouse position with a coordinate system where the center of the screen is the origin
      const mouse = new THREE.Vector2(
        -1 + (2 * event.offsetX) / canvas.clientWidth,
        1 - (2 * event.offsetY) / canvas.clientHeight
      );
      //console.log("mouse", mouse);

      //2. set the picking ray from the camera position and mouse coordinates
      const camera = _this.goView.getCamera();
      const oldNear = camera.near;
      camera.near = 0;
      _this.raycaster.setFromCamera(mouse, camera);
      camera.near = oldNear;

      //3. compute intersections
      _this.intersects = _this.raycaster.intersectObjects(
        _this.goView.getModel().getGameObject().fetchObject3D().children,
        true
      );
      const intersects = _this.intersects;
      if (intersects.length > 0) {
        _this.model.setCurrentMesh(intersects[0].object);
      } else {
        _this.model.setCurrentMesh(null);
      }

      _this.selectedObject.innerHTML = "Name : " + _this.model.getNameCurrentMesh();
    };

    canvas.onpointermove = function (event) {
      getObjectOnHover(event);
    };
    canvas.onpointerdown = function (event) {
      _this.model.addIntersectedObjectInHiddenMeshes();
      _this.updateUI();
    };
  }

}
