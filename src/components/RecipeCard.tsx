import { ChefHat, Clock, Users, AlertCircle } from "lucide-react"

type Recipe = {
  title: string
  description: string
  ingredients: string[]
  instructions: string[]
  missingIngredients?: string[]
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className="bg-green-100 p-2 rounded-lg">
          <ChefHat className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{recipe.title}</h3>
          <p className="text-sm text-gray-600 mt-1">{recipe.description}</p>
        </div>
      </div>

      {/* Missing Ingredients Warning */}
      {recipe.missingIngredients && recipe.missingIngredients.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-900">Missing ingredients:</p>
              <p className="text-sm text-amber-700 mt-1">
                {recipe.missingIngredients.join(", ")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Ingredients */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Users className="h-4 w-4" />
          Ingredients
        </h4>
        <ul className="space-y-1">
          {recipe.ingredients.map((ingredient, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start">
              <span className="text-green-600 mr-2">•</span>
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Instructions */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Instructions
        </h4>
        <ol className="space-y-2">
          {recipe.instructions.map((instruction, idx) => (
            <li key={idx} className="text-sm text-gray-700 flex items-start">
              <span className="font-medium text-green-600 mr-2 flex-shrink-0">
                {idx + 1}.
              </span>
              <span>{instruction}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
