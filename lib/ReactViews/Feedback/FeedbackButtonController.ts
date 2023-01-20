import { action } from "mobx";
import isDefined from "../../Core/isDefined";
import overridableComputed from "../../Core/overridableComputed";
import ViewState from "../../ReactViewModels/ViewState";
import { GLYPHS } from "../../Styled/Icon";
import MapNavigationItemController from "../../ViewModels/MapNavigation/MapNavigationItemController";

export const FEEDBACK_TOOL_ID = "feedback";

export class FeedbackButtonController extends MapNavigationItemController {
  constructor(private viewState: ViewState) {
    super();
  }
  get glyph(): any {
    return GLYPHS.feedback;
  }
  get viewerMode() {
    return undefined;
  }

  @action.bound
  activate() {
    this.viewState.feedbackFormIsVisible = true;
    super.activate();
  }

  @action.bound
  deactivate() {
    this.viewState.feedbackFormIsVisible = false;
    super.deactivate();
  }

  @overridableComputed
  get visible() {
    return (
      isDefined(this.viewState.terria.configParameters.feedbackUrl) &&
      !this.viewState.hideMapUi &&
      super.visible
    );
  }

  @overridableComputed
  get active() {
    return this.viewState.feedbackFormIsVisible;
  }
}
