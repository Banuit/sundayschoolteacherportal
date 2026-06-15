// app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabase';

export default function TeacherDashboard() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch students on page load
  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase.from('students').select('*');
      if (!error && data) setStudents(data);
      setLoading(false);
    }
    fetchStudents();
  }, []);

  // Update or Insert attendance matching our schema
  async function handleAttendance(studentId: string, status: 'present' | 'absent' | 'late') {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const { error } = await supabase
      .from('attendance')
      .upsert({ 
        student_id: studentId, 
        date: today, 
        status: status 
      }, { onConflict: 'student_id,date' }); // Matches our unique constraint

    if (error) alert('Error saving attendance: ' + error.message);
    else alert('Attendance recorded!');
  }

  if (loading) return <p className="p-8">Loading class roster...</p>;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Daily Attendance & Activities</h1>
      
      <div className="bg-white shadow rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Mark Attendance</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.roll_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                  <div className="inline-flex rounded-md shadow-sm">
                    <button onClick={() => handleAttendance(student.id, 'present')} className="px-3 py-1 text-xs font-medium rounded-l-md bg-green-50 text-green-700 border border-green-200 hover:bg-green-100">Present</button>
                    <button onClick={() => handleAttendance(student.id, 'late')} className="px-3 py-1 text-xs font-medium bg-yellow-50 text-yellow-700 border-t border-b border-yellow-200 hover:bg-yellow-100">Late</button>
                    <button onClick={() => handleAttendance(student.id, 'absent')} className="px-3 py-1 text-xs font-medium rounded-r-md bg-red-50 text-red-700 border border-red-200 hover:bg-red-100">Absent</button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  {/* Link or button to pop open the activity modal below */}
                  <a href={`#activity-${student.id}`} className="text-indigo-600 hover:text-indigo-900">Log Activity</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
