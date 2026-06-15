'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

export default function AttendancePortal() {
  const router = useRouter();
  
  // State Matrix
  const [students, setStudents] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<{ [key: string]: string }>({});
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Add New Student Form State
  const [newRollNumber, setNewRollNumber] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newClassSection, setNewClassSection] = useState('Class 10-A');
  const [addingStudent, setAddingStudent] = useState(false);

  // Student Activity Form State
  const [selectedStudent, setSelectedStudent] = useState('');
  const [activityTitle, setActivityTitle] = useState('');
  const [activityDesc, setActivityDesc] = useState('');
  const [category, setCategory] = useState('Academic');

  // Verify Session on Load
  useEffect(() => {
    async function initializePortal() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setCheckingAuth(false);
      fetchStudentsList();
    }
    initializePortal();
  }, [router]);

  const fetchStudentsList = async () => {
    const { data } = await supabase.from('students').select('*').order('first_name');
    if (data) setStudents(data);
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Action: Submit Attendance
  const submitAttendance = async () => {
    const userSession = (await supabase.auth.getUser()).data.user;
    if (!userSession) return;

    if (Object.keys(attendance).length === 0) {
      alert('Please mark attendance for at least one student.');
      return;
    }

    const records = Object.entries(attendance).map(([studentId, status]) => ({
      student_id: studentId,
      status: status,
      teacher_id: userSession.id,
      date: new Date().toISOString().split('T')[0]
    }));

    const { error } = await supabase.from('attendance').upsert(records);
    if (!error) alert('🎉 Attendance submitted perfectly!');
    else alert('Error saving attendance data.');
  };

  // Action: Add Student
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingStudent(true);

    const { error } = await supabase
      .from('students')
      .insert([
        {
          roll_number: newRollNumber,
          first_name: newFirstName,
          last_name: newLastName,
          class_section: newClassSection,
        },
      ]);

    if (error) {
      if (error.code === '23505') {
        alert('❌ Error: A student with this Roll Number already exists.');
      } else {
        alert(`❌ Error: ${error.message}`);
      }
    } else {
      alert('🎉 Student added successfully!');
      setNewRollNumber('');
      setNewFirstName('');
      setNewLastName('');
      fetchStudentsList();
    }
    setAddingStudent(false);
  };

  // Action: Log Activity
  const submitActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const userSession = (await supabase.auth.getUser()).data.user;
    if (!userSession || !selectedStudent || !activityTitle || !activityDesc) {
      alert('Please fill out all activity fields.');
      return;
    }

    const { error } = await supabase.from('student_activities').insert({
      student_id: selectedStudent,
      teacher_id: userSession.id,
      activity_title: activityTitle,
      activity_description: activityDesc,
      category: category
    });

    if (!error) {
      alert('🎉 Student activity logged successfully!');
      setActivityTitle('');
      setActivityDesc('');
      setSelectedStudent('');
    } else {
      alert('Error saving activity.');
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-black font-semibold">
        Verifying Teacher Credentials...
      </div>
    );
  }
  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-md mx-auto space-y-6">
        
        {/* Navigation Top Bar */}
        <div className="flex justify-end">
          <button 
            type="button"
            onClick={handleLogout} 
            className="text-xs font-semibold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 bg-white shadow-sm transition-all"
          >
            🚪 Logout Portal
          </button>
        </div>

        {/* COMPONENT 1: ATTENDANCE BLOCK */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center tracking-tight">📊 Daily Attendance</h1>
          
          {students.length === 0 ? (
            <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <p className="text-sm text-gray-500 font-medium">No students registered yet.</p>
              <p className="text-xs text-gray-400 mt-1">Enroll your class using the registration block below.</p>
            </div>
          ) : (
            <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto pr-1">
              {students.map(student => (
                <div key={student.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-gray-700">{student.first_name} {student.last_name}</p>
                    <p className="text-xs text-gray-400 font-medium">Roll: {student.roll_number} | {student.class_section}</p>
                  </div>
                  
                  <div className="inline-flex rounded-lg shadow-sm border border-gray-200 p-0.5 bg-gray-50">
                    {['Present', 'Absent'].map(status => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => handleStatusChange(student.id, status)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          attendance[student.id] === status
                            ? status === 'Present' ? 'bg-green-500 text-white shadow-sm' : 'bg-red-500 text-white shadow-sm'
                            : 'bg-transparent text-gray-600 hover:text-gray-800'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {students.length > 0 && (
            <button 
              type="button"
              onClick={submitAttendance} 
              className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 active:scale-[0.98] transition-all text-center shadow-md shadow-blue-100"
            >
              Submit Attendance
            </button>
          )}
        </div>

        {/* COMPONENT 2: REGISTER STUDENT BLOCK */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 text-center tracking-tight">➕ Add New Student</h2>
          <form onSubmit={handleAddStudent} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Roll Number</label>
              <input type="text" placeholder="e.g., R101" value={newRollNumber} onChange={(e) => setNewRollNumber(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black outline-none bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">First Name</label>
                <input type="text" placeholder="Aarav" value={newFirstName} onChange={(e) => setNewFirstName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black outline-none bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Last Name</label>
                <input type="text" placeholder="Sharma" value={newLastName} onChange={(e) => setNewLastName(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black outline-none bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Class / Section</label>
              <select value={newClassSection} onChange={(e) => setNewClassSection(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-[46px]" required>
                <option value="Class 10-A">Class 10-A</option>
                <option value="Class 10-B">Class 10-B</option>
                <option value="Class 10-C">Class 10-C</option>
              </select>
            </div>

            <button type="submit" disabled={addingStudent} className="w-full bg-slate-800 text-white font-bold py-3 rounded-lg hover:bg-slate-900 active:scale-[0.98] transition-all text-center disabled:opacity-50 shadow-md">
              {addingStudent ? 'Adding Student...' : 'Register Student'}
            </button>
          </form>
        </div>

        {/* COMPONENT 3: LOG STUDENT ACTIVITY MODULE */}
        {students.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center tracking-tight">📝 Log Student Activity</h2>
            <form onSubmit={submitActivity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Select Student</label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-[46px]" required>
                  <option value="">-- Choose a Student --</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.first_name} {student.last_name} ({student.roll_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Category</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black bg-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 h-[46px]">
                  <option value="Academic">📚 Academic</option>
                  <option value="Sports">⚽ Sports</option>
                  <option value="Behavior">🤝 Behavior</option>
                  <option value="Extra-Curricular">🎨 Extra-Curricular</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Activity Title</label>
                <input type="text" placeholder="e.g., Exceptional Science Project" value={activityTitle} onChange={(e) => setActivityTitle(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black outline-none bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" required />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description / Notes</label>
                <textarea placeholder="Provide specific observations or details..." value={activityDesc} onChange={(e) => setActivityDesc(e.target.value)} className="w-full p-3 border border-gray-200 rounded-lg text-black h-24 outline-none bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none" required />
              </div>

              <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg hover:bg-emerald-700 active:scale-[0.98] transition-all text-center shadow-md shadow-emerald-100">
                Log Activity
              </button>
            </form>
          </div>
        )}

      </div>
    </main>
  );
}
