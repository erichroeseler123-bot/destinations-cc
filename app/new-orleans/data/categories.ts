import { Category } from './types';

const allCategories: Omit<Category, "id">[] = [
  // 16 Parent Categories
  { title: "City & Neighborhood Tours", slug: "city-tours", parentCategoryId: null, priority: 1, status: "live", imageAttributionId: null },
  { title: "Swamp, Bayou & Wildlife", slug: "swamp-tours", parentCategoryId: null, priority: 2, status: "live", imageAttributionId: null },
  { title: "Plantations & River Road", slug: "plantation-tours", parentCategoryId: null, priority: 3, status: "live", imageAttributionId: null },
  { title: "Ghosts, Cemeteries & Haunted New Orleans", slug: "ghost-tours", parentCategoryId: null, priority: 4, status: "draft", imageAttributionId: null },
  { title: "Crime, Vice & Dark History", slug: "true-crime-tours", parentCategoryId: null, priority: 5, status: "draft", imageAttributionId: null },
  { title: "Pirates, Privateers & River History", slug: "pirate-tours", parentCategoryId: null, priority: 6, status: "draft", imageAttributionId: null },
  { title: "Food, Cooking & Culinary Experiences", slug: "food-tours", parentCategoryId: null, priority: 7, status: "draft", imageAttributionId: null },
  { title: "Riverboats, Cruises & Waterfront", slug: "riverboat-cruises", parentCategoryId: null, priority: 8, status: "draft", imageAttributionId: null },
  { title: "Music, Culture & Mardi Gras", slug: "music-tours", parentCategoryId: null, priority: 9, status: "draft", imageAttributionId: null },
  { title: "Walking Tours", slug: "walking-tours", parentCategoryId: null, priority: 10, status: "draft", imageAttributionId: null },
  { title: "Private & Custom Tours", slug: "private-tours", parentCategoryId: null, priority: 11, status: "draft", imageAttributionId: null },
  { title: "Combinations & Full-Day Plans", slug: "combo-tours", parentCategoryId: null, priority: 12, status: "draft", imageAttributionId: null },
  { title: "Family-Friendly New Orleans", slug: "family-tours", parentCategoryId: null, priority: 13, status: "draft", imageAttributionId: null },
  { title: "Adults-Only & After Dark", slug: "night-tours", parentCategoryId: null, priority: 14, status: "draft", imageAttributionId: null },
  { title: "Cruise Passenger Experiences", slug: "cruise-passenger-tours", parentCategoryId: null, priority: 15, status: "draft", imageAttributionId: null },
  { title: "Seasonal & Event Experiences", slug: "seasonal-tours", parentCategoryId: null, priority: 16, status: "draft", imageAttributionId: null },

  // Subcategories
  { title: "City Sightseeing Tours", slug: "city-sightseeing-tours", parentCategoryId: "city-tours", priority: 1, status: "draft", imageAttributionId: null },
  { title: "French Quarter Tours", slug: "french-quarter-tours", parentCategoryId: "city-tours", priority: 2, status: "draft", imageAttributionId: null },
  { title: "Garden District Tours", slug: "garden-district-tours", parentCategoryId: "city-tours", priority: 3, status: "draft", imageAttributionId: null },
  { title: "Architecture Tours", slug: "architecture-tours", parentCategoryId: "city-tours", priority: 4, status: "draft", imageAttributionId: null },
  { title: "Bus Tours", slug: "bus-tours", parentCategoryId: "city-tours", priority: 5, status: "draft", imageAttributionId: null },
  { title: "Walking City Tours", slug: "walking-city-tours", parentCategoryId: "city-tours", priority: 6, status: "draft", imageAttributionId: null },
  
  { title: "Airboat Tours", slug: "airboat-tours", parentCategoryId: "swamp-tours", priority: 1, status: "live", imageAttributionId: null },
  { title: "Small Airboat Tours", slug: "small-airboat-tours", parentCategoryId: "swamp-tours", priority: 2, status: "draft", imageAttributionId: null },
  { title: "Large Airboat Tours", slug: "large-airboat-tours", parentCategoryId: "swamp-tours", priority: 3, status: "draft", imageAttributionId: null },
  { title: "Covered Swamp Boat Tours", slug: "covered-swamp-boat-tours", parentCategoryId: "swamp-tours", priority: 4, status: "live", imageAttributionId: null },
  { title: "Private Swamp Tours", slug: "private-swamp-tours", parentCategoryId: "swamp-tours", priority: 5, status: "draft", imageAttributionId: null },
  { title: "Hotel-Pickup Swamp Tours", slug: "hotel-pickup-swamp-tours", parentCategoryId: "swamp-tours", priority: 6, status: "draft", imageAttributionId: null },
  { title: "Self-Drive Swamp Tours", slug: "self-drive-swamp-tours", parentCategoryId: "swamp-tours", priority: 7, status: "draft", imageAttributionId: null },
  
  { title: "Oak Alley Tours", slug: "oak-alley-tours", parentCategoryId: "plantation-tours", priority: 1, status: "draft", imageAttributionId: null },
  { title: "Laura Plantation Tours", slug: "laura-plantation-tours", parentCategoryId: "plantation-tours", priority: 2, status: "draft", imageAttributionId: null },
  { title: "Whitney Plantation Tours", slug: "whitney-plantation-tours", parentCategoryId: "plantation-tours", priority: 3, status: "draft", imageAttributionId: null },
  { title: "Plantation and Swamp Combinations", slug: "plantation-and-swamp-combinations", parentCategoryId: "plantation-tours", priority: 4, status: "draft", imageAttributionId: null },

  { title: "Cemetery Tours", slug: "cemetery-tours", parentCategoryId: "ghost-tours", priority: 1, status: "draft", imageAttributionId: null },
  { title: "Vampire Tours", slug: "vampire-tours", parentCategoryId: "ghost-tours", priority: 2, status: "draft", imageAttributionId: null },
  { title: "Voodoo and Folklore Tours", slug: "voodoo-and-folklore-tours", parentCategoryId: "ghost-tours", priority: 3, status: "draft", imageAttributionId: null },
  { title: "Haunted Pub Crawls", slug: "haunted-pub-crawls", parentCategoryId: "ghost-tours", priority: 4, status: "draft", imageAttributionId: null },

  { title: "Cooking Demonstrations", slug: "cooking-demonstrations", parentCategoryId: "food-tours", priority: 1, status: "draft", imageAttributionId: null },
  { title: "Hands-On Cooking Classes", slug: "hands-on-cooking-classes", parentCategoryId: "food-tours", priority: 2, status: "draft", imageAttributionId: null },
  { title: "Cocktail Tours", slug: "cocktail-tours", parentCategoryId: "food-tours", priority: 3, status: "draft", imageAttributionId: null },
  { title: "Cooking Classes", slug: "cooking-classes", parentCategoryId: "food-tours", priority: 4, status: "draft", imageAttributionId: null },

  { title: "Jazz Cruises", slug: "jazz-cruises", parentCategoryId: "riverboat-cruises", priority: 1, status: "draft", imageAttributionId: null },
  { title: "Dinner Cruises", slug: "dinner-cruises", parentCategoryId: "riverboat-cruises", priority: 2, status: "draft", imageAttributionId: null }
];

export const CATEGORIES: Record<string, Category> = allCategories.reduce((acc, cat) => {
  acc[cat.slug] = { id: cat.slug, ...cat };
  return acc;
}, {} as Record<string, Category>);
