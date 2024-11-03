"use client";

import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [macros, setMacros] = useState<{
    protein: number;
    carbs: number;
    fat: number;
  } | null>(null);
  const [ingredients, setIngredients] = useState<{
    name: string;
    protein: number;
    carbs: number;
    fat: number;
  }[] | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/analyze-meal", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();

      if (response.ok) {
        setMacros(data.macros);
        setIngredients(data.ingredients || []);
        console.log("Ingredients:", data.ingredients || []); // Add this line
        setSource(data.source);
        setNote(data.note);
      } else {
        setError(data.error || "An error occurred.");
      }
    } catch (error) {
      setError("An error occurred while analyzing the meal.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-100 py-6 flex flex-col justify-center sm:py-12">
      <div className="relative py-3 sm:max-w-xl sm:mx-auto">
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 shadow-lg transform -skew-y-6 sm:skew-y-0 sm:-rotate-6 sm:rounded-3xl"></div>
        <div className="relative px-4 py-10 bg-white shadow-lg sm:rounded-3xl sm:p-20">
          <div className="max-w-md mx-auto">
            <div className="divide-y divide-gray-200">
              <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                <h2 className="text-3xl font-extrabold text-gray-900">
                  Meal Macro Analyzer
                </h2>
                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                  <div>
                    <label
                      htmlFor="meal-photo"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Upload a meal photo
                    </label>
                    <input
                      type="file"
                      id="meal-photo"
                      name="meal-photo"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                  <div>
                    <button
                      type="submit"
                      disabled={!file || loading}
                      className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      {loading ? "Analyzing..." : "Analyze Meal"}
                    </button>
                  </div>
                </form>
              </div>
              {note && <p className="text-gray-500">{note}</p>}
              {ingredients && ingredients.length > 0 && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h3 className="text-xl font-bold">Ingredients:</h3>
                  <ul className="list-disc pl-5">
                    {ingredients.map((ingredient, index) => (
                      <li key={index}>
                        {ingredient.name}: Protein {ingredient.protein}g, Carbs {ingredient.carbs}g, Fat {ingredient.fat}g
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {macros && (
                <div className="py-8 text-base leading-6 space-y-4 text-gray-700 sm:text-lg sm:leading-7">
                  <h3 className="text-xl font-bold">Total Macro Nutrients:</h3>
                  <p>Protein: {macros.protein}g</p>
                  <p>Carbs: {macros.carbs}g</p>
                  <p>Fat: {macros.fat}g</p>
                  <p>Source: {source}</p>
                </div>
              )}
              {error && <p className="text-red-500 mt-4">{error}</p>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
