import { useState } from 'react';
import { Save, Trash2 } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';

export default function TemplatesView({ templates, activeWorkout, onStartTemplate, onDeleteTemplate, onSaveCurrentAsTemplate }) {
  const [templateName, setTemplateName] = useState('');

  return (
    <div className="stack-xl">
      <SectionHeader
        title="Workout templates"
        subtitle="Reusable starting points for common lifting days."
        action={activeWorkout ? (
          <div className="row-wrap">
            <input
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Template name"
            />
            <button
              className="btn btn-primary"
              onClick={() => {
                onSaveCurrentAsTemplate(templateName.trim());
                setTemplateName('');
              }}
            >
              <Save size={16} /> Save Current
            </button>
          </div>
        ) : null}
      />

      <div className="grid three-up">
        {templates.map((template) => (
          <div key={template.id} className="card stack-md">
            <div className="row-between">
              <div>
                <h3>{template.name}</h3>
                <p className="muted">{template.notes || `${template.exercises.length} exercises`}</p>
              </div>
              <button className="icon-btn danger" onClick={() => onDeleteTemplate(template.id)}>
                <Trash2 size={16} />
              </button>
            </div>

            <div className="stack-sm">
              {template.exercises.map((exercise) => (
                <div key={exercise.id} className="sub-card">
                  <div className="row-between">
                    <strong>{exercise.name}</strong>
                    <span className="badge secondary">{exercise.sets.length} sets</span>
                  </div>
                  <p className="muted small">
                    Default: {exercise.sets[0]?.weight ?? 0} lb • {exercise.sets[0]?.reps ?? 0} reps
                  </p>
                </div>
              ))}
            </div>

            <button className="btn btn-primary btn-block" onClick={() => onStartTemplate(template)}>
              Start workout
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
