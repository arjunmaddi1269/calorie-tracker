/**
 * Dashboard page - Daily calorie summary
 */
import { useState } from 'react';
import { format } from 'date-fns';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useFood } from '../hooks/useFood';
import { useNavigate } from 'react-router-dom';
import { Camera, TrendingUp, Target, Flame } from 'lucide-react';

export const Dashboard = () => {
  const navigate = useNavigate();
  const [selectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { useDailySummary, useFoodLogs } = useFood();

  const { data: summary, isLoading: isSummaryLoading } = useDailySummary(selectedDate);
  const { data: foodLogs, isLoading: isLogsLoading } = useFoodLogs({
    start_date: selectedDate,
    end_date: selectedDate,
  });

  if (isSummaryLoading || isLogsLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  const calorieProgress = summary?.calorie_target
    ? (summary.total_calories / summary.calorie_target) * 100
    : 0;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">{format(new Date(), 'EEEE, MMMM d, yyyy')}</p>
          </div>
          <Button onClick={() => navigate('/log-food')}>
            <Camera className="w-5 h-5 mr-2" />
            Log Food
          </Button>
        </div>

        {/* Calorie Summary Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Today's Calories</h2>
              <Flame className="w-6 h-6 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    {summary?.total_calories || 0} / {summary?.calorie_target || 0} cal
                  </span>
                  <span className="text-sm text-gray-600">
                    {summary?.calories_remaining || 0} remaining
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full transition-all ${
                      calorieProgress > 100 ? 'bg-red-500' : 'bg-primary-600'
                    }`}
                    style={{ width: `${Math.min(calorieProgress, 100)}%` }}
                  />
                </div>
              </div>

              {/* Macros */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(summary?.total_protein_g || 0)}g
                  </p>
                  <p className="text-sm text-gray-600">Protein</p>
                  <p className="text-xs text-gray-500">
                    / {summary?.protein_target || 0}g
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(summary?.total_carbs_g || 0)}g
                  </p>
                  <p className="text-sm text-gray-600">Carbs</p>
                  <p className="text-xs text-gray-500">
                    / {summary?.carbs_target || 0}g
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(summary?.total_fat_g || 0)}g
                  </p>
                  <p className="text-sm text-gray-600">Fat</p>
                  <p className="text-xs text-gray-500">
                    / {summary?.fat_target || 0}g
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Meals */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Today's Meals</h2>
          </CardHeader>
          <CardContent>
            {foodLogs && foodLogs.items.length > 0 ? (
              <div className="space-y-3">
                {foodLogs.items.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      {log.photo_url && (
                        <img
                          src={log.photo_url}
                          alt={log.food_name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">{log.food_name}</h3>
                        <p className="text-sm text-gray-600">
                          {log.meal_type && (
                            <span className="capitalize">{log.meal_type} • </span>
                          )}
                          {format(new Date(log.logged_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">
                        {log.calories} cal
                      </p>
                      <p className="text-xs text-gray-600">
                        P: {Math.round(log.protein_g || 0)}g • C: {Math.round(log.carbs_g || 0)}g • F: {Math.round(log.fat_g || 0)}g
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No meals logged today</p>
                <Button onClick={() => navigate('/log-food')}>
                  Log Your First Meal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/progress')}>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">View Progress</h3>
                <p className="text-sm text-gray-600 mt-1">See your weekly trends</p>
              </div>
              <TrendingUp className="w-8 h-8 text-primary-600" />
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate('/profile')}>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Update Goals</h3>
                <p className="text-sm text-gray-600 mt-1">Adjust your targets</p>
              </div>
              <Target className="w-8 h-8 text-primary-600" />
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};
