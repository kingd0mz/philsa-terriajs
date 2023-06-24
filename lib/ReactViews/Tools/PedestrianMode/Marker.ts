import { Cartesian3 } from "cesium";
import { BillboardGraphics } from "cesium";
import { CallbackProperty } from "cesium";
import { CustomDataSource } from "cesium";
import { Entity } from "cesium";
import MappableMixin from "../../../ModelMixins/MappableMixin";
import CreateModel from "../../../Models/Definition/CreateModel";
import Terria from "../../../Models/Terria";
import MappableTraits from "../../../Traits/TraitsClasses/MappableTraits";

export default class Marker extends MappableMixin(CreateModel(MappableTraits)) {
  _private_dataSource: CustomDataSource;
  _private_icon: RotatableIcon;

  _private_currentRotation = 0;
  position: Cartesian3;

  /**
   * @param terria Terria instance
   * @param iconUrl An HTML image element to use as the marker icon
   * @param position Initial position of the marker icon
   * @param rotation Initial rotation of the marker icon
   */
  constructor(
    override readonly terria: Terria,
    readonly iconUrl: string,
    position: Cartesian3,
    rotation: number
  ) {
    super(undefined, terria);
    this.position = position;
    this._private_dataSource = new CustomDataSource();

    this._private_icon = new RotatableIcon(iconUrl, 24, 24);
    this._private_icon.loadPromise.then(() =>
      this._private_icon.rotate(rotation)
    );

    const entity = new Entity({
      billboard: new BillboardGraphics({
        image: this._private_icon.canvas
      }),
      position: new CallbackProperty(() => this.position, false) as any
    });

    this._private_dataSource.entities.add(entity);
  }

  /**
   * Set marker rotation in radians
   */
  set rotation(rotation: number) {
    // round to 2 decimal places to minimize rotation updates
    const newRotation = Math.round(rotation * 100) / 100;
    if (this._private_currentRotation !== newRotation) {
      this._private_icon.rotate(newRotation);
      this._private_currentRotation = newRotation;
    }
  }

  async _protected_forceLoadMapItems() {}

  get mapItems() {
    return [this._private_dataSource];
  }
}

/**
 * A dynamically rotatable icon
 *
 * This class provides a {@canvas} instance with the rotated image drawn on it.
 * The canvas instance can be used as an image parameter in Billboard graphics
 * or other entities drawn by Cesium/Leaflet instances.
 */
class RotatableIcon {
  private image: HTMLImageElement;
  private ctx: CanvasRenderingContext2D | undefined;

  // The canvas on which the icon is drawn and transformed
  public canvas: HTMLCanvasElement;

  // Resolves when the icon image is loaded and ready to be drawn
  public loadPromise: Promise<void>;

  /**
   * @param iconUrl The url of the icon image
   * @param width Optional icon width.
   *              If given, the image will be scaled to this width
   *              otherwise we use the image width.
   * @param height Optional icon height.
   *              If given, the image will be scaled to this height
   *              otherwise we use the image height.
   */
  constructor(iconUrl: string, width?: number, height?: number) {
    this.image = new Image();
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d") ?? undefined;
    this.image.src = iconUrl;
    this.loadPromise = new Promise((resolve) => {
      this.image.addEventListener("load", () => {
        this.canvas.width = width ?? this.image.width;
        this.canvas.height = height ?? this.image.height;
        resolve();
      });
    });
  }

  /**
   * Rotate the icon by the given angle
   *
   * @param rotation Angle in radians
   */
  rotate(rotation: number) {
    if (this.ctx === undefined || this.image.complete === false) {
      return;
    }

    const image = this.image;
    const ctx = this.ctx;
    const canvas = this.canvas;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // translate so that we rotate about the image center
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(rotation);
    ctx.drawImage(
      image,
      // x & y coordinate to draw the image relative to the translated center
      -canvas.width / 2,
      -canvas.height / 2,
      // scales the image to fit the canvas width & height
      canvas.width,
      canvas.height
    );
    ctx.restore();
  }
}
