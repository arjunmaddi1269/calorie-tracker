/**
 * Log Food page - Photo upload and AI analysis
 */
import { useState, useRef } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { useFood } from '../hooks/useFood';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, Loader, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import type { AIFoodAnalysis } from '../types/index';

export const LogFood = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIFoodAnalysis | null>(null);
  const [mealType, setMealType] = useState<string>('snack');

  const { analyzePhoto, logWithPhoto, createFoodLog, isAnalyzing, isLogging } = useFood();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    try {
      const result = await analyzePhoto(selectedFile);
      setAnalysis(result);
      toast.success('Food analyzed successfully!');
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  const handleLogFood = async () => {
    if (!selectedFile) {
      toast.error('Please select a photo first');
      return;
    }

    if (analysis) {
      // Log with existing analysis
      await createFoodLog({
        meal_type: mealType as any,
        food_name: analysis.food_name,
        serving_size: analysis.serving_size,
        serving_unit: analysis.serving_unit,
        calories: analysis.calories,
        protein_g: analysis.protein_g,
        carbs_g: analysis.carbs_g,
        fat_g: analysis.fat_g,
        fiber_g: analysis.fiber_g,
        ai_confidence: analysis.confidence,
        ai_detected_foods: analysis.detected_items,
        is_manual_entry: false,
      });
    } else {
      // Analyze and log in one step
      await logWithPhoto(selectedFile, mealType);
    }

    navigate('/dashboard');
  };

  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setAnalysis(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Log Food</h1>
          <p className="text-gray-600 mt-1">Take a photo or upload an image of your meal</p>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Food Photo</h2>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload Area */}
            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-500 transition-colors">
                <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Upload Food Photo
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Take a photo or select from your device
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="primary"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Select Photo
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Photo Preview */}
                <div className="relative">
                  <img
                    src={previewUrl}
                    alt="Food preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {analysis && (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full flex items-center space-x-2">
                      <Check className="w-4 h-4" />
                      <span className="text-sm font-medium">Analyzed</span>
                    </div>
                  )}
                </div>

                {/* Meal Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Meal Type
                  </label>
                  <div className="grid grid-cols-4 gap-3">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setMealType(type)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          mealType === type
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analysis Results */}
                {analysis && (
                  <Card className="bg-primary-50 border-primary-200">
                    <CardContent className="space-y-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {analysis.food_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Confidence: {Math.round(analysis.confidence * 100)}%
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Calories</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {analysis.calories}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Serving</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {analysis.serving_size} {analysis.serving_unit}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white p-3 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Protein</p>
                          <p className="text-lg font-bold text-gray-900">
                            {Math.round(analysis.protein_g)}g
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Carbs</p>
                          <p className="text-lg font-bold text-gray-900">
                            {Math.round(analysis.carbs_g)}g
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg text-center">
                          <p className="text-sm text-gray-600">Fat</p>
                          <p className="text-lg font-bold text-gray-900">
                            {Math.round(analysis.fat_g)}g
                          </p>
                        </div>
                      </div>

                      {analysis.detected_items && analysis.detected_items.length > 0 && (
                        <div className="bg-white p-3 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Detected Items:
                          </p>
                          <ul className="space-y-1">
                            {analysis.detected_items.map((item, index) => (
                              <li key={index} className="text-sm text-gray-600">
                                • {item.name} ({item.portion}) - {item.calories} cal
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {!analysis ? (
                    <>
                      <Button
                        onClick={handleAnalyze}
                        className="flex-1"
                        isLoading={isAnalyzing}
                      >
                        {isAnalyzing ? (
                          <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          'Analyze Food'
                        )}
                      </Button>
                      <Button onClick={handleReset} variant="outline">
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        onClick={handleLogFood}
                        className="flex-1"
                        isLoading={isLogging}
                      >
                        Log Food
                      </Button>
                      <Button onClick={handleReset} variant="outline">
                        Start Over
                      </Button>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Log (Manual Entry) */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Manual Entry</h2>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Can't take a photo? Log food manually with our search feature (coming soon)
            </p>
            <Button variant="outline" disabled>
              Search Food Database
            </Button>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
