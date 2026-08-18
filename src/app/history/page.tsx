"use client";

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";


export default function HistoryPage() {

  const [history, setHistory] = useState<any[]>([]);


  useEffect(() => {

    const loadHistory = async () => {

      try {

        const q = query(
          collection(db, "drillHistory"),
          orderBy("endedAt", "desc")
        );


        const snapshot = await getDocs(q);


        const data:any[] = [];


        snapshot.forEach((docSnap) => {

          data.push({
            id: docSnap.id,
            ...docSnap.data()
          });

        });


        setHistory(data);


      } catch(error) {

        console.error(
          "History load error:",
          error
        );

      }

    };


    loadHistory();


  }, []);

const generatePDF = async (drill: any) => {

  const doc = new jsPDF();


  // LOGO
  const logo = new window.Image();

  logo.src = "/logo.png";


  await new Promise((resolve) => {
    logo.onload = resolve;
  });


  doc.addImage(
    logo,
    "PNG",
    75,
    5,
    70,
    25
  );


  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");

  doc.text(
    "Horizon Science Academy",
    105,
    40,
    {
      align: "center",
    }
  );


  doc.setFontSize(16);

  doc.text(
    "Emergency Drill Report",
    105,
    50,
    {
      align:"center"
    }
  );


  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");


  doc.text(
  `Drill Type: ${drill.type}`,
  14,
  65
);

doc.text(
  `Date: ${
    drill.endedAt?.toDate
      ? drill.endedAt.toDate().toLocaleString()
      : ""
  }`,
  14,
  72
);

doc.text(
  `Started By: ${drill.startedBy}`,
  14,
  79
);


doc.text(
  `Total Students: ${
    (drill.presentStudents?.length || 0) +
    (drill.absentStudents?.length || 0) 
    
  }`,
  14,
  90
);


doc.text(
  `Present: ${
    drill.presentStudents?.length || 0
  }`,
  14,
  97
);


doc.text(
  `Absent: ${
    drill.absentStudents?.length || 0
  }`,
  14,
  104
);
doc.text(
  `Staff Present: ${
    drill.staffPresent?.length || 0
  }`,
  14,
  111
);

doc.text(
  `Staff Absent: ${
    drill.staffAbsent?.length || 0
  }`,
  14,
  118
);



  autoTable(doc,{
    startY:132,
    head:[
      ["Completed Classes"]
    ],
    body:
    drill.completedClasses?.map(
      (c:string)=>[c]
    ) || []
  });





  autoTable(doc,{
    startY:
    (doc as any).lastAutoTable.finalY + 10,

    head:[
      [
        "Absent Student",
        "Homeroom"
      ]
    ],

    body:
    drill.absentStudents?.map(
      (s:any)=>[
        s.name,
        s.homeroom
      ]
    ) || []

  });

autoTable(doc,{
  startY:
  (doc as any).lastAutoTable.finalY + 10,

  head:[
    [
      "Staff Present",
      "Role"
    ]
  ],

  body:
  drill.staffPresent?.map(
    (staff:any)=>[
      staff.name,
      staff.role
    ]
  ) || []

});


autoTable(doc,{
  startY:
  (doc as any).lastAutoTable.finalY + 10,

  head:[
    [
      "Staff Absent",
      "Role"
    ]
  ],

  body:
  drill.staffAbsent?.map(
    (staff:any)=>[
      staff.name,
      staff.role
    ]
  ) || []

});


  doc.save(
    `Drill-${drill.type}-${drill.id}.pdf`
  );

};

  return (

    <main className="p-10">


      <h1 className="text-4xl font-bold mb-6">
        Drill History
      </h1>



      {
        history.length === 0 ? (

          <div className="border p-5 rounded">
            No drill history found
          </div>


        ) : (


          history.map((drill)=>(

            <div
              key={drill.id}
              className="border rounded p-5 mb-5"
            >


              <h2 className="text-xl font-bold">
                🚨 {drill.type}
              </h2>



              <div>
                Started By: {drill.startedBy}
              </div>
<div className="mt-2">
Date:

{
 drill.endedAt?.toDate
 ?
 drill.endedAt.toDate().toLocaleString()
 :
 "Processing..."
}

</div>


<div className="grid grid-cols-2 gap-3 mt-4">

  <div className="border p-3 rounded">
    Students Present
    <br/>
    <b>
      {drill.presentStudents?.length || 0}
    </b>
  </div>

  <div className="border p-3 rounded">
    Students Absent
    <br/>
    <b>
      {drill.absentStudents?.length || 0}
    </b>
  </div>

</div>


<div className="mt-4 font-bold">
  Staff Status
</div>

<div className="grid grid-cols-2 gap-3 mt-2">

  <div className="border p-3 rounded">
    Staff Present
    <br/>
    <b>
      {drill.staffPresent?.length || 0}
    </b>
  </div>

  <div className="border p-3 rounded">
    Staff Absent
    <br/>
    <b>
      {drill.staffAbsent?.length || 0}
    </b>
  </div>

</div>


              <div className="mt-2">
                Date:

                {" "}

                {
                  drill.endedAt?.toDate
                  ?
                  drill.endedAt
                    .toDate()
                    .toLocaleString()
                  :
                  "Processing..."
                }

              </div>




              <div className="mt-4 font-bold">
                Completed Classes
              </div>


              {
                drill.completedClasses &&
                drill.completedClasses.map(
                  (cls:string)=>(
                    <div key={cls}>
                      ✅ {cls}
                    </div>
                  )
                )
              }


<div className="mt-4 font-bold">
Present Students:
</div>


{
  drill.presentStudents &&
  drill.presentStudents.map(
    (
      student:any,
      index:number
    )=>(
      <div key={index}>
        ✅ {student.name}
        {" - "}
        {student.homeroom}
      </div>
    )
  )
}

              <div className="mt-4 font-bold">
                Absent Students
              </div>


              {
                drill.absentStudents &&
                drill.absentStudents.map(
                  (
                    student:any,
                    index:number
                  )=>(
                    <div key={index}>
                      ❌ {student.name}
                      {" - "}
                      {student.homeroom}
                    </div>
                  )
                )
              }


<div className="mt-4 font-bold">
  Staff Present
</div>

{
  drill.staffPresent &&
  drill.staffPresent.map(
    (
      staff:any,
      index:number
    )=>(
      <div key={index}>
        ✅ {staff.name}
        {" - "}
        {staff.role}
      </div>
    )
  )
}


<div className="mt-4 font-bold">
  Staff Absent
</div>

{
  drill.staffAbsent &&
  drill.staffAbsent.map(
    (
      staff:any,
      index:number
    )=>(
      <div key={index}>
        ❌ {staff.name}
        {" - "}
        {staff.role}
      </div>
    )
  )
}

              
<button
  onClick={() => generatePDF(drill)}
  className="bg-green-600 text-white px-4 py-2 rounded mt-4"
>
  Download PDF
</button>

            </div>

          ))

        )
      }



    </main>

  );

}
