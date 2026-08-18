"use client";

import { useEffect, useState } from "react";
import Papa from "papaparse";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import {
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";

export default function DashboardPage() {
const [myStatus, setMyStatus] = useState("present");
  const router = useRouter();

  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("All");
const [searchTerm, setSearchTerm] = useState("");
  const [userRole, setUserRole] = useState("");
const [staffPresentCount, setStaffPresentCount] = useState(0);
const [staffAbsentCount, setStaffAbsentCount] = useState(0);
const [staffTotalCount, setStaffTotalCount] = useState(0);
const [activeDrill, setActiveDrill] =
  useState<any>(null);
const [drillDuration, setDrillDuration] =
  useState("00:00");
const [drillType, setDrillType] =
  useState("Fire Drill");
  const [userHomeroom, setUserHomeroom] = useState("");
const [userEmail, setUserEmail] = useState("");

const [myLocation, setMyLocation] = useState("Classroom");
const [submittedClasses, setSubmittedClasses] =

  useState<string[]>([]);

  const [file, setFile] = useState<File | null>(null);

  

  const classes = [
    "All",
    ...Array.from(
      new Set(
        students
          .map((s) => s.homeroom)
          .filter(Boolean)
      )
    ),
  ];

  const filteredStudents = students.filter(
  (student) => {

    const classMatch =
      selectedClass === "All"
        ? true
        : student.homeroom === selectedClass;

    const searchMatch =
      `${student.firstName} ${student.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
const updateMyStatus = async (status: string) => {
  const user = auth.currentUser;

  if (!user?.email) {
    console.log("No logged-in user");
    return;
  }

  try {
    const userRef = doc(
      db,
      "users",
      user.email
    );

    await updateDoc(userRef, {
      status: status,
    });

    setMyStatus(status);

  } catch (error) {
    console.error(
      "Error updating my status:",
      error
    );
  }
};

    return classMatch && searchMatch;
  }

);

const total = filteredStudents.length;

const presentCount = filteredStudents.filter(
  (s) => s.status === "present"
).length;

const absentCount = filteredStudents.filter(
  (s) => s.status === "absent"
).length;


  const loadStudents = async () => {

  let q;


  if(userRole === "admin" || userRole === "support"){

    q = collection(
      db,
      "students"
    );

  } else {


    if(!userHomeroom){
      return;
    }


    q = query(
      collection(db,"students"),
      where(
        "homeroom",
        "==",
        userHomeroom
      )
    );

  }


  const snapshot =
    await getDocs(q);


  const data:any[]=[];


  snapshot.forEach((docSnap)=>{

    data.push({
      id:docSnap.id,
      ...docSnap.data()
    });

  });


  setStudents(data);

};
const loadSubmissions = async () => {
  const snapshot = await getDocs(
    collection(db, "drillSubmissions")
  );

  const classes: string[] = [];

  snapshot.forEach((doc) => {
    classes.push(doc.id);
  });

  setSubmittedClasses(classes);
};

const loadActiveDrill = async () => {
  const snap = await getDoc(
    doc(db, "activeDrill", "current")
  );

  if (snap.exists()) {
    setActiveDrill(snap.data());
  } else {
    setActiveDrill(null);
  }
};
 useEffect(() => {

  if (!userRole) {
    return;
  }


  const unsubStudents = onSnapshot(
    collection(db,"students"),
    (snapshot)=>{

      const data:any[] = [];

      snapshot.forEach((doc)=>{

        data.push({
          id: doc.id,
          ...doc.data()
        });

      });

      setStudents(data);

    }
  );


  const unsubSubmissions = onSnapshot(
    collection(db,"drillSubmissions"),
    (snapshot)=>{

      const classes:string[] = [];

      snapshot.docs.forEach((doc)=>{
        classes.push(doc.id);
      });

      setSubmittedClasses(classes);

    }
  );


  const unsubDrill = onSnapshot(
    doc(db,"activeDrill","current"),
    (snapshot)=>{


      if(snapshot.exists()){

        setActiveDrill(
          snapshot.data()
        );

      }else{

        setActiveDrill(null);

      }


    }
  );


  return () => {
  unsubStudents();
  unsubSubmissions();
  unsubDrill();
};


}, [userRole, userHomeroom]);
useEffect(() => {
  if (
    !activeDrill ||
    activeDrill.status !== "active" ||
    !activeDrill.startedAt
  ) {
    setDrillDuration("00:00");
    return;
  }

  const interval = setInterval(() => {
    const startTime = activeDrill.startedAt.toDate
      ? activeDrill.startedAt.toDate()
      : new Date(activeDrill.startedAt);

    const diff =
      Math.floor(
        (Date.now() - startTime.getTime()) /
          1000
      );

    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;

    setDrillDuration(
      `${minutes
        .toString()
        .padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`
    );
  }, 1000);

  return () => clearInterval(interval);
}, [activeDrill]);

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(
    auth,
    async (user) => {


      if (!user?.email) return;

      try {
        const userRef = doc(
          db,
          "users",
          user.email
        );

        const snapshot = await getDoc(userRef);

        

        if (!snapshot.exists()) return;

        const data = snapshot.data();

        
        setUserRole(data.role || "");
        setUserHomeroom(data.homeroom || "");
setMyStatus(data.status || "present");
setMyLocation(data.location || "Classroom");
        setSelectedClass(
          data.homeroom || "All"
        );
      } catch (err) {
        alert("ERROR");
        console.log(err);
      }
    }
  );



 return () => unsubscribe();
}, []);

const updateMyStatus = async (status: string) => {
  const user = auth.currentUser;

  if (!user || !user.email) {
    alert("User not found");
    return;
  }

  try {
    const userRef = doc(
      db,
      "users",
      user.email
    );

    await updateDoc(userRef, {
      status: status,
    });

    setMyStatus(status);

  } catch (error) {
  console.error(
    "Error updating my status:",
    error
  );

  alert(
    "STATUS ERROR: " +
    (error instanceof Error
      ? error.message
      : String(error))
  );
}
};
const updateMyLocation = async (location: string) => {
  const user = auth.currentUser;

  if (!user || !user.email) {
    alert("User not found");
    return;
  }

  try {
    const userRef = doc(
      db,
      "users",
      user.email
    );

    await updateDoc(userRef, {
      location: location,
    });

    setMyLocation(location);

  } catch (error) {
    console.error(
      "Error updating my location:",
      error
    );

    alert("Could not update location");
  }
}; 
useEffect(() => {
  if (userRole !== "admin") return;

  const unsubscribe = onSnapshot(
    collection(db, "users"),
    (snapshot) => {

      let present = 0;
      let absent = 0;
      let total = 0;

      snapshot.forEach((doc) => {

        const data = doc.data();

        // Sadece staff
        if (
          data.role === "teacher" ||
          data.role === "support" ||
          data.role === "admin"
        ) {

          total++;

          if (data.status === "absent") {
            absent++;
          } else {
            present++;
          }

        }
      });

      setStaffPresentCount(present);
      setStaffAbsentCount(absent);
      setStaffTotalCount(total);
    },
    (error) => {
      console.error(
        "Staff status listener error:",
        error
      );
    }
  );

  return () => {
    unsubscribe();
  };

}, [userRole]);

  const updateStatus = async (
    studentId: string,
    status: string
  ) => {
    const studentRef = doc(
      db,
      "students",
      studentId
    );

    await updateDoc(studentRef, {
      status,
    });

    loadStudents();
  };
  const handleCsvRead = () => {
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results.data as any[];

        for (const row of rows) {
          if (!row.StudentID) continue;

          await setDoc(
            doc(db, "students", row.StudentID),
            {
              studentId: row.StudentID,
              firstName: row.FName,
              lastName: row.LName,
              homeroom: row.Homeroom,
              status: "present",
              location: "Classroom",
            }
          );
        }

        alert(`${rows.length} students uploaded`);

        loadStudents();
      },
    });
  };

const submitAttendance = async () => {
  const user = auth.currentUser;

  console.log("Homeroom:", userHomeroom);

  if (!user) return;

  if (!userHomeroom) {
    alert("No homeroom assigned");
    return;
  }

  await setDoc(
    doc(
      db,
      "drillSubmissions",
      userHomeroom
    ),
    {
      homeroom: userHomeroom,
      submittedBy: user.email,
      submittedAt: new Date(),
    }
  );

  alert("Attendance Submitted");
};  
const startDrill = async () => {
  const user = auth.currentUser;

  if (!user) return;

  await setDoc(
    doc(db, "activeDrill", "current"),
    {
      type: drillType,
      status: "active",
      startedBy: user.email,
      startedAt: serverTimestamp(),
    }
  );

  loadActiveDrill();

  alert(`${drillType} Started`);
};
const resetStudentsAfterDrill = async () => {
  try {
    const studentsSnapshot = await getDocs(
      collection(db, "students")
    );

    const batch = writeBatch(db);

    studentsSnapshot.forEach((studentDoc) => {
      batch.update(studentDoc.ref, {
        status: "present",
        location: "Classroom",
      });
    });

    await batch.commit();

    console.log("Students reset completed");

  } catch (error) {
    console.error(
      "Student reset error:",
      error
    );
  }
};

const clearSubmissionsAfterDrill = async()=>{

  const snapshot =
    await getDocs(
      collection(
        db,
        "drillSubmissions"
      )
    );


  const batch =
    writeBatch(db);


  snapshot.forEach((docSnap)=>{

    batch.delete(
      docSnap.ref
    );

  });


  await batch.commit();


  // ekranı hemen temizle
  setSubmittedClasses([]);


  console.log(
    "All submissions deleted"
  );

};
const endDrill = async () => {

  try {

    if (!activeDrill) {
      alert("No active drill");
      return;
    }


    const presentStudents:any[] = [];
    const absentStudents:any[] = [];
const staffPresent:any[] = [];
const staffAbsent:any[] = [];
   

    const completedClasses = [
      ...submittedClasses
    ];


    const studentsSnapshot = await getDocs(
      collection(db,"students")
    );


    studentsSnapshot.forEach((studentDoc)=>{

      const data = studentDoc.data();


      const student = {
        name:
          `${data.firstName || ""} ${data.lastName || ""}`,

        homeroom:
          data.homeroom || ""
      };


      if(data.status === "present"){
        presentStudents.push(student);
      }


      if(data.status === "absent"){
        absentStudents.push(student);
      }


    });
const usersSnapshot = await getDocs(
  collection(db, "users")
);

usersSnapshot.forEach((userDoc) => {

  const data = userDoc.data();

  // Sadece staff
  if (
    data.role === "teacher" ||
    data.role === "support" ||
    data.role === "admin"
  ) {

    const staff = {
      name:
        data.name ||
        data.displayName ||
        userDoc.id,

      role:
        data.role || ""
    };

    if (data.status === "absent") {
      staffAbsent.push(staff);
    } else {
      staffPresent.push(staff);
    }
  }

});


    console.log("HISTORY SAVE", {
      presentStudents,
      absentStudents,
      completedClasses
    });



    await addDoc(
      collection(db,"drillHistory"),
      {

        type:
          activeDrill.type || "Drill",


        startedBy:
          activeDrill.startedBy || "",


        startedAt:
          activeDrill.startedAt || null,


        endedAt:
          serverTimestamp(),


        presentStudents:
          presentStudents || [],


        absentStudents:
          absentStudents || [],

        completedClasses:
          completedClasses || [],
staffPresent:
  staffPresent || [],

staffAbsent:
  staffAbsent || []

      }
    );



    // reset students

    const batch = writeBatch(db);


    studentsSnapshot.forEach((studentDoc)=>{

      batch.update(
        studentDoc.ref,
        {
          status:"present",
          location:"Classroom"
        }
      );

    });


    await batch.commit();



    // teacher submit temizle

    await clearSubmissionsAfterDrill();



    // active drill sil

    await deleteDoc(
      doc(db,"activeDrill","current")
    );


    setActiveDrill(null);


    alert(
      "Drill ended successfully"
    );


  }
  catch(error){

    console.error(
      "END DRILL ERROR:",
      error
    );

  }

};
const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  return (
    <main className="min-h-screen p-4 md:p-10 max-w-7xl mx-auto">
{(userRole === "admin" || userRole === "support") && (
  <div className="border rounded-lg p-5 mb-6 bg-white shadow">

    <h2 className="text-2xl font-bold mb-4">
      Staff Status
    </h2>

    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">

      <div className="border rounded p-4">
        <div className="text-gray-500">
          Present
        </div>

        <div className="text-3xl font-bold text-green-600">
          {staffPresentCount}
        </div>
      </div>

      <div className="border rounded p-4">
        <div className="text-gray-500">
          Absent
        </div>

        <div className="text-3xl font-bold text-red-600">
          {staffAbsentCount}
        </div>
      </div>

      <div className="border rounded p-4">
        <div className="text-gray-500">
          Total
        </div>

        <div className="text-3xl font-bold">
          {staffTotalCount}
        </div>
      </div>

    </div>

  </div>
)}
<div className="border p-4 rounded mb-6 bg-white">
  <h2 className="text-xl font-bold mb-4">
    My Status
  </h2>

  <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3">
    <span className="font-semibold">
      Status:
    </span>

    {myStatus === "present" ? (
      <button
        onClick={() =>
          updateMyStatus("absent")
        }
        className="w-full sm:w-auto bg-green-500 text-white px-4 py-3 rounded-lg"
      >
        Absent
      </button>
    ) : (
      <button
        onClick={() =>
          updateMyStatus("present")
        }
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Present
      </button>
    )}

    <span className="font-medium">
      {myStatus}
    </span>
  </div>

  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
    <span className="font-semibold">
      Location:
    </span>

    <select
      value={myLocation}
      onChange={(e) =>
        updateMyLocation(e.target.value)
      }
      className="border p-2 rounded w-full sm:w-auto"
    >
      <option value="Classroom">
        Classroom
      </option>

      <option value="Hallway">
        Hallway
      </option>

      <option value="Back Playground">
        Back Playground
      </option>

      <option value="Front Grass">
        Front Grass
      </option>

      <option value="Off Campus">
        Off Campus
      </option>
    </select>
  </div>
</div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h1 className="text-4xl font-bold">
          Students
        </h1>

{userRole !== "support" && (
  <button
    onClick={submitAttendance}
    disabled={
      !activeDrill ||
      activeDrill.status !== "active"
    }
    className={`w-full md:w-auto px-4 py-3 rounded text-white ${
  activeDrill?.status === "active"
    ? "bg-green-600"
    : "bg-gray-400"
}`}
  >
    Submit Attendance
  </button>
)}

<button
  onClick={handleLogout}
  className="w-full sm:w-auto bg-green-500 text-white px-4 py-3 rounded-lg"
>
  Logout
</button>      </div>

      <div className="mt-4">
      
<div>
  Current User: {auth.currentUser?.email}
</div>
      </div>

     <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 mb-6">
        <div className="border p-3 mb-2 rounded">
          <div>Total</div>
          <div className="text-2xl font-bold">
            {total}
          </div>
        </div>

        <div className="border p-4 rounded">
          <div>Present</div>
          <div className="text-2xl font-bold">
            {presentCount}
          </div>
        </div>

        <div className="border p-4 rounded">
          <div>Absent</div>
          <div className="text-2xl font-bold">
            {absentCount}
          </div>
        </div>

        
      {userRole === "admin" && (
  <div className="mb-6">
    <input
      type="file"
      accept=".csv"
      onChange={(e) => {
        if (e.target.files?.[0]) {
          setFile(e.target.files[0]);
        }
      }}
    />

    <button
      onClick={handleCsvRead}
      className="w-full sm:w-auto bg-green-500 text-white px-4 py-3 rounded-lg"
    >
      Read CSV
    </button>
  </div>
)}

    {(userRole === "admin" ||
  userRole === "support") && (
  <div className="mb-6">
    <select
      value={selectedClass}
      onChange={(e) =>
        setSelectedClass(e.target.value)
      }
      className="border p-2 rounded"
    >
      {classes.map((cls) => (
        <option
          key={`class-${cls}`}
          value={cls}
        >
          {cls}
        </option>
      ))}
    </select>
  </div>
)}

{(userRole === "admin" || userRole === "support") && (
  <div className="mb-6">
    <input
      type="text"
      placeholder="Search student..."
      value={searchTerm}
      onChange={(e) =>
        setSearchTerm(e.target.value)
      }
      className="border p-3 rounded w-full text-base"
    />
  </div>
)}
{userRole === "admin" && (
  <div className="border p-4 rounded mb-6">
    <h2 className="font-bold text-xl mb-3">
      Today's Drill
    </h2>
<button
  onClick={() =>
    router.push("/history")
  }
  className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
>
  View Drill History
</button>
<div className="mb-3 font-semibold">
  Completed: {submittedClasses.length} / {classes.filter(c => c !== "All").length}
</div>

    <div className="mb-3">
      <select
        value={drillType}
        onChange={(e) =>
          setDrillType(e.target.value)
        }
        className="border p-2 rounded"
      >
        <option>Fire Drill</option>
        <option>Tornado Drill</option>
        <option>Lock In</option>
        <option>Lock Out</option>
      </select>
    </div>

    <button
  onClick={startDrill}
  disabled={
    activeDrill?.status === "active"
  }
  className={`px-4 py-2 rounded text-white ${
    activeDrill?.status === "active"
      ? "bg-gray-400"
      : "bg-red-600"
  }`}
>
  Start Drill
</button>
<button
  onClick={endDrill}
  disabled={
    !activeDrill ||
    activeDrill.status !== "active"
  }
  className={`px-4 py-2 rounded ml-2 text-white ${
    activeDrill?.status === "active"
      ? "bg-gray-700"
      : "bg-gray-400"
  }`}
>
  End Drill
</button>    
    <div className="mb-3 font-semibold">
      Completed: {submittedClasses.length} / {classes.filter(c => c !== "All").length}
    </div>

    {/* Start Drill ve End Drill butonları */}

    <div className="mt-4">
      <h3 className="font-bold">
        Completed
      </h3>

      {classes
        .filter(
          (c) =>
            c !== "All" &&
            submittedClasses.includes(c)
        )
        .map((cls) => (
          <div key={cls}>
            ✅ {cls}
          </div>
        ))}
    </div>

    <div className="mt-4">
      <h3 className="font-bold">
        Pending
      </h3>

      {classes
        .filter(
          (c) =>
            c !== "All" &&
            !submittedClasses.includes(c)
        )
        .map((cls) => (
          <div key={cls}>
            ⏳ {cls}
          </div>
        ))}
    </div>
  </div>
)}
  </div>
{activeDrill?.status === "active" && (
  <div className="bg-red-600 text-white p-4 rounded mb-6">
    <div className="text-xl font-bold">
      🚨 {activeDrill.type} ACTIVE
    </div>

    <div>
      Please take attendance and submit.
    </div>

    {activeDrill?.startedAt && (
      <>
        <div className="text-sm mt-2">
          Started:
          {" "}
          {new Date(
            activeDrill.startedAt.toDate
              ? activeDrill.startedAt.toDate()
              : activeDrill.startedAt
          ).toLocaleTimeString()}
        </div>

        <div className="text-sm">
          Duration: {drillDuration}
        </div>
      </>
    )}
  </div>
)}
      <div className="mt-8">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="border p-4 mb-3 rounded-lg shadow-sm overflow-hidden"
          >
            <div className="font-bold">
  {student.firstName} {student.lastName}
</div>

<div className="text-sm text-gray-600 mt-1">
  Homeroom: {student.homeroom}
</div>


            <div className="mt-3 flex items-center gap-3 flex-wrap">

 {student.status === "present" ? (
  <button
    onClick={() =>
      updateStatus(
        student.id,
        "absent"
      )
    }
    className="w-full sm:w-auto bg-green-500 text-white px-4 py-3 rounded-lg"
  >
    Absent
  </button>
) : (
  <button
    onClick={() =>
      updateStatus(
        student.id,
        "present"
      )
    }
    className="w-full sm:w-auto bg-green-500 text-white px-4 py-3 rounded-lg"
  >
    Present
  </button>
)}

  

  <div className="font-semibold">
    Status:
    {" "}
    {student.status}
  </div>


  <div className="flex items-center gap-2">

    <span>
      Location:
    </span>


    <select
      value={student.location || "Classroom"}
      onChange={async (e) => {

        const studentRef = doc(
          db,
          "students",
          student.id
        );


        await updateDoc(
          studentRef,
          {
            location:e.target.value,
          }
        );


        loadStudents();

      }}
      className="border p-1 rounded"
    >

      <option value="Classroom">
        Classroom
      </option>

      <option value="Hallway">
        Hallway
      </option>

      <option value="Back Playground">
        Back Playground
      </option>

      <option value="Front Grass">     
       Front Grass
      </option>    

      <option value="Off Campus">
        Off Campus
      </option>


    </select>

  </div>


</div>
          </div>
        ))}
      </div>
    </main>
  );
}