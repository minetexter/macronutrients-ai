import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get("image") as File;

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    // Initialize Google Gemini (Generative AI) API
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Convert image to base64
    const buffer = await image.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString("base64");

    // Step: Request for meal description, ingredients, and macronutrients
    const result = await model.generateContent([
      {
        inlineData: {
          data: base64Image,
          mimeType: image.type,
        },
      },
      `Identify the meal in the image, describe the ingredients, and provide any context on the type of dish. Include details on each ingredient if possible. Final format for each line of ingredient e.g. *Chicken*: Protein xg, Carbohydrate yg, Fat zg.`,
    ]);

    const response = await result.response;
    const text = await response.text();

    console.log("Gemini response:", text); // Log for debugging

    let source = "estimated"; // Default source
    let ingredients = []; // Initialize an empty array for ingredients

    // Extract ingredients details if available
    const ingredientsText =
      text.match(
        /\*\s*(.+?):\s*(?:Protein (\d+)g,\s*)?(?:Carbohydrate (\d+)g,\s*)?(?:Fat (\d+)g\.)?/g,
      ) || [];

    // Initialize an empty array for ingredients
    ingredients = ingredientsText
      .map((line) => {
        const match = line.match(
          /\*\s*(.+?):\s*(?:Protein (\d+)g,\s*)?(?:Carbohydrate (\d+)g,\s*)?(?:Fat (\d+)g\.)?/,
        );
        if (match) {
          return {
            name: match[1].trim(),
            protein: parseFloat(match[2]) || 0,
            carbs: parseFloat(match[3]) || 0,
            fat: parseFloat(match[4]) || 0,
          };
        }
        return null;
      })
      .filter(Boolean);

    // Calculate total macros from ingredients
    let macros = {
      protein: 0,
      carbs: 0,
      fat: 0,
    };
    ingredients.forEach((ingredient) => {
      console.log("Ingredient:", ingredient);
      macros.protein += ingredient.protein;
      macros.carbs += ingredient.carbs;
      macros.fat += ingredient.fat;
    });

    console.log("Final parsed macros:", macros); // Log the final macros

    return NextResponse.json({
      macros,
      source,
      note: "Estimated based on identified ingredients from the meal description.",
      ingredients, // Include ingredients in the response
    });
  } catch (error) {
    console.error("Error analyzing meal:", error);
    return NextResponse.json(
      { error: "Error analyzing meal" },
      { status: 500 },
    );
  }
}
