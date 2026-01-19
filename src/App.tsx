import { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { Layout } from './components/Layout';
import { TodayScreen } from './screens/TodayScreen';
import { TrendsScreen } from './screens/TrendsScreen';
import { WorkoutDetailScreen } from './screens/WorkoutDetailScreen';
import { AuthScreen } from './screens/AuthScreen';

function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<'today' | 'trends'>('today');
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string | null>(null);

  const handleNavigate = (screen: 'today' | 'trends') => {
    setCurrentScreen(screen);
    setSelectedWorkoutId(null);
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

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <MainApp />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
