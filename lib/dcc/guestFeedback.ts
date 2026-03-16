export type GuestFeedbackSummary = {
  heading: "Traveler Takeaways";
  subtext: "Summarized from guest feedback";
  bullets: string[];
  tags: string[];
};

type GuestFeedbackInput = {
  title: string;
  description?: string | null;
  durationMinutes?: number | null;
  durationText?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
};

function parseDurationMinutes(value?: string | null): number | null {
  if (!value) return null;
  const lower = value.toLowerCase();
  const hours = lower.match(/(\d+(?:\.\d+)?)\s*h(?:ou)?r/);
  if (hours) return Math.round(Number(hours[1]) * 60);
  const minutes = lower.match(/(\d+(?:\.\d+)?)\s*m(?:in)?/);
  if (minutes) return Math.round(Number(minutes[1]));
  return null;
}

function matches(text: string, pattern: RegExp): boolean {
  return pattern.test(text);
}

function addUnique(items: string[], value: string, max = 4) {
  if (items.length >= max) return;
  if (!items.includes(value)) items.push(value);
}

export function summarizeGuestFeedback(
  input: GuestFeedbackInput
): GuestFeedbackSummary | null {
  const rating = typeof input.rating === "number" ? input.rating : null;
  const reviewCount = typeof input.reviewCount === "number" ? input.reviewCount : null;
  if (rating === null && reviewCount === null) return null;

  const text = `${input.title} ${input.description || ""}`.toLowerCase();
  const durationMinutes =
    typeof input.durationMinutes === "number"
      ? input.durationMinutes
      : parseDurationMinutes(input.durationText);

  const bullets: string[] = [];
  const tags: string[] = [];

  const isFood = matches(text, /\b(food|tast|culinary|brunch|dinner|cocktail|brewery|coffee)\b/);
  const isWalking = matches(text, /\b(walk|walking|stroll|neighborhood|district)\b/);
  const isScenic = matches(text, /\b(scenic|view|sunset|glacier|canyon|lookout|helicopter|skyline)\b/);
  const isHistory = matches(text, /\b(history|historic|museum|ghost|cemetery|architecture|plantation)\b/);
  const isWater = matches(text, /\b(cruise|boat|kayak|sail|harbor|river|swamp|snorkel|whale)\b/);
  const isFamily = matches(text, /\b(family|kid|kids|children|zoo|aquarium|all-ages)\b/);
  const isAdventure = matches(text, /\b(hike|hiking|atv|rafting|zipline|adventure|bike|biking)\b/);

  if (reviewCount !== null) {
    if (reviewCount >= 500) {
      addUnique(
        bullets,
        "Guest feedback is broad enough to give a steadier read on pace, logistics, and overall fit."
      );
    } else if (reviewCount >= 100) {
      addUnique(
        bullets,
        "Feedback is fairly consistent on timing, organization, and what the experience feels like in practice."
      );
    }
  }

  if (rating !== null && rating >= 4.7) {
    addUnique(bullets, "Guests usually respond best to clear guiding and a well-organized overall flow.");
    addUnique(tags, "great guides");
  }

  if (isWalking || isAdventure) {
    addUnique(
      bullets,
      durationMinutes !== null && durationMinutes >= 180
        ? "Expect a more active outing, with walking or time on your feet shaping much of the experience."
        : "Guests often mention moderate walking, so comfortable shoes are worth planning for."
    );
    addUnique(tags, durationMinutes !== null && durationMinutes >= 180 ? "active outing" : "moderate walking");
  }

  if (isFood) {
    addUnique(
      bullets,
      "Food-focused experiences are usually valued for local context and variety, not just the amount of food."
    );
    addUnique(tags, "food-focused");
  }

  if (isScenic || isWater) {
    addUnique(
      bullets,
      "Views and scenery are a major part of the appeal, so weather and visibility can noticeably shape the experience."
    );
    addUnique(tags, isWater ? "scenic outing" : "scenic views");
  }

  if (isHistory) {
    addUnique(
      bullets,
      "Guide storytelling often matters as much as the stops themselves, especially for first-time visitors."
    );
    addUnique(tags, "first-time friendly");
  }

  if (isFamily) {
    addUnique(
      bullets,
      "This tends to work well for mixed-age groups when you want something easier to follow than a nightlife-heavy plan."
    );
    addUnique(tags, "family-friendly");
  }

  if (durationMinutes !== null) {
    if (durationMinutes <= 120) {
      addUnique(
        bullets,
        "This is often chosen as a shorter outing that can fit around other plans on the same day."
      );
      addUnique(tags, "easy to fit in");
    } else if (durationMinutes >= 300) {
      addUnique(
        bullets,
        "It usually takes a substantial part of the day, so it works best when this is your main outing."
      );
      addUnique(tags, "longer outing");
    }
  }

  if (bullets.length < 2) {
    addUnique(
      bullets,
      "Guests usually care most about how smoothly the timing, meeting point, and overall pace line up with the rest of the day."
    );
    addUnique(tags, "logistics matter");
  }

  if (bullets.length < 2 && rating !== null) {
    addUnique(
      bullets,
      "Feedback patterns are more useful here for fit and expectations than for comparing one perfect score against another."
    );
  }

  if (tags.length === 0) {
    if (isHistory || isScenic) addUnique(tags, "first-time friendly");
    if (durationMinutes !== null && durationMinutes <= 180) addUnique(tags, "easy to fit in");
    addUnique(tags, "logistics matter");
  }

  return {
    heading: "Traveler Takeaways",
    subtext: "Summarized from guest feedback",
    bullets: bullets.slice(0, 4),
    tags: tags.slice(0, 4),
  };
}
