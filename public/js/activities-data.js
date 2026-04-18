// Central activity keyword registry
// Add new activities here — they automatically connect to everything else
// Keywords are behind-the-scenes; users see "Similar activities" based on shared tags

window.ACTIVITIES_DATA = {
  "laundry-day-hoops": {
    title: "Laundry Day Hoops",
    tags: ["indoor","physical","active","competitive","math","no-mess","under-15-min","minimal-effort","kid-led","socks","high-energy","ages-3-up","game","household-items"],
    books: ["tired-parents","15-minute-pack","game-pack"],
    age_min: 3
  },
  "color-scavenger-hunt": {
    title: "Color Scavenger Hunt",
    tags: ["indoor","no-mess","under-15-min","zero-effort","kid-led","competitive","colors","learning","ages-2-up","game","language","scavenger"],
    books: ["color-pack","15-minute-pack","game-pack","literacy-language"],
    age_min: 2
  },
  "tape-spider-web": {
    title: "Tape Spider Web",
    tags: ["indoor","tape","physical","active","no-mess","under-15-min","minimal-effort","obstacle-course","ages-3-up","high-energy","game"],
    books: ["tape-pack","active-pack","15-minute-pack"],
    age_min: 3
  },
  "tape-portrait": {
    title: "Tape Portrait",
    tags: ["indoor","tape","art","creative","no-mess","under-30-min","minimal-effort","ages-3-up","kid-led","body-awareness"],
    books: ["tape-pack","art-pack"],
    age_min: 3
  },
  "number-box": {
    title: "Number Box",
    tags: ["indoor","math","cardboard","physical","competitive","no-mess","under-15-min","minimal-effort","ages-4-up","game","learning","socks","household-items"],
    books: ["15-minute-pack","game-pack","learning-through-play"],
    age_min: 4
  },
  "avalanche": {
    title: "Avalanche",
    tags: ["outdoor","physical","active","high-energy","minimal-effort","cushions","ages-3-up","competitive","kid-led","backyard","gross-motor"],
    books: ["outdoor-pack","active-pack"],
    age_min: 3
  },
  "tattoo-parlor": {
    title: '"Tattoo" Parlor',
    tags: ["indoor","art","creative","no-mess","under-30-min","tired-parents","parent-lies-down","body-markers","ages-3-up","calm","kid-led"],
    books: ["tired-parents","art-pack"],
    age_min: 3
  },
  "mt-mom-and-dad": {
    title: "Mt. Mom and Dad",
    tags: ["indoor","physical","active","no-mess","under-30-min","tired-parents","parent-lies-down","ages-2-up","competitive","high-energy","gross-motor"],
    books: ["tired-parents","active-pack"],
    age_min: 2
  },
  "stuffy-hideout": {
    title: "Stuffy Hideout",
    tags: ["indoor","no-mess","under-15-min","zero-effort","kid-led","game","language","imaginative","ages-3-up","stuffed-animals","hot-cold","listening"],
    books: ["15-minute-pack","game-pack","literacy-language"],
    age_min: 3
  },
    "shadow-theater-night": {
    title: "Shadow Theater Night",
    tags: ["indoor","no-mess","under-30-min","tired-parents","parent-lies-down","storytelling","imaginative","creative","language","literacy-language","ages-3-up","calm","flashlight","improv","zero-effort"],
    books: ["tired-parents","literacy-language","calm-pack"],
    age_min: 3
  },
  "shadow-puppet-theater": {
    title: "Shadow Puppet Theater",
    tags: ["indoor","no-mess","under-15-min","creative","imaginative","dark","flashlight","language","storytelling","ages-3-up","zero-effort","calm","literacy-language"],
    books: ["15-minute-pack","literacy-language","calm-pack"],
    age_min: 3
  },
  "paper-airplane-lab": {
    title: "Paper Airplane Lab",
    tags: ["indoor","paper","under-15-min","low-mess","minimal-effort","science","engineering","competitive","ages-4-up","game","stem","household-items"],
    books: ["15-minute-pack","stem-pack","game-pack"],
    age_min: 4
  },
  "blind-drawing-challenge": {
    title: "Blind Drawing Challenge",
    tags: ["indoor","paper","no-mess","under-15-min","zero-effort","creative","language","art","competitive","funny","ages-5-up","game","listening","literacy-language"],
    books: ["15-minute-pack","literacy-language","game-pack","art-pack"],
    age_min: 5
  },
  "fizzing-colors-lab": {
    title: "Fizzing Colors Lab",
    tags: ["indoor","science","medium-mess","under-15-min","parent-assists","learning","colors","ages-3-up","kitchen","stem","sensory"],
    books: ["stem-pack","sensory-pack"],
    age_min: 3
  },
  "three-clue-treasure-hunt": {
    title: "Three-Clue Treasure Hunt",
    tags: ["indoor","no-mess","under-15-min","minimal-effort","game","language","imaginative","competitive","ages-3-up","literacy-language","reading-writing","scavenger"],
    books: ["15-minute-pack","literacy-language","game-pack"],
    age_min: 3
  },
  "freeze-dance-championship": {
    title: "Freeze Dance Championship",
    tags: ["indoor","physical","active","high-energy","no-mess","under-15-min","music","competitive","ages-3-up","game","dancing","listening"],
    books: ["15-minute-pack","active-pack","game-pack"],
    age_min: 3
  }
};

// Find similar activities based on shared tags
// Returns top N activities sorted by tag overlap, excluding current slug
window.getSimilarActivities = function(currentSlug, n) {
  n = n || 3;
  var current = window.ACTIVITIES_DATA[currentSlug];
  if (!current) return [];
  var currentTags = current.tags;
  var scores = [];
  Object.keys(window.ACTIVITIES_DATA).forEach(function(slug) {
    if (slug === currentSlug) return;
    var activity = window.ACTIVITIES_DATA[slug];
    var shared = activity.tags.filter(function(t){ return currentTags.indexOf(t) >= 0; }).length;
    if (shared > 0) scores.push({ slug: slug, title: activity.title, score: shared });
  });
  scores.sort(function(a,b){ return b.score - a.score; });
  return scores.slice(0, n);
};

// Get all activities for a given book/pack
window.getActivitiesForBook = function(bookSlug) {
  return Object.keys(window.ACTIVITIES_DATA).filter(function(slug) {
    return window.ACTIVITIES_DATA[slug].books.indexOf(bookSlug) >= 0;
  }).map(function(slug) {
    return { slug: slug, title: window.ACTIVITIES_DATA[slug].title };
  });
};

// Get save/like count from localStorage
window.getLikedActivities = function() {
  return JSON.parse(localStorage.getItem('savedActivities') || '[]');
};

// Analytics: which tags appear most in liked activities
window.getLikedTagProfile = function() {
  var liked = window.getLikedActivities();
  var tagCounts = {};
  liked.forEach(function(a) {
    var data = window.ACTIVITIES_DATA[a.slug];
    if (!data) return;
    data.tags.forEach(function(t) {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });
  return tagCounts;
};
