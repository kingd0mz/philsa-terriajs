import dateFormat from "dateformat";
import { observer } from "mobx-react";
import PropTypes from "prop-types";
import React from "react";
import { withTranslation } from "react-i18next";
import defined from "terriajs-cesium/Source/Core/defined";
import JulianDate from "terriajs-cesium/Source/Core/JulianDate";
import CommonStrata from "../../../Models/Definition/CommonStrata";
import withControlledVisibility from "../../HOCs/withControlledVisibility";
import CesiumTimeline from "./CesiumTimeline";
import { getOffsetMinutes } from "../../../Core/DateUtils";
import DateTimePicker from "./DateTimePicker";
import Styles from "./timeline.scss";
import TimelineControls from "./TimelineControls";

@observer
class Timeline extends React.Component {
  static propTypes = {
    terria: PropTypes.object.isRequired,
    locale: PropTypes.object,
    t: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      isPickerOpen: false
    };
  }

  componentDidMount() {
    this.props.terria.timelineStack.activate();
  }

  componentWillUnmount() {
    this.props.terria.timelineStack.deactivate();
  }

  changeDateTime(time) {
    this.props.terria.timelineClock.currentTime = JulianDate.fromDate(
      new Date(time)
    );
    this.props.terria.timelineStack.syncToClock(CommonStrata.user);
    this.props.terria.currentViewer.notifyRepaintRequired();
  }

  onOpenPicker() {
    this.setState({
      isPickerOpen: true
    });
  }

  onClosePicker() {
    this.setState({
      isPickerOpen: false
    });
  }

  render() {
    const terria = this.props.terria;
    const catalogItem = terria.timelineStack.top;
    if (
      !defined(catalogItem) ||
      !defined(catalogItem.currentTimeAsJulianDate)
    ) {
      return null;
    }
    const { t } = this.props;

    let jsDate;

    if (defined(catalogItem.timeZone)) {
      try {
        const offset = getOffsetMinutes(catalogItem.timeZone);
        const offsetTime = new JulianDate();
        const adjTime = JulianDate.addMinutes(
          catalogItem.currentDiscreteJulianDate,
          offset,
          offsetTime
        );
        jsDate = JulianDate.toDate(adjTime);
      } catch (e) {
        console.log(e);
        jsDate = JulianDate.toDate(catalogItem.currentTimeAsJulianDate);
      }
    } else {
      jsDate = JulianDate.toDate(catalogItem.currentTimeAsJulianDate);
    }

    const timelineStack = this.props.terria.timelineStack;
    let currentTime;
    if (defined(timelineStack.top) && defined(timelineStack.top.dateFormat)) {
      currentTime = dateFormat(
        jsDate,
        this.props.terria.timelineStack.top.dateFormat
      );
    } else {
      if (defined(catalogItem.timeZone)) {
        const offset = getOffsetMinutes(catalogItem.timeZone);
        const offsetTime = new JulianDate();
        const adjTime = JulianDate.addMinutes(
          catalogItem.currentDiscreteJulianDate,
          offset,
          offsetTime
        );
        if (defined(catalogItem.dateFormat)) {
          currentTime = dateFormat(adjTime, catalogItem.dateFormat);
        } else {
          currentTime = dateFormat(adjTime, "isoDate");
        }
      } else {
        currentTime = dateFormat(jsDate, "isoDate");
      }
    }

    const discreteTimes = catalogItem.discreteTimesAsSortedJulianDates;
    const objectifiedDates = catalogItem.objectifiedDates;
    const currentDiscreteJulianDate = catalogItem.currentDiscreteJulianDate;

    return (
      <div className={Styles.timeline}>
        <div
          className={Styles.textRow}
          css={`
            background: ${(p) => p.theme.dark};
          `}
        >
          <div
            className={Styles.textCell}
            title={t("dateTime.timeline.textCell")}
          >
            <div className={Styles.layerNameTruncated}>{catalogItem.name}</div>
            {currentTime}
          </div>
        </div>
        <div className={Styles.controlsRow}>
          <TimelineControls
            clock={terria.timelineClock}
            analytics={terria.analytics}
            currentViewer={terria.currentViewer}
          />
          <If
            condition={
              defined(discreteTimes) &&
              discreteTimes.length !== 0 &&
              defined(currentDiscreteJulianDate)
            }
          >
            <DateTimePicker
              currentDate={JulianDate.toDate(currentDiscreteJulianDate)}
              dates={objectifiedDates}
              onChange={() => this.changeDateTime()}
              openDirection="up"
              isOpen={this.state.isPickerOpen}
              onOpen={() => this.onOpenPicker()}
              onClose={() => this.onClosePicker()}
              dateFormat={catalogItem.dateFormat}
            />
          </If>
          <CesiumTimeline terria={terria} />
        </div>
      </div>
    );
  }
}

export default withControlledVisibility(withTranslation()(Timeline));
