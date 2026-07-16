export const COMMON_WORDS = [
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i", "it", "for", "not", "on", "with", 
  "he", "as", "you", "do", "at", "this", "but", "his", "by", "from", "they", "we", "say", "her", "she", 
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what", "so", "up", "out", "if", 
  "about", "who", "get", "which", "go", "me", "when", "make", "can", "like", "time", "no", "just", 
  "him", "know", "take", "people", "into", "year", "your", "good", "some", "could", "them", "see", 
  "other", "than", "then", "now", "look", "only", "come", "its", "over", "think", "also", "back", 
  "after", "use", "two", "how", "our", "work", "first", "well", "way", "even", "new", "want", 
  "because", "any", "these", "give", "day", "most", "us", "are", "was", "were", "been", "has", "had",
  "more", "write", "go", "see", "number", "no", "way", "could", "people", "my", "than", "first",
  "water", "been", "call", "who", "oil", "its", "now", "find", "long", "down", "day", "did", "get",
  "come", "made", "may", "part", "over", "new", "sound", "take", "only", "little", "work", "know",
  "place", "year", "live", "me", "back", "give", "most", "very", "after", "thing", "our", "just",
  "name", "good", "sentence", "man", "think", "say", "great", "where", "help", "through", "much",
  "before", "line", "right", "too", "mean", "any", "same", "tell", "boy", "follow", "came", "want",
  "show", "also", "around", "farm", "three", "small", "set", "put", "end", "does", "another", "well",
  "large", "must", "big", "even", "such", "because", "turn", "here", "why", "ask", "went", "men",
  "read", "need", "land", "different", "home", "us", "move", "try", "kind", "hand", "picture",
  "again", "change", "off", "play", "spell", "air", "away", "animal", "house", "point", "page",
  "letter", "mother", "answer", "found", "study", "still", "learn", "should", "america", "world",
  "high", "every", "near", "add", "food", "between", "own", "below", "country", "plant", "last",
  "school", "father", "keep", "tree", "never", "start", "city", "earth", "eyes", "light", "thought",
  "head", "under", "story", "saw", "left", "don't", "few", "while", "along", "might", "close",
  "something", "seem", "next", "hard", "open", "example", "begin", "life", "always", "those",
  "both", "paper", "together", "got", "group", "often", "run", "important", "until", "children",
  "side", "feet", "car", "mile", "night", "walk", "white", "sea", "began", "grow", "took", "river",
  "four", "carry", "state", "once", "book", "hear", "stop", "without", "second", "late", "miss",
  "idea", "enough", "eat", "face", "watch", "far", "indian", "real", "almost", "let", "above",
  "girl", "sometimes", "mountain", "cut", "young", "talk", "soon", "list", "song", "being",
  "leave", "family", "it's", "body", "music", "color", "stand", "sun", "questions", "fish", "area",
  "mark", "dog", "horse", "birds", "problem", "complete", "room", "knew", "since", "ever", "piece",
  "told", "usually", "didn't", "friends", "easy", "heard", "order", "red", "door", "sure", "become",
  "top", "ship", "across", "today", "during", "short", "better", "best", "however", "low", "hours",
  "black", "products", "happened", "whole", "measure", "remember", "early", "waves", "reached",
  "listen", "wind", "rock", "space", "covered", "fast", "several", "hold", "himself", "toward",
  "five", "step", "morning", "passed", "simple", "vowel", "true", "hundred", "against", "pattern",
  "numeral", "table", "north", "slow", "money", "map", "farm", "leather", "voice", "sing", "war",
  "ground", "fall", "king", "town", "unit", "figure", "certain", "field", "travel", "wood", "fire",
  "upon", "design", "growth", "valley", "key", "safe", "bad", "flat", "gate", "cool", "clean",
  "design", "serve", "explain", "choose", "grow", "chance", "thick", "blood", "spot", "heavy",
  "drop", "energy", "direct", "fit", "card", "band", "slip", "win", "dream", "lone", "sugar"
];

export function getRandomWords(count: number): string[] {
  const result: string[] = [];
  const totalWords = COMMON_WORDS.length;
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * totalWords);
    result.push(COMMON_WORDS[randomIndex]);
  }
  return result;
}
