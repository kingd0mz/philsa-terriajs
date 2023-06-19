import { makeObservable, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import React from "react";
import { createGuid } from "cesium";
import LatLonHeight from "../../../Core/LatLonHeight";
import GeoJsonCatalogItem from "../../../Models/Catalog/CatalogItems/GeoJsonCatalogItem";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import createStratumInstance from "../../../Models/Definition/createStratumInstance";
import Terria from "../../../Models/Terria";
import StyleTraits from "../../../Traits/TraitsClasses/StyleTraits";

interface PropsType {
  terria: Terria;
  color: string;
  point: LatLonHeight;
}

@observer
export default class PointOnMap extends React.Component<PropsType> {
  @observable
  pointItem?: GeoJsonCatalogItem;

  constructor(props: PropsType) {
    super(props);
    makeObservable(this);
  }

  override componentDidMount() {
    runInAction(() => {
      const props = this.props;
      const pointItem = new GeoJsonCatalogItem(createGuid(), props.terria);
      pointItem.setTrait(
        CommonStrata.user,
        "style",
        createStratumInstance(StyleTraits, {
          "stroke-width": 3,
          "marker-size": "30",
          stroke: "#ffffff",
          "marker-color": props.color,
          "marker-opacity": 1
        })
      );
      pointItem.setTrait(CommonStrata.user, "geoJsonData", {
        type: "Feature",
        properties: {},
        geometry: {
          type: "Point",
          coordinates: [props.point.longitude, props.point.latitude]
        }
      });
      props.terria.addModel(pointItem);
      props.terria.overlays.add(pointItem);
      this.pointItem = pointItem;
    });
  }

  override componentWillUnmount() {
    runInAction(() => {
      if (this.pointItem) {
        this.props.terria.overlays.remove(this.pointItem);
        this.props.terria.removeModelReferences(this.pointItem);
      }
    });
  }

  override render() {
    return null;
  }
}
