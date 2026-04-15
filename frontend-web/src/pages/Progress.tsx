/**
 * Progress page - Weekly and monthly stats
 */
import { useState } from 'react';
import { Layout } from '../components/layout/Layout';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { useFood } from '../hooks/useFood';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Target, Flame, Scale } from 'lucide-react';

export const Progress = () => {
  const [view, setView] = useState<'week' | 'month'>('week');
  const { useFoodLogs } = useFood();

  // Get last 7 days of data
  const today = new Date();
  const startDate = format(subDays(today, 6), 'yyyy-MM-dd');
  const endDate = format(today, 'yyyy-MM-dd');

  const { data: logsData, isLoading } = useFoodLogs({
    start_date: startDate,
    end_date: endDate,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Layout>
    );
  }

  // Process data for charts
  const dailyData: { [key: string]: { calories: number; protein: number; carbs: number; fat: number } } = {};

  // Initialize all days
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(today, i), 'yyyy-MM-dd');
    dailyData[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
  }

  // Aggregate data by day
  logsData?.items.forEach((log) => {
    const date = log.date;
    if (dailyData[date]) {
      dailyData[date].calories += log.calories;
      dailyData[date].protein += log.protein_g || 0;
      dailyData[date].carbs += log.carbs_g || 0;
      dailyData[date].fat += log.fat_g || 0;
    }
  });

  // Convert to chart data
  const chartData = Object.entries(dailyData).map(([date, data]) => ({
    date: format(new Date(date), 'EEE'),
    fullDate: date,
    calories: Math.round(data.calories),
    protein: Math.round(data.protein),
    carbs: Math.round(data.carbs),
    fat: Math.round(data.fat),
  }));

  // Calculate weekly averages
  const totalCalories = chartData.reduce((sum, day) => sum + day.calories, 0);
  const avgCalories = Math.round(totalCalories / 7);
  const totalProtein = chartData.reduce((sum, day) => sum + day.protein, 0);
  const avgProtein = Math.round(totalProtein / 7);

  // Calculate streak
  const daysLogged = chartData.filter(day => day.calories > 0).length;

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Progress</h1>
            <p className="text-gray-600 mt-1">Track your nutrition journey</p>
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Month
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm text-gray-600">Avg Calories</p>
                <p className="text-2xl font-bold text-gray-900">{avgCalories}</p>
                <p className="text-xs text-gray-500">per day</p>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm text-gray-600">Avg Protein</p>
                <p className="text-2xl font-bold text-gray-900">{avgProtein}g</p>
                <p className="text-xs text-gray-500">per day</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm text-gray-600">Logging Streak</p>
                <p className="text-2xl font-bold text-gray-900">{daysLogged}</p>
                <p className="text-xs text-gray-500">days this week</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex items-center justify-between py-6">
              <div>
                <p className="text-sm text-gray-600">Meals Logged</p>
                <p className="text-2xl font-bold text-gray-900">{logsData?.items.length || 0}</p>
                <p className="text-xs text-gray-500">this week</p>
              </div>
              <Scale className="w-8 h-8 text-purple-500" />
            </CardContent>
          </Card>
        </div>

        {/* Calorie Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Daily Calories</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="calories" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Macros Chart */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Macronutrients</h2>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="protein" stroke="#3b82f6" strokeWidth={2} name="Protein (g)" />
                <Line type="monotone" dataKey="carbs" stroke="#f59e0b" strokeWidth={2} name="Carbs (g)" />
                <Line type="monotone" dataKey="fat" stroke="#ef4444" strokeWidth={2} name="Fat (g)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Weekly Summary */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold text-gray-900">Weekly Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {chartData.map((day) => (
                <div key={day.fullDate} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{day.date}</p>
                    <p className="text-sm text-gray-600">{format(new Date(day.fullDate), 'MMM d')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{day.calories} cal</p>
                    <p className="text-sm text-gray-600">
                      P: {day.protein}g • C: {day.carbs}g • F: {day.fat}g
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};
