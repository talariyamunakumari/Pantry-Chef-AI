"""FastAPI proxy: keeps the Gemini key on the server, validates model output."""
import json, os
from typing import Optional
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ValidationError, field_validator

load_dotenv()
API_KEY = os.getenv("GEMINI_API_KEY")
MODEL = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

app = FastAPI(title="Pantry Chef AI")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"],
                   allow_methods=["*"], allow_headers=["*"])


def to_number(v):
    """Accept 2, '2', '1/2', '1 1/2' as numbers."""
    if isinstance(v, str):
        total = 0.0
        for part in v.split():
            total += (float(part.split("/")[0]) / float(part.split("/")[1])) if "/" in part else float(part)
        return total
    return v


class Ingredient(BaseModel):
    name: str = Field(min_length=1)
    baseAmount: float = Field(default=1, ge=0)
    unit: str = "item"
    category: str = "Pantry"
    substitutions: list[str] = []

    @field_validator("baseAmount", mode="before")
    @classmethod
    def _num(cls, v):
        return to_number(v)


class Step(BaseModel):
    stepNumber: int = 0
    text: str = Field(min_length=1)
    timerMinutes: Optional[float] = None


class Recipe(BaseModel):
    title: str = Field(min_length=1)
    prepTime: str = "10 mins"
    cookTime: str = "15 mins"
    servings: int = Field(default=2, ge=1, le=50)
    difficulty: str = "Easy"
    caloriesPerServing: str = "N/A"
    summary: str = ""
    dietaryTags: list[str] = []
    ingredients: list[Ingredient] = Field(min_length=1)
    steps: list[Step] = Field(min_length=1)
    tips: list[str] = []

    @field_validator("steps", mode="before")
    @classmethod
    def _steps(cls, v):
        if isinstance(v, list):  # allow plain-string steps
            return [{"text": s} if isinstance(s, str) else s for s in v]
        return v


class RecipeRequest(BaseModel):
    ingredients: str = Field(min_length=2, max_length=1000)
    diet: str = "None"
    cookTime: str = "Any"
    skill: str = "Any"


SYSTEM = """You are a professional executive chef.
Create a realistic recipe using the provided kitchen ingredients.
Respond strictly with a valid JSON object matching this schema:

{
  "title": "Aromatic Recipe Title",
  "prepTime": "10 mins",
  "cookTime": "15 mins",
  "servings": 2,
  "difficulty": "Easy" | "Medium" | "Advanced",
  "caloriesPerServing": "350 kcal",
  "summary": "Warm, mouthwatering 1-2 sentence description.",
  "dietaryTags": ["Vegetarian", "Quick & Easy"],
  "ingredients": [
    {
      "name": "Ingredient Name",
      "baseAmount": 2,
      "unit": "cups" | "tbsp" | "g" | "cloves" | "items" | "tsp",
      "category": "Produce" | "Protein" | "Grains" | "Dairy" | "Pantry",
      "substitutions": ["Option A", "Option B"]
    }
  ],
  "steps": [
    {
      "stepNumber": 1,
      "text": "Detailed cooking instruction.",
      "timerMinutes": 3
    }
  ],
  "tips": ["Pro chef tip"]
}
Do not include conversational text or markdown wrappers around the JSON."""


async def call_gemini(req: RecipeRequest) -> str:
    query = (f"Available ingredients: {req.ingredients}. Diet: {req.diet}. "
             f"Max cook time: {req.cookTime}. Skill level: {req.skill}.")
    body = {
        "systemInstruction": {"parts": [{"text": SYSTEM}]},
        "contents": [{"parts": [{"text": query}]}],
        "generationConfig": {"responseMimeType": "application/json", "temperature": 0.7},
    }
    try:
        async with httpx.AsyncClient(timeout=90) as client:
            r = await client.post(URL, json=body, headers={"x-goog-api-key": API_KEY})
    except httpx.TimeoutException:
        raise HTTPException(504, "The AI took too long to respond. Please retry.")
    except httpx.HTTPError:
        raise HTTPException(502, "Could not reach the AI service.")
    if r.status_code == 429:
        raise HTTPException(429, "Rate limit reached. Wait a moment and retry.")
    if r.status_code >= 400:
        try:
            detail = r.json()["error"]["message"]
        except Exception:
            detail = r.text[:200]
        print("GEMINI ERROR", r.status_code, detail)
        raise HTTPException(502, f"AI service error ({r.status_code}): {detail}")
    try:
        cand = r.json()["candidates"][0]
        parts = cand.get("content", {}).get("parts", [])
        text = "".join(p.get("text") or "" for p in parts if not p.get("thought"))
        print("GEMINI finishReason:", cand.get("finishReason"), "| chars:", len(text))
        return text
    except (KeyError, IndexError, TypeError, ValueError):
        print("GEMINI EMPTY RESPONSE:", r.text[:300])
        return ""


def parse(raw: str) -> dict:
    text = (raw or "").strip()
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end <= start:
        raise json.JSONDecodeError("no JSON object found", text, 0)
    return json.loads(text[start:end + 1])


@app.get("/api/health")
def health():
    return {"ok": True, "key_configured": bool(API_KEY), "model": MODEL}


@app.post("/api/recipe")
async def make_recipe(req: RecipeRequest):
    if not API_KEY:
        raise HTTPException(500, "Server has no GEMINI_API_KEY. See README.")
    last_error = "empty response"
    for _ in range(2):  # one automatic retry on bad output
        raw = await call_gemini(req)
        try:
            data = parse(raw)
            if "error" in data:
                raise HTTPException(422, f"No recipe: {data['error']}")
            recipe = Recipe.model_validate(data)
            for i, s in enumerate(recipe.steps, 1):
                s.stepNumber = i  # always sequential
            return recipe.model_dump()
        except (json.JSONDecodeError, ValidationError, ValueError, ZeroDivisionError) as e:
            last_error = type(e).__name__
    raise HTTPException(502, f"The AI returned an unusable recipe ({last_error}). Please retry.")
