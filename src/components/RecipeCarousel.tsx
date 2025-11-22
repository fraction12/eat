"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, ChefHat, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Recipe = {
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  missingIngredients?: string[]
}

export function RecipeCarousel({ recipes }: { recipes: Recipe[] }) {
  const [currentIndex, setCurrentIndex] = useState(0)

  if (recipes.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
        <ChefHat className="h-20 w-20 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600 text-lg">No AI-suggested recipes yet</p>
        <p className="text-gray-400 text-sm mt-2">Add items to your inventory to get personalized suggestions</p>
      </div>
    )
  }

  const currentRecipe = recipes[currentIndex]

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % recipes.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + recipes.length) % recipes.length)
  }

  return (
    <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden">
      {/* Recipe Content */}
      <div className="p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-xl">
            <ChefHat className="h-8 w-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">{currentRecipe.title}</h3>
            <p className="text-gray-600">{currentRecipe.description}</p>
          </div>
        </div>

        {/* Missing Ingredients Warning */}
        {currentRecipe.missingIngredients && currentRecipe.missingIngredients.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-amber-900">You'll need:</p>
                <p className="text-amber-700 mt-1">{currentRecipe.missingIngredients.join(", ")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Ingredients */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-green-600" />
              Ingredients
            </h4>
            <ul className="space-y-2">
              {currentRecipe.ingredients.map((ingredient, idx) => (
                <li key={idx} className="text-gray-700 flex items-start">
                  <span className="text-green-600 mr-2 font-bold">•</span>
                  <span>{ingredient}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-green-600" />
              Instructions
            </h4>
            <ol className="space-y-2">
              {currentRecipe.instructions.slice(0, 5).map((instruction, idx) => (
                <li key={idx} className="text-gray-700 flex items-start text-sm">
                  <span className="font-semibold text-green-600 mr-2 flex-shrink-0">
                    {idx + 1}.
                  </span>
                  <span>{instruction}</span>
                </li>
              ))}
              {currentRecipe.instructions.length > 5 && (
                <li className="text-gray-400 text-sm italic">
                  ...and {currentRecipe.instructions.length - 5} more steps
                </li>
              )}
            </ol>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-gray-50 px-8 py-4 flex items-center justify-between border-t border-gray-200">
        <Button
          variant="outline"
          size="sm"
          onClick={prevSlide}
          disabled={recipes.length <= 1}
          className="gap-2"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>

        <div className="flex gap-2">
          {recipes.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentIndex ? "bg-green-600 w-8" : "bg-gray-300 w-2"
              }`}
              aria-label={`Go to recipe ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={nextSlide}
          disabled={recipes.length <= 1}
          className="gap-2"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
