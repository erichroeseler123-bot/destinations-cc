import { trackEvent } from '@/lib/analytics';
import { RecommendationInputs, RecommendationResult } from './tourRecommendationRules';

export class RecommendationAnalyticsTracker {
  private flowStarted: boolean = false;
  private resultShownTracked: boolean = false;

  public trackFlowStarted(surface: string) {
    if (!this.flowStarted) {
      trackEvent("recommendation_flow_started", { surface });
      this.flowStarted = true;
    }
  }

  public trackAnswerSelected(answer: string) {
    trackEvent("recommendation_answer_selected", { answer });
  }

  public trackResultShown(result: RecommendationResult | null, answers: Partial<RecommendationInputs>, surface: string) {
    if (result && !this.resultShownTracked) {
      trackEvent("recommendation_result_shown", {
        surface,
        planning_window: answers.planningWindow,
        available_time: answers.availableTime,
        transportation_need: answers.transportation,
        group_style: answers.groupStyle,
        mixed_ages: answers.mixedAges,
        historical_interest: answers.historicalInterest,
        primary_recommendation: result.primary.tourSlug,
        secondary_recommendation: result.secondary?.tourSlug || null
      });
      this.resultShownTracked = true;
    }
  }

  public trackPrimarySelected() {
    trackEvent("primary_recommendation_selected", {});
  }

  public trackSecondarySelected() {
    trackEvent("secondary_recommendation_selected", {});
  }

  public trackHelpRequested() {
    trackEvent("recommendation_help_requested", {});
  }

  public resetResultTracking() {
    this.resultShownTracked = false;
  }

  public resetFlowTracking() {
    this.flowStarted = false;
    this.resultShownTracked = false;
  }
}
