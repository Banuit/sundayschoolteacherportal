'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../utils/supabase';

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  age: number;
  address: string;
  class_section: string;
  assigned_teacher_id: string;
}

interface SundayState {
  present: boolean;
  quietTime: boolean;
  memoryVerse: boolean;
}

export default function SundaySchoolPortal() {
  const router = useRouter();
  
  // Application Data Core States
  const [students, setStudents] = useState<Student[]>([]);
  const [tracker, setTracker] = useState<{ [key: string]: SundayState }>({});
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [activeTab, setActiveTab] = useState<'track' | 'register'>('track');
  const [selectedClassFilter, setSelectedClassFilter] = useState('All Classes');
  
  // Date Wise Filtering State (Defaults safely to today's date)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const offset = today.getTimezoneOffset();
    const localToday = new Date(today.getTime() - (offset * 60 * 1000));
    return localToday.toISOString().split('T')[0];
  });

  // Register New Sunday School Student States
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [classSection, setClassSection] = useState('Pre-KG');
  const [addingStudent, setAddingStudent] = useState(false);

  // Listens to calendar picker and automatically pulls corresponding records 
  useEffect(() => {
    async function initializePortal() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setCheckingAuth(false);
      fetchStudentsAndRecords();
    }
    initializePortal();
  }, [router, selectedDate]);

  const fetchStudentsAndRecords = async () => {
    const userSession = (await supabase.auth.getUser()).data.user;
    if (!userSession) return;

    // STRICTOR MODEL FILTER: Only pull students belonging explicitly to THIS logged-in teacher
    const { data: studentData } = await supabase
      .from('students')
      .select('*')
      .eq('assigned_teacher_id', userSession.id)
      .order('first_name');
    
    if (studentData) {
      setStudents(studentData);
      
      // Build clean fallback baseline (All unchecked)
      const defaultState: { [key: string]: SundayState } = {};
      studentData.forEach((student: Student) => {
        defaultState[student.id] = { present: false, quietTime: false, memoryVerse: false };
      });

      // Fetch saved logs matching the selected calendar date recorded by THIS teacher
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate)
        .eq('teacher_id', userSession.id);

      // Overwrite checkboxes dynamically if old database records are found
      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach((record: any) => {
          if (defaultState[record.student_id]) {
            defaultState[record.student_id] = {
              present: record.status === 'Present',
              quietTime: record.completed_quiet_time,
              memoryVerse: record.recited_memory_verse
            };
          }
        });
      }
      setTracker(defaultState);
    }
  };

  const handleToggle = (studentId: string, field: keyof SundayState) => {
    setTracker(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: !prev[studentId][field] }
    }));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Fixed Upsert Logic (Allows editing the same date multiple times with NO 409 errors)
  const submitAttendance = async () => {
    const userSession = (await supabase.auth.getUser()).data.user;
    if (!userSession) return;

    const records = Object.entries(tracker).map(([studentId, states]) => ({
      student_id: studentId,
      teacher_id: userSession.id,
      date: selectedDate, 
      status: states.present ? 'Present' : 'Absent',
      completed_quiet_time: states.quietTime,
      recited_memory_verse: states.memoryVerse
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(records, { onConflict: 'student_id,date' });

    if (!error) {
      alert(`🙏 Records for Sunday (${selectedDate}) saved successfully!`);
      fetchStudentsAndRecords(); // Re-sync data smoothly
    } else {
      alert(`Database Error: ${error.message}`);
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingStudent(true);

    const userSession = (await supabase.auth.getUser()).data.user;
    if (!userSession) return;

    const { error } = await supabase.from('students').insert([
      {
        first_name: firstName,
        last_name: lastName,
        age: parseInt(age),
        address: address,
        class_section: classSection,
        assigned_teacher_id: userSession.id, // Automates direct teacher linkage upon registry
        roll_number: 'SS-' + Math.floor(1000 + Math.random() * 9000)
      },
    ]);

    if (!error) {
      alert('🎉 New Sunday School student enrolled successfully under your profile!');
      setFirstName('');
      setLastName('');
      setAge('');
      setAddress('');
      fetchStudentsAndRecords();
      setActiveTab('track');
    } else {
      alert(`Registration Error: ${error.message}`);
    }
    setAddingStudent(false);
  };

  const filteredStudents = students.filter(student => 
    selectedClassFilter === 'All Classes' ? true : student.class_section === selectedClassFilter
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-semibold text-sm">
        Opening Sunday School Dashboard Portal...
      </div>
    );
  }

  // --- RENDERING CODE STITCH HOOK ---
  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 pb-12">
      {/* App Header Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm px-4 py-3">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-xl">⛪</span>
            <div>
              <h1 className="text-sm font-bold text-slate-900 tracking-tight">Sunday School</h1>
              <p className="text-[10px] text-slate-400 font-medium">Teacher Tracking Portal</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={handleLogout} 
            className="text-xs font-semibold text-slate-500 hover:text-red-500 border border-slate-200 px-3 py-1 rounded-md bg-white shadow-xs"
          >
            Logout
          </button>
        </div>
      </header>

      <div className="max-w-md mx-auto px-4 mt-5 space-y-4">
        {/* Tab Selection Row */}
        <div className="grid grid-cols-2 p-1 bg-slate-200/70 rounded-xl border border-slate-200">
          <button onClick={() => setActiveTab('track')} className={`py-2.5 text-xs font-bold rounded-lg transition-all text-center ${activeTab === 'track' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>
            📋 Milestone Checklist
          </button>
          <button onClick={() => setActiveTab('register')} className={`py-2.5 text-xs font-bold rounded-lg transition-all text-center ${activeTab === 'register' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-500'}`}>
            ➕ Enrol New Child
          </button>
        </div>

        {/* TAB 1: TRACK MODULE */}
        {activeTab === 'track' && (
          <div className="space-y-4">
            {/* Filter Panel */}
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">📅 Track Data For Date:</label>
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none text-black h-[42px]"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-wider">📁 Select Class Section:</label>
                <select value={selectedClassFilter} onChange={(e) => setSelectedClassFilter(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none h-[42px]">
                  <option value="All Classes">All My Folders</option>
                  <option value="Pre-KG">Pre-KG</option>
                  <option value="KG">KG</option>
                  <option value="Junior">Junior</option>
                  <option value="Senior">Senior</option>
                </select>
              </div>
            </div>

            {/* Student Checklist cards */}
            {filteredStudents.length === 0 ? (
              <div className="text-center py-12 px-4 bg-white rounded-xl border border-dashed border-slate-200">
                <p className="text-xs text-slate-400 font-semibold">No students discovered under your teacher assignment profile.</p>
                <button onClick={() => setActiveTab('register')} className="text-xs text-blue-600 font-bold mt-2 underline">Register a student to your class</button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredStudents.map(student => {
                  const isPresent = tracker[student.id]?.present || false;
                  const isQuietTime = tracker[student.id]?.quietTime || false;
                  const isMemoryVerse = tracker[student.id]?.memoryVerse || false;

                  return (
                    <div key={student.id} className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 space-y-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm tracking-tight">{student.first_name} {student.last_name}</h3>
                        <p className="text-[10px] text-slate-400 font-medium mt-0.5">Age: {student.age} • Address: {student.address}</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggle(student.id, 'present')}
                          className={`py-2.5 px-1 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center space-y-1 ${
                            isPresent ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-base">🏃‍♂️</span>
                          <span>{isPresent ? 'Attended ✓' : 'Attended'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggle(student.id, 'quietTime')}
                          className={`py-2.5 px-1 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center space-y-1 ${
                            isQuietTime ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-base">📖</span>
                          <span>{isQuietTime ? 'Quiet Time ✓' : 'Quiet Time'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggle(student.id, 'memoryVerse')}
                          className={`py-2.5 px-1 text-xs font-bold rounded-xl border transition-all flex flex-col items-center justify-center space-y-1 ${
                            isMemoryVerse ? 'bg-amber-500 text-white border-amber-500 shadow-xs' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span className="text-base">🗣️</span>
                          <span>{isMemoryVerse ? 'Verse Said ✓' : 'Verse Said'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <button 
                  type="button"
                  onClick={submitAttendance} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-4 rounded-xl transition-all text-center shadow-md shadow-blue-100 mt-4 active:scale-95"
                >
                  💾 Save Sunday Records
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REGISTRATION MODULE */}
        {activeTab === 'register' && (
          <div className="bg-white rounded-xl shadow-xs p-5 border border-slate-200">
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">First Name</label>
                  <input type="text" placeholder="First Name" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg text-black outline-none bg-slate-50/50 focus:bg-white focus:border-blue-500" required />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Last Name</label>
                  <input type="text" placeholder="Last Name" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg text-black outline-none bg-slate-50/50 focus:bg-white focus:border-blue-500" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age</label>
                  <input type="number" placeholder="6" value={age} onChange={(e) => setAge(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg text-black outline-none bg-slate-50/50 focus:bg-white focus:border-blue-500" required />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Sunday Class Assignment</label>
                  <select value={classSection} onChange={(e) => setClassSection(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg text-black bg-slate-50/50 outline-none focus:bg-white focus:border-blue-500 h-[38px] font-medium" required>
                    <option value="Pre-KG">Pre-KG</option>
                    <option value="KG">KG</option>
                    <option value="Junior">Junior</option>
                    <option value="Senior">Senior</option>
                  </select>
                </div>
              </div>

              <div>
                <input type="text" placeholder="Residential Address" value={address} onChange={(e) => setAddress(e.target.value)} className="w-full p-2.5 text-xs border border-slate-200 rounded-lg text-black outline-none bg-slate-50/50 focus:bg-white focus:border-blue-500" required />
              </div>

              <button 
                type="submit" 
                disabled={addingStudent} 
                className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-3.5 rounded-xl transition-all text-center disabled:opacity-50 shadow-xs active:scale-95"
              >
                {addingStudent ? 'Enrolling Child...' : '✨ Complete Enrolment'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
