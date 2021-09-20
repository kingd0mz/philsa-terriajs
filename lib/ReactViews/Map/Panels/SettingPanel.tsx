import { TFunction } from "i18next";
import { action, computed, observable, runInAction } from "mobx";
import { observer } from "mobx-react";
import Slider from "rc-slider";
import React, { ChangeEvent, ComponentProps, MouseEvent } from "react";
import { withTranslation, WithTranslation } from "react-i18next";
import styled, { withTheme } from "styled-components";
import ImagerySplitDirection from "terriajs-cesium/Source/Scene/ImagerySplitDirection";
import Cesium from "../../../Models/Cesium";
import DefaultTimelineModel from "../../../Models/DefaultTimelineModel";
import Terria from "../../../Models/Terria";
import ViewerMode, { MapViewers } from "../../../Models/ViewerMode";
import ViewState from "../../../ReactViewModels/ViewState";
import Box from "../../../Styled/Box";
import Button, { RawButton } from "../../../Styled/Button";
import Checkbox from "../../../Styled/Checkbox/Checkbox";
import { GLYPHS, StyledIcon } from "../../../Styled/Icon";
import Spacing from "../../../Styled/Spacing";
import Text from "../../../Styled/Text";
import TerriaViewer from "../../../ViewModels/TerriaViewer";
import withTerriaRef from "../../HOCs/withTerriaRef";
import MenuPanel from "../../StandardUserInterface/customizable/MenuPanel";
import Styles from "./setting-panel.scss";

const sides = {
  left: "settingPanel.terrain.left",
  both: "settingPanel.terrain.both",
  right: "settingPanel.terrain.right"
};

type PropTypes = WithTranslation & {
  terria: Terria;
  refFromHOC?: React.Ref<any>;
  viewState: ViewState;
  t: TFunction;
};

@observer
class SettingPanel extends React.Component<PropTypes> {
  /**
   * @param {Props} props
   */
  constructor(props: PropTypes) {
    super(props);
  }

  @observable _hoverBaseMap = null;

  @computed
  get activeMapName() {
    return this._hoverBaseMap
      ? this._hoverBaseMap
      : this.props.terria.mainViewer.baseMap
      ? (this.props.terria.mainViewer.baseMap as any).name
      : "(None)";
  }

  selectBaseMap(baseMap: any, event: MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();
    this.props.terria.mainViewer.setBaseMap(baseMap);
    // this.props.terria.baseMapContrastColor = baseMap.contrastColor;

    // We store the user's chosen basemap for future use, but it's up to the instance to decide
    // whether to use that at start up.
    if (baseMap) {
      const baseMapId = baseMap.uniqueId;
      if (baseMapId) {
        this.props.terria.setLocalProperty("basemap", baseMapId);
      }
    }
  }

  mouseEnterBaseMap(baseMap: any) {
    runInAction(() => {
      this._hoverBaseMap = baseMap.item?.name;
    });
  }

  mouseLeaveBaseMap() {
    runInAction(() => {
      this._hoverBaseMap = null;
    });
  }

  @action
  selectViewer(
    viewer: keyof typeof MapViewers,
    event: MouseEvent<HTMLButtonElement>
  ) {
    const mainViewer = this.props.terria.mainViewer;
    event.stopPropagation();
    this.showTerrainOnSide(sides.both, undefined);
    setViewerMode(viewer, mainViewer);
    // We store the user's chosen viewer mode for future use.
    this.props.terria.setLocalProperty("viewermode", viewer);
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  @action
  showTerrainOnSide(side: any, event?: MouseEvent<HTMLButtonElement>) {
    event?.stopPropagation();

    switch (side) {
      case sides.left:
        this.props.terria.terrainSplitDirection = ImagerySplitDirection.LEFT;
        this.props.terria.showSplitter = true;
        break;
      case sides.right:
        this.props.terria.terrainSplitDirection = ImagerySplitDirection.RIGHT;
        this.props.terria.showSplitter = true;
        break;
      case sides.both:
        this.props.terria.terrainSplitDirection = ImagerySplitDirection.NONE;
        break;
    }

    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  @action
  toggleDepthTestAgainstTerrainEnabled(event: ChangeEvent<HTMLInputElement>) {
    event.stopPropagation();
    this.props.terria.depthTestAgainstTerrainEnabled = !this.props.terria
      .depthTestAgainstTerrainEnabled;
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  render() {
    if (!this.props.terria.mainViewer) {
      return null;
    }
    const { t } = this.props;

    const qualityLabels = {
      0: t("settingPanel.qualityLabels.maximumPerformance"),
      1: t("settingPanel.qualityLabels.balancedPerformance"),
      2: t("settingPanel.qualityLabels.lowerPerformance")
    };
    const currentViewer =
      this.props.terria.mainViewer.viewerMode === ViewerMode.Cesium
        ? this.props.terria.mainViewer.viewerOptions.useTerrain
          ? "3d"
          : "3dsmooth"
        : "2d";

    const useNativeResolution = this.props.terria.useNativeResolution;
    const nativeResolutionLabel = t("settingPanel.nativeResolutionLabel", {
      resolution1: useNativeResolution
        ? t("settingPanel.native")
        : t("settingPanel.screen"),
      resolution2: useNativeResolution
        ? t("settingPanel.screen")
        : t("settingPanel.native")
    });
    const dropdownTheme = {
      inner: Styles.dropdownInner,
      icon: "map"
    };

    const isCesiumWithTerrain =
      this.props.terria.mainViewer.viewerMode === ViewerMode.Cesium &&
      this.props.terria.mainViewer.viewerOptions.useTerrain &&
      this.props.terria.currentViewer &&
      this.props.terria.currentViewer instanceof Cesium &&
      this.props.terria.currentViewer.scene &&
      this.props.terria.currentViewer.scene.globe;

    const supportsDepthTestAgainstTerrain = isCesiumWithTerrain;
    const depthTestAgainstTerrainEnabled =
      supportsDepthTestAgainstTerrain &&
      this.props.terria.depthTestAgainstTerrainEnabled;

    const depthTestAgainstTerrainLabel = depthTestAgainstTerrainEnabled
      ? t("settingPanel.terrain.showUndergroundFeatures")
      : t("settingPanel.terrain.hideUndergroundFeatures");

    if (
      this.props.terria.configParameters.useCesiumIonTerrain ||
      this.props.terria.configParameters.cesiumTerrainUrl
    ) {
      MapViewers["3d"].available = true;
    }

    const supportsSide = isCesiumWithTerrain;

    let currentSide = sides.both;
    if (supportsSide) {
      switch (this.props.terria.terrainSplitDirection) {
        case ImagerySplitDirection.LEFT:
          currentSide = sides.left;
          break;
        case ImagerySplitDirection.RIGHT:
          currentSide = sides.right;
          break;
      }
    }

    const timelineStack = this.props.terria.timelineStack;
    const alwaysShowTimeline =
      timelineStack.defaultTimeVarying !== undefined &&
      timelineStack.defaultTimeVarying.startTimeAsJulianDate !== undefined &&
      timelineStack.defaultTimeVarying.stopTimeAsJulianDate !== undefined &&
      timelineStack.defaultTimeVarying.currentTimeAsJulianDate !== undefined;

    const alwaysShowTimelineLabel = alwaysShowTimeline
      ? t("settingPanel.timeline.alwaysShowLabel")
      : t("settingPanel.timeline.hideLabel");

    return (
      //@ts-ignore - not yet ready to tackle tsfying MenuPanel
      <MenuPanel
        theme={dropdownTheme}
        btnRef={this.props.refFromHOC}
        btnTitle={t("settingPanel.btnTitle")}
        btnText={t("settingPanel.btnText")}
        viewState={this.props.viewState}
        smallScreen={this.props.viewState.useSmallScreenInterface}
      >
        <Box padded column>
          <Box paddedVertically={1}>
            <Text as="label">{t("settingPanel.mapView")}</Text>
          </Box>
          <FlexGrid gap={1} elementsNo={3}>
            {Object.entries(MapViewers).map(([key, viewerMode]) => (
              <SettingsButton
                key={key}
                isActive={key === currentViewer}
                onClick={(event: any) => this.selectViewer(key as any, event)}
              >
                <Text mini>{t(viewerMode.label)}</Text>
              </SettingsButton>
            ))}
          </FlexGrid>
          {!!supportsSide && (
            <>
              <Spacing bottom={2} />
              <Box column>
                <Box paddedVertically={1}>
                  <Text as="label">{t("settingPanel.terrain.sideLabel")}</Text>
                </Box>
                <FlexGrid gap={1} elementsNo={3}>
                  {Object.values(sides).map((side: any) => (
                    <SettingsButton
                      key={side}
                      isActive={side === currentSide}
                      onClick={(event: any) =>
                        this.showTerrainOnSide(side, event)
                      }
                    >
                      <Text mini>{t(side)}</Text>
                    </SettingsButton>
                  ))}
                </FlexGrid>
              </Box>
              {!!supportsDepthTestAgainstTerrain && (
                <>
                  <Spacing bottom={2} />
                  <Checkbox
                    small
                    id="depthTestAgainstTerrain"
                    title={depthTestAgainstTerrainLabel}
                    isChecked={depthTestAgainstTerrainEnabled}
                    label={t("settingPanel.terrain.hideUnderground")}
                    onChange={this.toggleDepthTestAgainstTerrainEnabled.bind(
                      this
                    )}
                  />
                </>
              )}
            </>
          )}
          <>
            <Spacing bottom={2} />
            <Box column>
              <Box paddedVertically={1}>
                <Text as="label">{t("settingPanel.baseMap")}</Text>
              </Box>
              <Box paddedVertically={1}>
                <Text as="label" mini>
                  {this.activeMapName}
                </Text>
              </Box>
              <FlexGrid gap={1} elementsNo={4}>
                {this.props.terria.baseMapsModel.baseMapItems.map(baseMap => (
                  <StyledBasemapButton
                    key={baseMap.item?.uniqueId}
                    isActive={
                      baseMap.item === this.props.terria.mainViewer.baseMap
                    }
                    onClick={event => this.selectBaseMap(baseMap.item, event)}
                    onMouseEnter={this.mouseEnterBaseMap.bind(this, baseMap)}
                    onMouseLeave={this.mouseLeaveBaseMap.bind(this, baseMap)}
                    onFocus={this.mouseEnterBaseMap.bind(this, baseMap)}
                  >
                    {baseMap.item === this.props.terria.mainViewer.baseMap ? (
                      <Box position="absolute" topRight>
                        <StyledIcon
                          light
                          glyph={GLYPHS.selected}
                          styledWidth={"22px"}
                        />
                      </Box>
                    ) : null}
                    <StyledImage
                      fullWidth
                      alt={baseMap.item ? (baseMap.item as any).name : ""}
                      src={baseMap.image}
                    />
                  </StyledBasemapButton>
                ))}
              </FlexGrid>
            </Box>
          </>
          <>
            <Spacing bottom={2} />
            <Box column>
              <Box paddedVertically={1}>
                <Text as="label">{t("settingPanel.timeline.title")}</Text>
              </Box>
              <Checkbox
                small
                id="alwaysShowTimeline"
                isChecked={alwaysShowTimeline}
                label={t("settingPanel.timeline.alwaysShow")}
                title={alwaysShowTimelineLabel}
                onChange={() => {
                  runInAction(() => {
                    if (alwaysShowTimeline) {
                      this.props.terria.timelineStack.defaultTimeVarying = undefined;
                    } else {
                      this.props.terria.timelineStack.defaultTimeVarying = new DefaultTimelineModel(
                        "defaultTimeVarying",
                        this.props.terria
                      );
                    }
                  });
                }}
              />
            </Box>
          </>
          {this.props.terria.mainViewer.viewerMode !== ViewerMode.Leaflet && (
            <>
              <Spacing bottom={2} />
              <Box column>
                {!this.props.viewState.useSmallScreenInterface && (
                  <>
                    <Box paddedVertically={1}>
                      <Text as="label">
                        {t("settingPanel.imageOptimisation")}
                      </Text>
                    </Box>
                    <Checkbox
                      small
                      id="mapUseNativeResolution"
                      isChecked={useNativeResolution}
                      label={t("settingPanel.nativeResolutionHeader")}
                      title={nativeResolutionLabel}
                      onChange={() => {
                        runInAction(() => {
                          this.props.terria.useNativeResolution = !useNativeResolution;
                        });
                      }}
                    />
                    <Spacing bottom={2} />
                  </>
                )}
                <Box paddedVertically={1}>
                  <Text as="label">{t("settingPanel.mapQuality")}</Text>
                </Box>
                <Box verticalCenter>
                  <Text mini>{t("settingPanel.qualityLabel")}</Text>
                  <Slider
                    min={1}
                    max={3}
                    step={0.1}
                    value={this.props.terria.baseMaximumScreenSpaceError}
                    onChange={val => {
                      runInAction(() => {
                        this.props.terria.baseMaximumScreenSpaceError = val;
                      });
                    }}
                    marks={{ 2: "" }}
                    aria-valuetext={qualityLabels}
                    css={`
                      margin: 0 10px;
                      margin-top: 5px;
                    `}
                  />
                  <Text mini>{t("settingPanel.performanceLabel")}</Text>
                </Box>
              </Box>
            </>
          )}
        </Box>
      </MenuPanel>
    );
  }
}

export const SETTING_PANEL_NAME = "MenuBarMapSettingsButton";
export default withTranslation()(
  withTheme(withTerriaRef(SettingPanel, SETTING_PANEL_NAME) as any)
);

type IFlexGrid = {
  gap: number;
  elementsNo: number;
};

const FlexGrid = styled(Box).attrs({ flexWrap: true })<IFlexGrid>`
  gap: ${props => props.gap * 5}px;
  > * {
    flex: ${props => `1 0 ${getCalcWidth(props.elementsNo, props.gap)}`};
    max-width: ${props => getCalcWidth(props.elementsNo, props.gap)};
  }
`;
const getCalcWidth = (elementsNo: number, gap: number) =>
  `calc(${100 / elementsNo}% - ${gap * 5}px)`;

type IButtonProps = {
  isActive: boolean;
};

const SettingsButton = styled(Button)<IButtonProps>`
  background-color: ${props => props.theme.overlay};
  border: 1px solid
    ${props => (props.isActive ? "rgba(255, 255, 255, 0.5)" : "transparent")};
`;

const StyledBasemapButton = styled(RawButton)<IButtonProps>`
  border-radius: 4px;
  position: relative;
  border: 2px solid
    ${props =>
      props.isActive ? props.theme.turquoiseBlue : "rgba(255, 255, 255, 0.5)"};
`;

const StyledImage = styled(Box).attrs({
  as: "img"
})<ComponentProps<"img">>`
  border-radius: inherit;
`;

export function setViewerMode(
  viewerMode: keyof typeof MapViewers,
  viewer: TerriaViewer
) {
  if (viewerMode === "3d" || viewerMode === "3dsmooth") {
    viewer.viewerMode = ViewerMode.Cesium;
    viewer.viewerOptions.useTerrain = viewerMode === "3d";
  } else if (viewerMode === "2d") {
    viewer.viewerMode = ViewerMode.Leaflet;
  } else {
    console.error(
      `Trying to select ViewerMode ${viewerMode} that doesn't exist`
    );
  }
}
