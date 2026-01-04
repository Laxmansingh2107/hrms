document.addEventListener("DOMContentLoaded", () => {

  /* =========================
     GLOBAL STATE
  ========================= */
  let employees = JSON.parse(localStorage.getItem("employees")) || [];
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  let payrollHistory = JSON.parse(localStorage.getItem("payrollHistory")) || {};

  const PF_RATE = 0.12;
  const PF_CEILING = 15000;
  const ESIC_EMP = 0.0075;
  const ESIC_EMPR = 0.0325;
  const ESIC_CEILING = 21000;

  const content = document.getElementById("content");

  document.querySelectorAll("nav li").forEach(li => {
    li.onclick = () => loadPage(li.dataset.page);
  });

  loadPage("dashboard");

  /* =========================
     PAGE ROUTER
  ========================= */
  function loadPage(page) {
    if (page === "dashboard") renderDashboard();
    if (page === "employees") renderEmployees();
    if (page === "attendance") renderAttendance();
    if (page === "payroll") renderPayroll();
    if (page === "reports") renderReports();
  }

  /* =========================
     DASHBOARD (FIXED)
  ========================= */
  function renderDashboard() {
    const month = new Date().toISOString().slice(0,7);
    const attCount = attendance.filter(a => a.date.startsWith(month)).length;

    content.innerHTML = `
      <h3>Dashboard</h3>
      <p><b>Total Employees:</b> ${employees.length}</p>
      <p><b>Attendance Entries (Current Month):</b> ${attCount}</p>
      <p><b>Payroll Status (${month}):</b>
        ${payrollHistory[month] ? "Generated" : "Not Generated"}
      </p>
    `;
  }

  /* =========================
     EMPLOYEE MASTER (FIXED)
  ========================= */
  function renderEmployees() {
    content.innerHTML = `
      <h3>Employee Master</h3>
      <button id="addEmp">Add Employee</button>
      <button id="downloadMaster">Download Master (Excel)</button>
      <div id="empList"></div>
    `;

    document.getElementById("addEmp").onclick = showEmployeeForm;
    document.getElementById("downloadMaster").onclick = downloadEmployeeMaster;

    drawEmployeeList();
  }

  function showEmployeeForm() {
    content.innerHTML = `
      <h3>Add Employee</h3>
      Name <input id="name"><br><br>
      PAN <input id="pan"><br><br>
      Basic <input type="number" id="basic"><br><br>
      PF <input type="checkbox" id="pf">
      ESIC <input type="checkbox" id="esic"><br><br>
      TDS <input type="number" id="tds">
      PT <input type="number" id="pt"><br><br>
      <button id="saveEmp">Save</button>
    `;
    document.getElementById("saveEmp").onclick = saveEmployee;
  }

  function saveEmployee() {
    employees.push({
      empId: "EMP" + (employees.length + 1),
      name: name.value,
      pan: pan.value,
      salary: { basic: Number(basic.value) },
      statutory: {
        pf: pf.checked,
        esic: esic.checked,
        tds: Number(tds.value || 0),
        pt: Number(pt.value || 0)
      }
    });
    localStorage.setItem("employees", JSON.stringify(employees));
    renderEmployees();
  }

  function drawEmployeeList() {
    let html = `<table><tr><th>ID</th><th>Name</th><th>Basic</th></tr>`;
    employees.forEach(e => {
      html += `<tr><td>${e.empId}</td><td>${e.name}</td><td>${e.salary.basic}</td></tr>`;
    });
    html += `</table>`;
    document.getElementById("empList").innerHTML = html;
  }

  function downloadEmployeeMaster() {
    const ws = XLSX.utils.json_to_sheet(employees);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Employees");
    XLSX.writeFile(wb, "Employee_Master.xlsx");
  }

  /* =========================
     ATTENDANCE (WORKING)
  ========================= */
  function renderAttendance() {
    content.innerHTML = `
      <h3>Attendance</h3>
      Date <input type="date" id="date"><br><br>
      Employee <select id="emp"></select><br><br>
      <button id="mark">Mark Present</button>
    `;
    date.value = new Date().toISOString().split("T")[0];
    emp.innerHTML = employees.map(e =>
      `<option value="${e.empId}">${e.name}</option>`
    ).join("");
    document.getElementById("mark").onclick = saveAttendance;
  }

  function saveAttendance() {
    attendance.push({ empId: emp.value, date: date.value });
    localStorage.setItem("attendance", JSON.stringify(attendance));
    alert("Attendance saved");
  }

  /* =========================
     PAYROLL (MONTH-WISE + HISTORY)
  ========================= */
  function renderPayroll() {
    content.innerHTML = `
      <h3>Payroll</h3>
      Month <input id="month" placeholder="YYYY-MM">
      <button id="run">Run Payroll</button>
      <select id="history"></select>
      <div id="payrollArea"></div>
    `;

    document.getElementById("run").onclick = runPayroll;
    populatePayrollHistory();
  }

  function populatePayrollHistory() {
    const sel = document.getElementById("history");
    sel.innerHTML = `<option value="">View Previous</option>`;
    Object.keys(payrollHistory).forEach(m => {
      sel.innerHTML += `<option value="${m}">${m}</option>`;
    });
    sel.onchange = () => showPayroll(sel.value);
  }

  function runPayroll() {
    const m = month.value;
    let rows = employees.map(emp => {
      let days = attendance.filter(a => a.empId === emp.empId && a.date.startsWith(m)).length;
      let basicEarned = (emp.salary.basic / 26) * days;
      let pfWage = Math.min(emp.salary.basic, PF_CEILING);
      let pfEmp = emp.statutory.pf ? pfWage * PF_RATE : 0;
      let pfEmpr = pfEmp;
      let gross = basicEarned;
      let esicEmp = (emp.statutory.esic && gross <= ESIC_CEILING) ? gross * ESIC_EMP : 0;
      let esicEmpr = (emp.statutory.esic && gross <= ESIC_CEILING) ? gross * ESIC_EMPR : 0;
      let net = gross - pfEmp - esicEmp - emp.statutory.tds - emp.statutory.pt;

      return { empId: emp.empId, name: emp.name, gross, pfEmp, pfEmpr, esicEmp, esicEmpr, net };
    });

    payrollHistory[m] = rows;
    localStorage.setItem("payrollHistory", JSON.stringify(payrollHistory));
    showPayroll(m);
  }

  function showPayroll(m) {
    const rows = payrollHistory[m];
    if (!rows) return;
    let h = `<h4>Payroll ${m}</h4><table><tr>
      <th>ID</th><th>Name</th><th>Gross</th>
      <th>PF(E)</th><th>PF(ER)</th>
      <th>ESIC(E)</th><th>ESIC(ER)</th><th>Net</th></tr>`;
    rows.forEach(r => {
      h += `<tr><td>${r.empId}</td><td>${r.name}</td>
        <td>${r.gross.toFixed(0)}</td>
        <td>${r.pfEmp.toFixed(0)}</td>
        <td>${r.pfEmpr.toFixed(0)}</td>
        <td>${r.esicEmp.toFixed(0)}</td>
        <td>${r.esicEmpr.toFixed(0)}</td>
        <td>${r.net.toFixed(0)}</td></tr>`;
    });
    h += `</table>`;
    payrollArea.innerHTML = h;
  }

  /* =========================
     REPORTS (DOWNLOADS WORK)
  ========================= */
  function renderReports() {
    content.innerHTML = `
      <h3>Reports</h3>
      <p>Run payroll first to enable downloads.</p>
      <button onclick="downloadPF()">PF CSV (ECR)</button>
      <button onclick="downloadESIC()">ESIC CSV</button>
    `;
  }

  window.downloadPF = function () {
    const m = Object.keys(payrollHistory).slice(-1)[0];
    const rows = payrollHistory[m] || [];
    const csv = "EmpID,Name,PF_EE,PF_ER\n" +
      rows.map(r => `${r.empId},${r.name},${r.pfEmp},${r.pfEmpr}`).join("\n");
    downloadCSV(csv, "PF_ECR_" + m);
  };

  window.downloadESIC = function () {
    const m = Object.keys(payrollHistory).slice(-1)[0];
    const rows = payrollHistory[m] || [];
    const csv = "EmpID,Name,ESIC_EE,ESIC_ER\n" +
      rows.map(r => `${r.empId},${r.name},${r.esicEmp},${r.esicEmpr}`).join("\n");
    downloadCSV(csv, "ESIC_" + m);
  };

  function downloadCSV(text, name) {
    const blob = new Blob([text], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".csv";
    a.click();
  }

});
