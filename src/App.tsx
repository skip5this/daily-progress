import { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
// Placeholder imports for screens
import { TodayScreen } from './screens/TodayScreen';
import { TrendsScreen } from './screens/TrendsScreen';
import { WorkoutDetailScreen } from './screens/WorkoutDetailScreen';

function App() {
  const [currentScreen, setCurrentScreen] = useState<'today' | 'trends'>('today');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const handleNavigate = (screen: 'today' | 'trends') => {
    setCurrentScreen(screen);
    setSelectedWorkoutId(null); // Reset workout selection on tab change
  };

  const handleOpenWorkout = (workoutId: string) => {
    setSelectedWorkoutId(workoutId);
  };

  const handleCloseWorkout = () => {
    setSelectedWorkoutId(null);
  };

  return (
    <AppProvider>
      {selectedWorkoutId ? (
        <WorkoutDetailScreen workoutId={selectedWorkoutId} onClose={handleCloseWorkout} />
      ) : (
        <Layout currentScreen={currentScreen} onNavigate={handleNavigate}>
          {currentScreen === 'today' && <TodayScreen onOpenWorkout={handleOpenWorkout} />}
          {currentScreen === 'trends' && <TrendsScreen />}
        </Layout>
      )}
    </AppProvider>
  );
}

export default App;
