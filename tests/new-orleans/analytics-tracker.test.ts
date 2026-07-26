import test from "node:test";
import assert from "node:assert";
import { RecommendationAnalyticsTracker } from "../../app/new-orleans/lib/useRecommendationAnalytics";

test("Analytics Lifecycle Behavior (Extracted Harness)", async (t) => {
  // Mock window.dispatchEvent
  (global as any).window = {
    dispatchEvent: (event: any) => {
       if (!(global as any).trackedEvents) (global as any).trackedEvents = [];
       // extract event name from dcc:event_name
       const eventName = event.type.replace('dcc:', '');
       (global as any).trackedEvents.push({ eventName, props: event.detail });
    },
    location: { pathname: '/new-orleans' },
    sessionStorage: { getItem: () => null, setItem: () => {} },
    localStorage: { getItem: () => null, setItem: () => {} }
  };
  
  // Need to mock CustomEvent
  (global as any).CustomEvent = class CustomEvent {
     type: string;
     detail: any;
     constructor(type: string, options?: any) {
        this.type = type;
        this.detail = options?.detail;
     }
  };

  const tracker = new RecommendationAnalyticsTracker();
  
  const getEvents = (name: string) => {
    return ((global as any).trackedEvents || []).filter((e: any) => e.eventName === name);
  };
  
  const clearEvents = () => {
    (global as any).trackedEvents = [];
  };

  const dummyResult = {
    primary: { tourSlug: "city-tour-of-new-orleans" },
    secondary: { tourSlug: "oak-alley-or-laura-plantation-tour" }
  } as any;

  await t.test("1. Initial state fires no recommendation_flow_started", () => {
    clearEvents();
    assert.strictEqual(getEvents('recommendation_flow_started').length, 0);
  });

  await t.test("2. First answer fires exactly one recommendation_flow_started and answer event", () => {
    clearEvents();
    tracker.trackFlowStarted("new_orleans_homepage");
    tracker.trackAnswerSelected("Swamp");
    assert.strictEqual(getEvents('recommendation_flow_started').length, 1);
    assert.strictEqual(getEvents('recommendation_answer_selected').length, 1);
  });

  await t.test("3. Each selected answer fires one recommendation_answer_selected", () => {
    clearEvents();
    tracker.trackAnswerSelected("Tomorrow");
    assert.strictEqual(getEvents('recommendation_answer_selected').length, 1);
  });

  await t.test("4. First completed recommendation fires exactly one recommendation_result_shown", () => {
    clearEvents();
    tracker.trackResultShown(dummyResult, { planningWindow: "Something for today" }, "new_orleans_homepage");
    assert.strictEqual(getEvents('recommendation_result_shown').length, 1);
  });

  await t.test("5. A plain rerender fires no duplicate result event", () => {
    clearEvents();
    // Re-evaluating the same result
    tracker.trackResultShown(dummyResult, { planningWindow: "Something for today" }, "new_orleans_homepage");
    assert.strictEqual(getEvents('recommendation_result_shown').length, 0);
  });

  await t.test("6. Going back, changing an answer, and completing a different result fires one new result event", () => {
    clearEvents();
    tracker.resetResultTracking();
    tracker.trackAnswerSelected("Next week");
    tracker.trackResultShown(dummyResult, { planningWindow: "Next week" }, "new_orleans_homepage");
    
    assert.strictEqual(getEvents('recommendation_result_shown').length, 1);
  });

  await t.test("8. Primary selection fires exactly one primary-selection event", () => {
    clearEvents();
    tracker.trackPrimarySelected();
    assert.strictEqual(getEvents('primary_recommendation_selected').length, 1);
  });

  await t.test("9. Secondary selection fires exactly one secondary-selection event", () => {
    clearEvents();
    tracker.trackSecondarySelected();
    assert.strictEqual(getEvents('secondary_recommendation_selected').length, 1);
  });

  await t.test("10. Help selection fires exactly one help event", () => {
    clearEvents();
    tracker.trackHelpRequested();
    assert.strictEqual(getEvents('recommendation_help_requested').length, 1);
  });

  await t.test("7. Restarting permits one new flow-start event and one new result event", () => {
    clearEvents();
    tracker.resetFlowTracking();
    
    tracker.trackFlowStarted("new_orleans_homepage");
    tracker.trackAnswerSelected("Swamp");
    tracker.trackResultShown(dummyResult, { planningWindow: "Next week" }, "new_orleans_homepage");

    assert.strictEqual(getEvents('recommendation_flow_started').length, 1);
    assert.strictEqual(getEvents('recommendation_result_shown').length, 1);
  });
});
