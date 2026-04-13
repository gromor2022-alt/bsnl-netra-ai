import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";

function App() {

  const [tab, setTab] = useState("dashboard");

  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [oltData, setOltData] = useState([]);
  const [data, setData] = useState(null);
  const [customers, setCustomers] = useState([]);

  const [phone, setPhone] = useState("");
  const [issue, setIssue] = useState("");
  const [assignMap, setAssignMap] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => {
    fetch("https://bsnl-netra-ai.onrender.com//api/tickets").then(r=>r.json()).then(setTickets);
    fetch("https://bsnl-netra-ai.onrender.com//api/technicians").then(r=>r.json()).then(setTechnicians);
    fetch("https://bsnl-netra-ai.onrender.com//api/defaulters").then(r=>r.json()).then(setDefaulters);
    fetch("https://bsnl-netra-ai.onrender.com//api/customers").then(r=>r.json()).then(setCustomers);
    fetch("https://bsnl-netra-ai.onrender.com//api/olt-performance")
      .then(r=>r.json())
      .then(d=>setOltData(d.oltData || []));
    fetch("https://bsnl-netra-ai.onrender.com//api/dashboard").then(r=>r.json()).then(setData);
  };

  const round = (val) => Number(val || 0).toFixed(2);

  // ✅ FIX: REAL % CALCULATION (NUMBER, not string)
  const totalCustomers = oltData.reduce((sum, o) => sum + (o.totalCustomers || 0), 0);

  const processedOlt = oltData.map(o => ({
    ...o,
    oltIp: o.oltIp || o.olt || "N/A",
    totalCustomers: o.totalCustomers || 0,
    realPercent: totalCustomers
      ? (o.totalCustomers / totalCustomers) * 100
      : 0
  }));

  // -------- ACTIONS --------
  const createTicket = async () => {
    if (!phone || !issue) return alert("Fill all");

    await fetch("https://bsnl-netra-ai.onrender.com//api/tickets", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ phoneNo: phone, issue })
    });

    window.open(`https://wa.me/91${phone}?text=Complaint%20Registered:%20${issue}`);

    setPhone(""); setIssue("");
    fetchAll();
  };

  const assignTech = async (id) => {
    const techId = assignMap[id];
    if (!techId) return alert("Select technician");

    await fetch(`https://bsnl-netra-ai.onrender.com//api/tickets/${id}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ assignedTo: techId, status:"IN_PROGRESS" })
    });

    fetchAll();
  };

  const updateStatus = async (id, status) => {
    await fetch(`https://bsnl-netra-ai.onrender.com//api/tickets/${id}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ status })
    });
    fetchAll();
  };

  // ✅ FILE UPLOAD (Revenue / Customers)
  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);

    await fetch(`https://bsnl-netra-ai.onrender.com//api/upload/${type}`, {
      method: "POST",
      body: formData
    });

    fetchAll();
  };

  const card = {
    background: "rgba(255,255,255,0.85)",
    padding: 15,
    borderRadius: 14
  };

  const COLORS = ["#2563eb","#16a34a","#f59e0b","#dc2626"];

  return (
    <div style={{
      padding: 20,
      minHeight: "100vh",
      background: "linear-gradient(135deg,#1e3a8a,#0ea5e9,#a5f3fc)"
    }}>

      <h1 style={{ textAlign:"center", color:"white" }}>
        BSNL Netra AI — Smart Telecom Dashboard
      </h1>

      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <button onClick={()=>setTab("dashboard")}>Dashboard</button>
        <button onClick={()=>setTab("reports")}>Reports</button>
        <button onClick={()=>setTab("technician")}>Technician Panel</button>
      </div>

      {/* DASHBOARD */}
      {tab==="dashboard" && (
        <>
          <div style={{ display:"flex", gap:15 }}>
            <div style={card}>Billed ₹{round(data?.totalBilled)}</div>
            <div style={card}>Collected ₹{round(data?.totalCollected)}</div>
            <div style={card}>Unpaid {round(data?.unpaidCustomers)}</div>
          </div>

          {/* ✅ FILE UPLOAD */}
          <div style={{...card, marginTop:20}}>
            <h3>Upload Data</h3>

            <input
  type="file"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    fetch("https://bsnl-netra-ai.onrender.com/api/upload/revenue", {
      method: "POST",
      body: formData
    })
    .then(() => {
      alert("Revenue uploaded successfully");
    })
    .catch(() => {
      alert("Upload failed");
    });
  }}
/>
          </div>

          {/* CREATE TICKET */}
          <div style={{...card, marginTop:20}}>
            <h3>Raise Complaint</h3>

            <input list="customers" placeholder="Phone Number"
              value={phone}
              onChange={(e)=>setPhone(e.target.value)}
            />

            <datalist id="customers">
              {customers.map((c,i)=>(<option key={i} value={c.phoneNo}/>))}
            </datalist>

            <input placeholder="Issue"
              value={issue}
              onChange={(e)=>setIssue(e.target.value)}
            />

            <button onClick={createTicket}>Submit + WhatsApp</button>
          </div>

          {/* TICKETS */}
          <h3 style={{ marginTop:20, color:"white" }}>Tickets</h3>

          <div style={{ display:"flex", flexWrap:"wrap", gap:15 }}>
            {tickets.map(t=>(
              <div key={t.id} style={{...card, width:260}}>
                <b>{t.phoneNo}</b>
                <p>{t.issue}</p>
                <p>Status: {t.status}</p>

                <select onChange={(e)=>setAssignMap({...assignMap,[t.id]:e.target.value})}>
                  <option>Select Technician</option>
                  {technicians.map(tech=>(
                    <option key={tech.id} value={tech.id}>{tech.name}</option>
                  ))}
                </select>

                <button onClick={()=>assignTech(t.id)}>Submit Assign</button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* REPORTS */}
      {tab==="reports" && (
        <>
          <h2 style={{ color:"white" }}>Reports</h2>

          <div style={{ display:"flex", gap:20 }}>

            {/* REVENUE */}
            <div style={card}>
              <h3>Revenue</h3>
              <BarChart width={300} height={200} data={[
                {name:"Billed", value:data?.totalBilled},
                {name:"Collected", value:data?.totalCollected}
              ]}>
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="value"/>
              </BarChart>
            </div>

            {/* ✅ FIXED OLT GRAPH */}
            <div style={card}>
              <h3>OLT Distribution (%)</h3>

              <PieChart width={300} height={200}>
                <Pie
                  data={processedOlt.slice(0,5)}
                  dataKey="realPercent"
                  nameKey="oltIp"
                  outerRadius={80}
                  label={({ name, value }) => `${name}: ${value.toFixed(2)}%`}
                >
                  {processedOlt.slice(0,5).map((_,i)=>(
                    <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                  ))}
                </Pie>

                <Tooltip formatter={(v)=>`${Number(v).toFixed(2)}%`} />
                <Legend />
              </PieChart>
            </div>

          </div>

          {/* OLT TABLE */}
          <div style={{...card, marginTop:20}}>
            <h3>OLT Details</h3>

            {processedOlt.map((o,i)=>(
              <div key={i}>
                {o.oltIp} — {o.totalCustomers} Customers — {o.realPercent.toFixed(2)}%
              </div>
            ))}
          </div>

          {/* DEFAULTERS */}
          <div style={{...card, marginTop:20}}>
            <h3>Top Defaulters</h3>

            <div style={{ display:"flex", fontWeight:"bold" }}>
              <div style={{ width:"50%" }}>Telephone Number</div>
              <div>Amount to Collect</div>
            </div>

            {defaulters.slice(0,10).map((d,i)=>(
              <div key={i} style={{ display:"flex" }}>
                <div style={{ width:"50%" }}>{d.phoneNo}</div>
                <div>₹{round(d.totalDue)}</div>
              </div>
            ))}
          </div>

          {/* RESOLVE */}
          <div style={{...card, marginTop:20}}>
            <h3>Ticket Report</h3>

            {tickets.slice(0,10).map(t=>(
              <div key={t.id}>
                {t.phoneNo} - {t.status}

                {t.status !== "RESOLVED" && (
                  <button onClick={()=>updateStatus(t.id,"RESOLVED")}>
                    Submit Resolve
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* TECH PANEL */}
      {tab==="technician" && (
        <>
          <h2 style={{ color:"white" }}>Technician Panel</h2>

          {tickets.filter(t=>t.status!=="RESOLVED").map(t=>(
            <div key={t.id} style={{...card, marginBottom:10}}>
              <p>{t.phoneNo}</p>
              <p>{t.issue}</p>

              <button onClick={()=>updateStatus(t.id,"RESOLVED")}>
                Mark Complete
              </button>
            </div>
          ))}
        </>
      )}

    </div>
  );
}

export default App;