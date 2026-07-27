import { trackEvent } from '@/lib/analytics';
import { RecommendationInputs, RecommendationResult } from './tourRecommendationRules';

export class RecommendationAnalyticsTracker {
  private flowStarted: boolean = false;
  private resultShownTracked: boolean = false;
  private surface: string = "unknown";

  public trackFlowStarted(surface: string) {
    this.surface = surface;
    if (!this.flowStarted) {
      trackEvent("recommendation_flow_started", { surface: this.surface });
      this.flowStarted = true;
    }
  }

  public trackAnswerSelected(answer: string) {
    trackEvent("recommendation_answer_selected", { surface: this.surface, answer });
  }

  public trackResultShown(result: RecommendationResult | null, answers: Partial<RecommendationInputs>, surface: string) {
    this.surface = surface;
    if (result && !this.resultShownTracked) {
      trackEvent("recommendation_result_shown", {
        surface: this.surface,
        planning_window: answers.planningWindow,
        available_time: answers.availableTime,
        transportation_need: answers.transportation,
        group_style: answers.groupStyle,
        mixed_ages: answers.mixedAges,
        historical_interest: answers.historicalInterest,
        primary_recommendation: result.primary?.slug || null,
        secondary_recommendation: result.secondary?.slug || null
      });
      this.resultShownTracked = true;
    }
  }

  public trackPrimarySelected() {
    trackEvent("primary_recommendation_selected", { surface: this.surface });
  }

  public trackSecondarySelected() {
    trackEvent("secondary_recommendation_selected", { surface: this.surface });
  }

  public trackHelpRequested() {
    trackEvent("recommendation_help_requested", { surface: this.surface });
  }

  public resetResultTracking() {
    this.resultShownTracked = false;
  }

  public resetFlowTracking() {
    this.flowStarted = false;
    this.resultShownTracked = false;
  }
}
