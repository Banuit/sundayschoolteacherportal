// components/LogActivityForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function LogActivityForm({ studentId, studentName }: { studentId: string, studentName: string }) {
  const [activityName, setActivityName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!activityName) return;

    setSubmitting(true);
    const { error } = await supabase
      .from('activities')
      .insert({
        student_id: studentId,
        activity_name: activityName,
        notes: notes
      });

    setSubmitting(false);
    if (error) {
      alert('Error saving activity: ' + error.message);
    } else {
      alert(`Activity logged for ${studentName}!`);
      setActivityName('');
      setNotes('');
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-50 border rounded-lg space-y-4 max-w-md">
      <h3 className="text-sm font-bold text-gray-700">Log Activity for {studentName}</h3>
      
      <div>
        <label className="block text-xs font-medium text-gray-600">Activity Title</label>
        <input 
          type="text" 
          placeholder="e.g., Math Quiz, Reading Group" 
          value={activityName}
          onChange={(e) => setActivityName(e.target.value)}
          className="w-full mt-1 p-2 border rounded text-sm"
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600">Notes / Remarks</label>
        <textarea 
          placeholder="How did they perform?" 
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full mt-1 p-2 border rounded text-sm h-20"
        />
      </div>

      <button 
        type="submit" 
        disabled={submitting}
        className="w-full bg-indigo-600 text-white text-sm py-2 rounded font-medium hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {submitting ? 'Saving...' : 'Save Activity'}
      </button>
    </form>
  );
}
