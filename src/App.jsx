import { useMemo, useState } from 'react';
import LoadingScreen from './components/LoadingScreen';
import AuthScreen from './components/AuthScreen';
import TopNav from './components/TopNav';
import DashboardView from './views/DashboardView';
import ActiveWorkoutView from './views/ActiveWorkoutView';
import TemplatesView from './views/TemplatesView';
import HistoryView from './views/HistoryView';
import ProgressView from './views/ProgressView';
import EmptyState from './components/EmptyState';
import { useAuth } from './hooks/useAuth';
import { useWorkoutAppData } from './hooks/useWorkoutAppData';
import { hasLegacyLocalData, migrateLegacyLocalData } from './services/migration';

export default function App() {
  const { user, loading: authLoading } = useAuth();
  const app = useWorkoutAppData(user);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const showImport = useMemo(() => !!user && hasLegacyLocalData(), [user]);

  if (authLoading) {
    return <LoadingScreen message="Restoring session..." />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (app.loading) {
    return <LoadingScreen message="Loading workout data..." />;
  }

  const runImport = async () => {
    setImporting(true);
    setImportMessage('');
    try {
      const result = await migrateLegacyLocalData(user.id);
      if (result.migrated) {
        setImportMessage('Local data imported into Supabase.');
        await app.refresh();
      } else {
        setImportMessage(`Import skipped: ${result.reason}`);
      }
    } catch (err) {
      setImportMessage(err.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="app-shell">
      <TopNav view={app.view} setView={app.setView} activeWorkout={app.activeWorkout} user={user} />

      {showImport ? (
        <div className="import-banner">
          <div>
            <strong>Legacy local data detected.</strong>
            <p className="muted small">Import your old browser-only workouts/templates into Supabase.</p>
          </div>
          <div className="row-wrap">
            {importMessage ? <span className="badge secondary">{importMessage}</span> : null}
            <button className="btn btn-outline" onClick={runImport} disabled={importing}>
              {importing ? 'Importing...' : 'Import local data'}
            </button>
          </div>
        </div>
      ) : null}

      {app.error ? <div className="notice error page-notice">{app.error}</div> : null}

      <main className="main-shell">
        {app.view === 'dashboard' && (
          <DashboardView
            templates={app.templates}
            activeWorkout={app.activeWorkout}
            setView={app.setView}
            onStartBlank={app.actions.startBlankWorkout}
            onStartTemplate={app.actions.startTemplateWorkout}
            history={app.history}
            now={app.now}
          />
        )}

        {app.view === 'workout' && (
          app.activeWorkout ? (
            <ActiveWorkoutView
              workout={app.activeWorkout}
              now={app.now}
              onWorkoutChange={app.actions.updateWorkoutRoot}
              onPauseToggle={app.actions.togglePause}
              onFinish={app.actions.finishWorkout}
              onDiscard={() => {
                if (window.confirm('Discard the current workout? This cannot be undone.')) {
                  app.actions.discardWorkout();
                }
              }}
              onSaveTemplate={() => {
                const name = window.prompt('Template name (optional)');
                app.actions.saveCurrentAsTemplate(name || '');
              }}
              onAddExercise={app.actions.addExerciseByName}
              onExerciseChange={app.actions.updateExercise}
              onExerciseDelete={app.actions.removeExercise}
              onAddSet={app.actions.appendSet}
              onDuplicateSet={app.actions.duplicateSet}
              onDeleteSet={app.actions.removeSet}
              onSetField={(setId, field, value) => app.actions.patchSet(setId, { [field]: value })}
              onToggleComplete={app.actions.toggleSetComplete}
            />
          ) : (
            <EmptyState
              title="No active workout"
              description="Start from a blank session or use a template. Once a workout is active, logging stays inline and fast."
              action={<button className="btn btn-primary" onClick={app.actions.startBlankWorkout}>Start Blank Workout</button>}
            />
          )
        )}

        {app.view === 'templates' && (
          <TemplatesView
            templates={app.templates}
            activeWorkout={app.activeWorkout}
            onStartTemplate={app.actions.startTemplateWorkout}
            onDeleteTemplate={(templateId) => {
              if (window.confirm('Delete this template?')) {
                app.actions.handleDeleteTemplate(templateId);
              }
            }}
            onSaveCurrentAsTemplate={app.actions.saveCurrentAsTemplate}
          />
        )}

        {app.view === 'history' && <HistoryView history={app.history} />}
        {app.view === 'progress' && <ProgressView history={app.history} progress={app.progress} />}
      </main>
    </div>
  );
}
