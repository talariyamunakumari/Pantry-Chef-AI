import React, { useState, useEffect, useRef } from 'react';
import { 
  Utensils, ChefHat, Sparkles, Clock, Flame, Users, CheckCircle2, 
  Circle, Play, Pause, RotateCcw, Heart, AlertCircle, 
  RefreshCw, Plus, ArrowRight, BookOpen, Layers, Lightbulb, 
  Settings, Info, Tag, Scale, Bookmark
} from 'lucide-react';

/**
 * DEFAULT CULINARY RECIPES FOR IMMEDIATE DEMO & OFFLINE MODE
 */
const MOCK_RECIPES = [
  {
    title: "Rustic Garlic Egg & Garden Fried Rice",
    prepTime: "10 mins",
    cookTime: "12 mins",
    servings: 2,
    difficulty: "Easy",
    caloriesPerServing: "380 kcal",
    summary: "A comforting kitchen favorite that transforms leftover rice, fresh eggs, and crisp vegetables into a golden, aromatic bowl in under 20 minutes.",
    dietaryTags: ["Vegetarian", "Quick & Easy", "Comfort Food"],
    ingredients: [
      { name: "Cooked jasmine rice (chilled)", baseAmount: 2, unit: "cups", category: "Grains", substitutions: ["Quinoa", "Brown Rice", "Cauliflower Rice"] },
      { name: "Farm fresh eggs", baseAmount: 2, unit: "large", category: "Protein", substitutions: ["Tofu scramble", "Chickpea flour batter"] },
      { name: "Garlic cloves (minced)", baseAmount: 3, unit: "cloves", category: "Produce", substitutions: ["Garlic powder (1/2 tsp)"] },
      { name: "Ripe tomatoes or Bell pepper", baseAmount: 1, unit: "medium", category: "Produce", substitutions: ["Frozen peas & carrots"] },
      { name: "Shredded cheddar or mozzarella", baseAmount: 0.25, unit: "cup", category: "Dairy", substitutions: ["Parmesan", "Nutritional yeast"] },
      { name: "Soy sauce or Tamari", baseAmount: 1.5, unit: "tbsp", category: "Pantry", substitutions: ["Coconut Aminos"] },
      { name: "Unsalted butter or Olive oil", baseAmount: 1, unit: "tbsp", category: "Pantry", substitutions: ["Ghee", "Avocado oil"] }
    ],
    steps: [
      { stepNumber: 1, text: "Finely mince the garlic cloves and dice tomatoes into small, uniform bite-sized pieces.", timerMinutes: 3 },
      { stepNumber: 2, text: "Melt 1/2 tbsp butter in a large skillet over medium heat. Beat eggs, pour into skillet, and gently fold until soft curds form. Remove and set aside on a plate.", timerMinutes: 3 },
      { stepNumber: 3, text: "Add remaining butter and minced garlic to the skillet. Sauté for 30 seconds until fragrant and golden, then fold in diced tomatoes.", timerMinutes: 2 },
      { stepNumber: 4, text: "Add chilled cooked rice to the pan. Break up any clumps with a spatula. Sauté for 3–4 minutes until rice grains are evenly toasted and hot.", timerMinutes: 4 },
      { stepNumber: 5, text: "Drizzle soy sauce over rice, return scrambled eggs to the pan, and sprinkle with cheese. Toss gently until cheese is melted and fluffy.", timerMinutes: 2 }
    ],
    tips: [
      "Using day-old chilled rice prevents the stir-fry from getting soggy.",
      "Garnish with chopped scallions or roasted sesame seeds for added aroma."
    ]
  }
];

// CATEGORIZED PANTRY PRESETS
const PANTRY_CATEGORIES = [
  {
    category: "Fresh Produce",
    items: ["Tomatoes", "Garlic", "Onions", "Spinach", "Bell Peppers", "Potatoes", "Lemon", "Carrots"]
  },
  {
    category: "Proteins",
    items: ["Eggs", "Chicken Breast", "Tofu", "Canned Beans", "Bacon", "Minced Meat", "Shrimp"]
  },
  {
    category: "Dairy & Cheese",
    items: ["Butter", "Cheddar Cheese", "Milk", "Heavy Cream", "Parmesan", "Greek Yogurt", "Mozzarella"]
  },
  {
    category: "Pantry Staples",
    items: ["Rice", "Pasta", "Soy Sauce", "Olive Oil", "Flour", "Honey", "Black Pepper", "Oats"]
  }
];

export default function App() {
  // Input State
  const [ingredientsInput, setIngredientsInput] = useState("2 eggs, 1 tomato, cheddar cheese, leftover rice, garlic, soy sauce");
  const [dietaryPreference, setDietaryPreference] = useState("None");
  const [cookingTimeLimit, setCookingTimeLimit] = useState("Any");
  const [skillLevel, setSkillLevel] = useState("Any");

  // Application & Execution State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawAiResponse, setRawAiResponse] = useState(null);
  const [useMockFallback, setUseMockFallback] = useState(false);

  // Recipe Display State
  const [currentRecipe, setCurrentRecipe] = useState(MOCK_RECIPES[0]);
  const [servingScale, setServingScale] = useState(1);
  const [completedSteps, setCompletedSteps] = useState({});
  const [savedRecipes, setSavedRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState("recipe"); // "recipe", "pantry", "history", "raw"

  // Active Cooking Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerLabel, setTimerLabel] = useState("");
  const timerRef = useRef(null);
  const latest = useRef({ id: 0, ctrl: null }); // guards against stale responses

  // Load saved recipes from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('f2r_culinary_saved_recipes');
      if (saved) setSavedRecipes(JSON.parse(saved));
    } catch (e) {
      console.warn("Storage load notice:", e);
    }
  }, []);

  // Timer Mechanism
  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
      }, 1000);
    } else if (timerSeconds === 0 && timerActive) {
      setTimerActive(false);
      clearInterval(timerRef.current);
      playKitchenChime();
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive, timerSeconds]);

  const playKitchenChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (e) {
      console.log("Timer completed chime");
    }
  };

  const startTimer = (minutes, label) => {
    setTimerSeconds(minutes * 60);
    setTimerLabel(label);
    setTimerActive(true);
  };

  const toggleTimer = () => setTimerActive(!timerActive);
  const resetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
  };

  const toggleStep = (stepNum) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNum]: !prev[stepNum]
    }));
  };

  const addIngredientTag = (item) => {
    const currentList = ingredientsInput.split(',').map(s => s.trim()).filter(Boolean);
    if (!currentList.some(i => i.toLowerCase() === item.toLowerCase())) {
      setIngredientsInput(prev => prev ? `${prev.trim()}, ${item}` : item);
    }
  };

  const clearIngredients = () => setIngredientsInput("");

  /**
   * Safe Structured Recipe Parsing & Validation Layer
   */
  const parseAndValidateRecipe = (text) => {
    let cleanText = text.trim();
    if (cleanText.startsWith("```")) {
      cleanText = cleanText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    }

    let parsed;
    try {
      parsed = JSON.parse(cleanText);
    } catch (e) {
      throw new Error(`JSON Format Error: ${e.message}`);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error("Invalid output received from model.");
    }

    if (!parsed.title || !Array.isArray(parsed.ingredients) || !Array.isArray(parsed.steps)) {
      throw new Error("Missing essential recipe fields (title, ingredients, or steps).");
    }

    return {
      title: parsed.title || "Custom Kitchen Creation",
      prepTime: parsed.prepTime || "10 mins",
      cookTime: parsed.cookTime || "15 mins",
      servings: typeof parsed.servings === 'number' ? parsed.servings : 2,
      difficulty: parsed.difficulty || "Easy",
      caloriesPerServing: parsed.caloriesPerServing || "N/A",
      summary: parsed.summary || "A delicious meal prepared with available pantry ingredients.",
      dietaryTags: Array.isArray(parsed.dietaryTags) ? parsed.dietaryTags : [dietaryPreference].filter(d => d !== "None"),
      ingredients: parsed.ingredients.map((ing, i) => ({
        name: ing.name || `Ingredient ${i + 1}`,
        baseAmount: typeof ing.baseAmount === 'number' ? ing.baseAmount : (parseFloat(ing.baseAmount) || 1),
        unit: ing.unit || "item",
        category: ing.category || "Pantry",
        substitutions: Array.isArray(ing.substitutions) ? ing.substitutions : []
      })),
      steps: parsed.steps.map((st, i) => ({
        stepNumber: st.stepNumber || i + 1,
        text: typeof st === 'string' ? st : (st.text || `Step ${i + 1}`),
        timerMinutes: typeof st.timerMinutes === 'number' ? st.timerMinutes : null
      })),
      tips: Array.isArray(parsed.tips) ? parsed.tips : ["Enjoy your freshly cooked meal!"]
    };
  };

  /**
   * Gemini API Recipe Generator Execution
   */
  const generateRecipe = async () => {
    if (!ingredientsInput.trim()) {
      setError("Please add at least 1 or 2 ingredients from your kitchen.");
      return;
    }

    setLoading(true);
    setError(null);
    setRawAiResponse(null);
    setCompletedSteps({});
    setServingScale(1);

    latest.current.ctrl?.abort();
    const reqId = ++latest.current.id;
    const ctrl = (latest.current.ctrl = new AbortController());

    if (useMockFallback) {
      setTimeout(() => {
        const mock = { ...MOCK_RECIPES[0], title: "Sample recipe (Demo mode)"  };
        const primaryItem = ingredientsInput.split(',')[0].trim();
        mock.title = `Chef's Special ${primaryItem.charAt(0).toUpperCase() + primaryItem.slice(1)} Dish`;
        setCurrentRecipe(mock);
        setRawAiResponse(JSON.stringify(mock, null, 2));
        setLoading(false);
      }, 600);
      return;
    }

        try {
      const response = await fetch("/api/recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredients: ingredientsInput,
          diet: dietaryPreference,
          cookTime: cookingTimeLimit,
          skill: skillLevel,
        }),
        signal: ctrl.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.detail?.toString() || `Server error (${response.status})`);
      if (reqId !== latest.current.id) return; // a newer request replaced this one

      const text = JSON.stringify(data, null, 2);
      setRawAiResponse(text);
      setCurrentRecipe(parseAndValidateRecipe(text));
      setActiveTab("recipe");
    } catch (err) {
      if (err.name === "AbortError" || reqId !== latest.current.id) return;
      console.error(err);
      const msg = err instanceof TypeError ? "Can't reach the server. Is the backend running?" : err.message;
      setError(`${msg} You can switch to Offline Mock Mode to test instantly.`);
    } finally {
      if (reqId === latest.current.id) setLoading(false);
    }
  };
  
  const toggleSaveRecipe = (recipe) => {
    const isAlreadySaved = savedRecipes.some(r => r.title === recipe.title);
    let updated;
    if (isAlreadySaved) {
      updated = savedRecipes.filter(r => r.title !== recipe.title);
    } else {
      updated = [recipe, ...savedRecipes];
    }
    setSavedRecipes(updated);
    try {
      localStorage.setItem('f2r_culinary_saved_recipes', JSON.stringify(updated));
    } catch (e) {
      console.warn("Storage error", e);
    }
  };

  const isSaved = currentRecipe && savedRecipes.some(r => r.title === currentRecipe.title);

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-amber-950 font-sans flex flex-col antialiased">
      
      {/* Header Bar */}
      <header className="bg-[#FFFDF9] border-b border-amber-200/60 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          
          <div className="flex items-center space-x-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-500 to-amber-600 text-white flex items-center justify-center shadow-sm">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-amber-950 flex items-center gap-2 font-serif">
                Pantry Chef AI
                <span className="text-[10px] font-sans font-bold bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Culinary Engine
                </span>
              </h1>
              <p className="text-xs text-amber-800/70 font-medium">Turn what you have into meals you'll love</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            <button
              onClick={() => setActiveTab("recipe")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "recipe"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-amber-900/80 hover:bg-amber-100/50"
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Recipe</span>
            </button>

            <button
              onClick={() => setActiveTab("pantry")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "pantry"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-amber-900/80 hover:bg-amber-100/50"
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span className="hidden sm:inline">Pantry Drawer</span>
            </button>

            <button
              onClick={() => setActiveTab("history")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "history"
                  ? "bg-rose-500 text-white shadow-xs"
                  : "text-amber-900/80 hover:bg-amber-100/50"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span className="hidden sm:inline">Cookbook</span>
              {savedRecipes.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-900 rounded-full font-bold">
                  {savedRecipes.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("raw")}
              className={`p-2 rounded-xl text-xs font-bold transition ${
                activeTab === "raw"
                  ? "bg-amber-200/70 text-amber-950"
                  : "text-amber-800/60 hover:bg-amber-100/50"
              }`}
              title="View LLM Output Data"
            >
              <Layers className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Kitchen Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-3xl p-6 shadow-sm space-y-5">
            
            <div className="flex items-center justify-between border-b border-amber-100 pb-3">
              <label className="text-sm font-extrabold text-amber-950 flex items-center gap-2 font-serif">
                <Utensils className="w-4 h-4 text-rose-500" />
                Ingredients Input
              </label>
              {ingredientsInput && (
                <button 
                  onClick={clearIngredients}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition"
                >
                  Clear all
                </button>
              )}
            </div>

            <textarea
              value={ingredientsInput}
              onChange={(e) => setIngredientsInput(e.target.value)}
              placeholder="e.g., 2 eggs, 1 tomato, cheddar cheese, rice, garlic..."
              className="w-full h-32 p-3.5 text-xs text-amber-950 bg-[#FAF6F0] border border-amber-200 rounded-2xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none placeholder-amber-800/40 font-medium"
            />

            {/* Quick Pantry Tag Add */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-amber-900/80">Quick Add Staples:</span>
                <button 
                  onClick={() => setActiveTab("pantry")}
                  className="text-rose-600 font-semibold hover:underline text-[11px]"
                >
                  Full drawer
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {PANTRY_CATEGORIES[0].items.concat(PANTRY_CATEGORIES[1].items).slice(0, 10).map((item) => (
                  <button
                    key={item}
                    onClick={() => addIngredientTag(item)}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-xl bg-amber-100/60 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-amber-200/60 text-amber-900 transition flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3 text-rose-500" />
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {/* Dietary Filters */}
            <div className="pt-4 border-t border-amber-100 space-y-3">
              <div>
                <label className="text-[11px] font-bold text-amber-900/80 uppercase tracking-wider block mb-1">
                  Dietary Preference
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value)}
                  className="w-full bg-[#FAF6F0] border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-950 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="None">None (Standard)</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Vegan">Vegan</option>
                  <option value="High Protein">High Protein</option>
                  <option value="Keto / Low Carb">Keto / Low Carb</option>
                  <option value="Gluten-Free">Gluten-Free</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[11px] font-bold text-amber-900/80 uppercase tracking-wider block mb-1">
                    Cook Time
                  </label>
                  <select
                    value={cookingTimeLimit}
                    onChange={(e) => setCookingTimeLimit(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-amber-200 rounded-xl px-2.5 py-2 text-xs text-amber-950 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Any">Any Time</option>
                    <option value="Under 15 mins">&lt; 15 mins</option>
                    <option value="Under 30 mins">&lt; 30 mins</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-amber-900/80 uppercase tracking-wider block mb-1">
                    Skill Level
                  </label>
                  <select
                    value={skillLevel}
                    onChange={(e) => setSkillLevel(e.target.value)}
                    className="w-full bg-[#FAF6F0] border border-amber-200 rounded-xl px-2.5 py-2 text-xs text-amber-950 font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Any">Any Level</option>
                    <option value="Beginner">Easy</option>
                    <option value="Intermediate">Intermediate</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              onClick={generateRecipe}
              disabled={loading}
              className="w-full py-3.5 px-5 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 text-white font-bold rounded-2xl text-xs tracking-wide transition shadow-sm flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Crafting Recipe...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate AI Recipe</span>
                </>
              )}
            </button>

            {/* Offline Mock Toggle */}
            <div className="pt-2 border-t border-amber-100 flex items-center justify-between text-[11px] text-amber-800/70">
              <span className="flex items-center gap-1 font-medium">
                <Settings className="w-3.5 h-3.5 text-amber-700" />
                Offline Mock Mode:
              </span>
              <button
                onClick={() => setUseMockFallback(!useMockFallback)}
                className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border transition ${
                  useMockFallback 
                    ? "bg-amber-200/80 text-amber-950 border-amber-300" 
                    : "bg-amber-100/50 text-amber-800 border-amber-200"
                }`}
              >
                {useMockFallback ? "Enabled (Offline)" : "Disabled (Live API)"}
              </button>
            </div>

          </div>

          {/* Cooking Timer Box */}
          <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-3xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-2 font-serif">
                <Clock className="w-4 h-4 text-amber-600" />
                Active Step Timer
              </span>
              {timerSeconds > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                  {timerActive ? "Running" : "Paused"}
                </span>
              )}
            </div>

            {timerSeconds > 0 ? (
              <div className="bg-[#FAF6F0] border border-amber-200 rounded-2xl p-4 text-center">
                <p className="text-xs text-amber-800 font-medium truncate mb-1">{timerLabel || "Kitchen Timer"}</p>
                <div className="text-3xl font-mono font-extrabold text-amber-950 tracking-wider">
                  {Math.floor(timerSeconds / 60).toString().padStart(2, '0')}:
                  {(timerSeconds % 60).toString().padStart(2, '0')}
                </div>
                <div className="flex justify-center space-x-2 mt-3">
                  <button
                    onClick={toggleTimer}
                    className="px-4 py-1.5 bg-rose-500 text-white rounded-xl text-xs font-bold hover:bg-rose-600 transition"
                  >
                    {timerActive ? <Pause className="w-3.5 h-3.5 inline" /> : <Play className="w-3.5 h-3.5 inline" />}
                  </button>
                  <button
                    onClick={resetTimer}
                    className="px-4 py-1.5 bg-amber-200/70 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-300/70 transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5 inline" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-3 bg-[#FAF6F0] rounded-2xl border border-amber-200/60 text-[11px] text-amber-800/70">
                Click <span className="font-bold text-amber-950">"Start Timer"</span> on any cooking step.
              </div>
            )}
          </div>

        </div>

        {/* Right Side: Recipe Studio */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Error Exception Card */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-xs text-rose-900 flex items-start gap-3 shadow-xs">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-rose-950 mb-0.5">Generation Error</h4>
                <p className="text-rose-800 mb-2">{error}</p>
                <button
                  onClick={() => {
                    setUseMockFallback(true);
                    setError(null);
                  }}
                  className="px-3 py-1 bg-rose-100 text-rose-900 hover:bg-rose-200 font-bold rounded-xl text-[11px] transition"
                >
                  Enable Offline Mock Mode
                </button>
              </div>
            </div>
          )}

          {/* Skeleton Loader */}
          {loading && (
            <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-3xl p-8 space-y-6 animate-pulse">
              <div className="h-8 bg-amber-100/70 rounded-xl w-3/4"></div>
              <div className="grid grid-cols-4 gap-3">
                <div className="h-12 bg-amber-100/40 rounded-xl"></div>
                <div className="h-12 bg-amber-100/40 rounded-xl"></div>
                <div className="h-12 bg-amber-100/40 rounded-xl"></div>
                <div className="h-12 bg-amber-100/40 rounded-xl"></div>
              </div>
              <div className="space-y-3 pt-4">
                <div className="h-4 bg-amber-100/60 rounded-xl w-full"></div>
                <div className="h-4 bg-amber-100/60 rounded-xl w-5/6"></div>
              </div>
            </div>
          )}

          {/* MAIN RECIPE TAB */}
          {!loading && activeTab === "recipe" && currentRecipe && (
            <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-7">
              
              <div>
                <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {currentRecipe.dietaryTags.map((tag, i) => (
                      <span key={i} className="text-[11px] font-bold bg-amber-100/80 text-amber-900 border border-amber-200/80 px-3 py-0.5 rounded-full flex items-center gap-1">
                        <Tag className="w-3 h-3 text-rose-500" />
                        {tag}
                      </span>
                    ))}
                    <span className="text-[11px] font-bold bg-amber-200/60 text-amber-950 px-3 py-0.5 rounded-full">
                      {currentRecipe.difficulty}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleSaveRecipe(currentRecipe)}
                    className={`px-3.5 py-1.5 rounded-xl border text-xs font-bold transition flex items-center gap-1.5 ${
                      isSaved
                        ? "bg-rose-50 border-rose-200 text-rose-700"
                        : "bg-white border-amber-200 text-amber-900 hover:bg-amber-50"
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-rose-600 text-rose-600" : ""}`} />
                    <span>{isSaved ? "Saved" : "Save Recipe"}</span>
                  </button>
                </div>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-serif tracking-tight">
                  {currentRecipe.title}
                </h2>
                <p className="text-xs sm:text-sm text-amber-800/80 mt-2 leading-relaxed font-medium">
                  {currentRecipe.summary}
                </p>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF6F0] border border-amber-200/80 p-4 rounded-2xl text-xs">
                <div className="flex items-center space-x-2.5">
                  <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-amber-800/60 block text-[10px] font-bold uppercase">PREP / COOK</span>
                    <span className="font-extrabold text-amber-950">{currentRecipe.prepTime} / {currentRecipe.cookTime}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Users className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-amber-800/60 block text-[10px] font-bold uppercase">SERVINGS</span>
                    <span className="font-extrabold text-amber-950">{currentRecipe.servings} Servings</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-amber-800/60 block text-[10px] font-bold uppercase">CALORIES</span>
                    <span className="font-extrabold text-amber-950">{currentRecipe.caloriesPerServing}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2.5">
                  <ChefHat className="w-4 h-4 text-rose-500 shrink-0" />
                  <div>
                    <span className="text-amber-800/60 block text-[10px] font-bold uppercase">DIFFICULTY</span>
                    <span className="font-extrabold text-amber-950">{currentRecipe.difficulty}</span>
                  </div>
                </div>
              </div>

              {/* Serving Scaler */}
              <div className="flex items-center justify-between flex-wrap gap-3 bg-amber-50/60 border border-amber-200/60 p-3.5 rounded-2xl">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-rose-500" />
                  <span className="text-xs font-bold text-amber-950">Scale Servings:</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4].map((scale) => (
                    <button
                      key={scale}
                      onClick={() => setServingScale(scale)}
                      className={`px-3 py-1 text-xs font-bold rounded-xl transition ${
                        servingScale === scale
                          ? "bg-rose-500 text-white shadow-xs"
                          : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-100/50"
                      }`}
                    >
                      {scale}x ({currentRecipe.servings * scale})
                    </button>
                  ))}
                </div>
              </div>

              {/* Ingredients List */}
              <div>
                <h3 className="text-sm font-extrabold text-amber-950 font-serif mb-4 flex items-center gap-2 border-b border-amber-100 pb-2">
                  <Utensils className="w-4 h-4 text-rose-500" />
                  Ingredients ({servingScale}x Scale)
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentRecipe.ingredients.map((ing, idx) => {
                    const scaledAmount = (ing.baseAmount * servingScale).toFixed(
                      Number.isInteger(ing.baseAmount * servingScale) ? 0 : 1
                    );
                    return (
                      <div key={idx} className="bg-[#FAF6F0] border border-amber-200/80 rounded-2xl p-3.5 flex flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-bold text-amber-950">{ing.name}</span>
                          <span className="text-xs font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-lg whitespace-nowrap">
                            {scaledAmount} {ing.unit}
                          </span>
                        </div>

                        {ing.substitutions && ing.substitutions.length > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/50 text-[11px] text-amber-800/80 flex items-center gap-1.5">
                            <Info className="w-3 h-3 text-amber-600 shrink-0" />
                            <span>Swap: <strong className="text-amber-950 font-semibold">{ing.substitutions.join(", ")}</strong></span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Interactive Steps */}
              <div>
                <div className="flex items-center justify-between mb-4 border-b border-amber-100 pb-2">
                  <h3 className="text-sm font-extrabold text-amber-950 font-serif flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-rose-500" />
                    Interactive Directions
                  </h3>
                  <span className="text-xs font-bold text-amber-800/70">
                    {Object.values(completedSteps).filter(Boolean).length} of {currentRecipe.steps.length} completed
                  </span>
                </div>

                <div className="space-y-3">
                  {currentRecipe.steps.map((step) => {
                    const isDone = completedSteps[step.stepNumber];
                    return (
                      <div
                        key={step.stepNumber}
                        className={`p-4 rounded-2xl border transition ${
                          isDone 
                            ? "bg-[#FAF6F0] border-amber-200/60 opacity-60" 
                            : "bg-white border-amber-200/90 shadow-xs"
                        }`}
                      >
                        <div className="flex items-start space-x-3.5">
                          <button
                            onClick={() => toggleStep(step.stepNumber)}
                            className="mt-0.5 text-amber-400 hover:text-rose-500 transition shrink-0"
                          >
                            {isDone ? (
                              <CheckCircle2 className="w-5 h-5 text-rose-500 fill-rose-100" />
                            ) : (
                              <Circle className="w-5 h-5 text-amber-300" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-amber-900 font-serif">
                                Step {step.stepNumber}
                              </span>

                              {step.timerMinutes && (
                                <button
                                  onClick={() => startTimer(step.timerMinutes, `Step ${step.stepNumber}: ${step.text.slice(0, 30)}...`)}
                                  className="text-[11px] font-bold text-amber-900 bg-amber-100/80 border border-amber-200 hover:bg-amber-200/80 px-2.5 py-0.5 rounded-lg transition flex items-center gap-1.5"
                                >
                                  <Clock className="w-3 h-3 text-amber-700" />
                                  Start {step.timerMinutes}m Timer
                                </button>
                              )}
                            </div>

                            <p className={`text-xs leading-relaxed font-medium ${isDone ? "line-through text-amber-800/60" : "text-amber-950"}`}>
                              {step.text}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chef Tips */}
              {currentRecipe.tips && currentRecipe.tips.length > 0 && (
                <div className="bg-amber-100/40 border border-amber-200/80 rounded-2xl p-4 sm:p-5 space-y-2">
                  <h4 className="text-xs font-extrabold text-amber-950 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                    <Lightbulb className="w-4 h-4 text-amber-600" />
                    Chef Tip
                  </h4>
                  <ul className="space-y-1.5 text-xs text-amber-900/90 font-medium list-disc list-inside">
                    {currentRecipe.tips.map((tip, i) => (
                      <li key={i}>{tip}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          )}

          {/* PANTRY DRAWER TAB */}
          {activeTab === "pantry" && (
            <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="border-b border-amber-100 pb-3">
                <h3 className="text-lg font-extrabold text-amber-950 font-serif flex items-center gap-2">
                  <Utensils className="w-5 h-5 text-rose-500" />
                  Pantry Drawer
                </h3>
                <p className="text-xs text-amber-800/70 mt-0.5">Click any item below to quickly add it to your input prompt.</p>
              </div>

              <div className="space-y-6">
                {PANTRY_CATEGORIES.map((cat, i) => (
                  <div key={i} className="space-y-2.5">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900/80 font-serif">
                      {cat.category}
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {cat.items.map((item) => (
                        <button
                          key={item}
                          onClick={() => addIngredientTag(item)}
                          className="px-3 py-1.5 rounded-xl bg-[#FAF6F0] hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-amber-200 text-amber-950 text-xs font-semibold transition flex items-center gap-1.5"
                        >
                          <Plus className="w-3.5 h-3.5 text-rose-500" />
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* HISTORY COOKBOOK TAB */}
          {activeTab === "history" && (
            <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
              <div className="border-b border-amber-100 pb-3">
                <h3 className="text-lg font-extrabold text-amber-950 font-serif flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-rose-500" />
                  Cookbook ({savedRecipes.length})
                </h3>
                <p className="text-xs text-amber-800/70 mt-0.5">Your saved recipes from past sessions.</p>
              </div>

              {savedRecipes.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed border-amber-200/80 rounded-2xl">
                  <Heart className="w-10 h-10 text-amber-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-amber-800/70">No saved recipes yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedRecipes.map((r, i) => (
                    <div key={i} className="bg-[#FAF6F0] border border-amber-200/80 rounded-2xl p-4 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-amber-950 font-serif">{r.title}</h4>
                        <p className="text-xs text-amber-800/70 line-clamp-2 mt-1 font-medium">{r.summary}</p>
                      </div>
                      <div className="flex items-center justify-between mt-4 pt-2 border-t border-amber-200/60">
                        <span className="text-[11px] text-amber-800/60 font-bold">{r.prepTime} • {r.difficulty}</span>
                        <button
                          onClick={() => {
                            setCurrentRecipe(r);
                            setActiveTab("recipe");
                          }}
                          className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
                        >
                          Cook <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* RAW JSON TAB */}
          {activeTab === "raw" && (
            <div className="bg-[#FFFDF9] border border-amber-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
              <div className="border-b border-amber-100 pb-3">
                <h3 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2 font-serif">
                  <Layers className="w-4 h-4 text-amber-700" />
                  Raw LLM JSON Response
                </h3>
              </div>
              <pre className="bg-amber-950 text-amber-200 border border-amber-900 p-5 rounded-2xl text-xs font-mono overflow-x-auto max-h-96 leading-relaxed">
                {rawAiResponse || "// Generates structured JSON output once you run a prompt query."}
              </pre>
            </div>
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-amber-200/60 bg-[#FFFDF9] py-5 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-amber-800/60 font-medium">
          Fridge-to-Recipe Assistant • Built with React & Google Gemini
        </div>
      </footer>

    </div>
  );
}