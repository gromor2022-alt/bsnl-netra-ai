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

  const [customerFile, setCustomerFile] = useState(null);
  const [revenueFile, setRevenueFile] = useState(null);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = () => {
  fetch(`${API}/tickets`)
    .then(r=>r.json())
    .then(setTickets)
    .catch(()=>setTickets([]));

  fetch(`${API}/technicians`)
    .then(r=>r.json())
    .then(setTechnicians)
    .catch(()=>setTechnicians([]));

  fetch(`${API}/customers`)
    .then(r=>r.json())
    .then(setCustomers)
    .catch(()=>setCustomers([]));

  fetch(`${API}/olt-performance`)
    .then(r=>r.json())
    .then(d=>setOltData(d.oltData || []))
    .catch(()=>setOltData([]));

  fetch(`${API}/dashboard`)
    .then(r=>r.json())
    .then(setData)
    .catch(()=>setData({
      totalBilled:0,
      totalCollected:0,
      unpaidCustomers:0
    }));
};

  const round = (val) => Number(val || 0).toFixed(2);

// ✅ Ensure oltData is always an array
const safeOltData = Array.isArray(oltData) ? oltData : [];

// ✅ Total customers calculation (safe)
const totalCustomers = safeOltData.reduce(
  (sum, o) => sum + Number(o?.totalCustomers || 0),
  0
);

// ✅ Processed OLT data (safe mapping)
const processedOlt = safeOltData.map((o) => {
  const customers = Number(o?.totalCustomers || 0);

  return {
    ...o,
    oltIp: o?.oltIp || o?.olt || "N/A",
    totalCustomers: customers,
    realPercent: totalCustomers
      ? (customers / totalCustomers) * 100
      : 0
  };
});

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

  const uploadCustomers = async () => {
    if (!customerFile) return alert("Select customer file");

    const formData = new FormData();
    formData.append("file", customerFile);

    try {
      const res = await fetch(`${API}/upload-customers`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      alert(data.message || "Customers uploaded");
      fetchAll();
    } catch {
      alert("Upload failed");
    }
  };

  const uploadRevenue = async () => {
    if (!revenueFile) return alert("Select revenue file");

    const formData = new FormData();
    formData.append("file", revenueFile);

    try {
      const res = await fetch(`${API}/upload-revenue`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      alert(data.message || "Revenue uploaded");
      fetchAll();
    } catch {
      alert("Upload failed");
    }
  };

  const card = {
    background: "rgba(255,255,255,0.9)",
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
        BSNL Netra AI Dashboard
      </h1>

      <div style={{ display:"flex", gap:10, marginBottom:20 }}>
        <button onClick={()=>setTab("dashboard")}>Dashboard</button>
        <button onClick={()=>setTab("reports")}>Reports</button>
      </div>

      {tab==="dashboard" && (
        <>
          <div style={{ display:"flex", gap:15 }}>
            <div style={card}>Billed ₹{round(data.totalBilled)}</div>
            <div style={card}>Collected ₹{round(data.totalCollected)}</div>
            <div style={card}>Unpaid {round(data.unpaidCustomers)}</div>
          </div>

          {/* UPLOAD */}
          <div style={{...card, marginTop:20}}>
            <h3>Upload Data</h3>

            <h4>Customers</h4>
            <input type="file" onChange={(e)=>setCustomerFile(e.target.files[0])}/>
            <button onClick={uploadCustomers}>Upload Customers</button>

            <h4>Revenue</h4>
            <input type="file" onChange={(e)=>setRevenueFile(e.target.files[0])}/>
            <button onClick={uploadRevenue}>Upload Revenue</button>
          </div>

          {/* TICKETS */}
          <div style={{...card, marginTop:20}}>
            <h3>Raise Complaint</h3>

            <input list="customers" placeholder="Phone"
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

            <button onClick={createTicket}>Submit</button>
          </div>
        </>
      )}

      {tab==="reports" && (
        <>
          <h2 style={{ color:"white" }}>Reports</h2>

          {/* BAR CHART */}
          {data && (
            <BarChart width={300} height={200} data={[
              {name:"Billed", value:Number(data.totalBilled || 0)},
              {name:"Collected", value:Number(data.totalCollected || 0)}
            ]}>
              <XAxis dataKey="name"/>
              <YAxis/>
              <Tooltip/>
              <Bar dataKey="value"/>
            </BarChart>
          )}

          {/* PIE */}
          {processedOlt.length > 0 && (
            <PieChart width={300} height={200}>
              <Pie
                data={processedOlt.slice(0,5)}
                dataKey="realPercent"
                nameKey="oltIp"
                outerRadius={80}
              >
                {processedOlt.slice(0,5).map((_,i)=>(
                  <Cell key={i} fill={COLORS[i%COLORS.length]}/>
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </>
      )}

    </div>
  );
}

export default App;