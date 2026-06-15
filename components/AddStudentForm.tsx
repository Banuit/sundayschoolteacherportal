// components/AddStudentForm.tsx
'use client';
import { useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function AddStudentForm({ onStudentAdded }: { onStudentAdded: () => void }) {
  const [name, setName] = useState('');
  const [rollNumber, setRollNumber] = useState('');

  async function handleAddStudent(e: React.FormEvent) {
    e.preventDefault();
    
    const { error } = await supabase
      .from('students')
      .insert({ name, roll_number: rollNumber });

    if (error) {
      alert('Error creating student: ' + error.message);
    } else {
      setName('');
      setRollNumber('');
      onStudentAdded(); // Triggers a re-fetch on the main dashboard view
    }
  }

  return (
    <form onSubmit={handleAddStudent} className="flex gap-4 items-end bg-white p-4 border rounded-lg shadow-sm mb-6">
      <div>
        <label className="block text-xs font-semibold text-gray-600">Full Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 p-2 border rounded text-sm" required />
      </div>
      <div>
        <label className="block text-xs font-semibold text-gray-600">Roll Number</label>
        <input type="text" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="mt-1 p-2 border rounded text-sm" required />
      </div>
      <button type="submit" className="bg-blue-600 text-white text-sm px-4 py-2 rounded font-medium hover:bg-blue-700">
        Add Student
      </button>
    </form>
  );
}
