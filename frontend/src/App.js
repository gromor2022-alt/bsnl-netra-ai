import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell, Legend
} from "recharts";

function App() {

  const API = "https://bsnl-netra-ai.onrender.com/api";

  const [tab, setTab] = useState("dashboard");

  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [oltData, setOltData] = useState([]);
  const [data, setData] = useState({
  totalBilled: 0,
  totalCollected: 0,
  unpaidCustomers: 0
});
  const [customers, setCustomers] = useState([]);

  const [phone, setPhone] = useState("");
  const [issue, setIssue] = useState("");
  const [assignMap, setAssignMap] = useState({});

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => {
    fetch(`${API}/tickets`).then(r=>r.json()).then(setTickets);
    fetch(`${API}/technicians`).then(r=>r.json()).then(setTechnicians);
    fetch(`${API}/defaulters`).then(r=>r.json()).then(setDefaulters);
    fetch(`${API}/customers`).then(r=>r.json()).then(setCustomers);
    fetch(`${API}/olt-performance`)
      .then(r=>r.json())
      .then(d=>setOltData(d.oltData || []));
    fetch(`${API}/dashboard`).then(r=>r.json()).then(setData);
  };

  const round = (val) => Number(val || 0).toFixed(2);

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

    await fetch(`${API}/tickets`, {
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

    await fetch(`${API}/tickets/${id}`, {
      method: "PUT",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({ assignedTo: techId, status:"IN_PROGRESS" })
    });

    fetchAll();
  };


  // -------- UPLOAD --------

  const uploadFile = async (file, type) => {
    const formData = new FormData();
    formData.append("file", file);

    let url = "";

    if (type === "customers") {
      url = `${API}/upload-customers`;
    } else if (type === "revenue") {
      url = `${API}/upload-revenue`;
    }

    try {
      await fetch(url, {
        method: "POST",
        body: formData
      });

      alert("Upload successful ✅");
      fetchAll();

    } catch {
      alert("Upload failed ❌");
    }
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

      {tab==="dashboard" && (
        <>
          <div style={{ display:"flex", gap:15 }}>
            <div style={card}>Billed ₹{round(data?.totalBilled)}</div>
            <div style={card}>Collected ₹{round(data?.totalCollected)}</div>
            <div style={card}>Unpaid {round(data?.unpaidCustomers)}</div>
          </div>

          {/* UPLOAD */}
          <div style={{...card, marginTop:20}}>
            <h3>Upload Data</h3>

            <h4>Upload Customers</h4>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) uploadFile(file, "customers");
              }}
            />

            <h4>Upload Revenue</h4>
            <input
              type="file"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) uploadFile(file, "revenue");
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

      {tab==="reports" && (
        <>
          <h2 style={{ color:"white" }}>Reports</h2>

          <div style={{ display:"flex", gap:20 }}>
            <div style={card}>
              <h3>Revenue</h3>
              <BarChart width={300} height={200} data={[
                { name:"Billed", value: Number(data?.totalBilled || 0) },
{ name:"Collected", value: Number(data?.totalCollected || 0) }
              ]}>
                <XAxis dataKey="name"/>
                <YAxis/>
                <Tooltip/>
                <Bar dataKey="value"/>
              </BarChart>
            </div>

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
        </>
      )}

    </div>
  );
}

export default App;