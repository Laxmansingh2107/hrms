document.addEventListener("DOMContentLoaded", () => {

  /* ======================
     GLOBAL STORAGE
  ====================== */
  let employees = JSON.parse(localStorage.getItem("employees")) || [];
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];
  let payrollLocks = JSON.parse(localStorage.getItem("payrollLocks")) || {};

  const PF_RATE = 0.12;
  const PF_CEILING = 15000;
  const ESIC_EMP = 0.0075;
  const ESIC_EMPR = 0.0325;
  const ESIC_CEILING = 21000;

  const content = document.getElementById("content");

  document.querySelectorAll(".sidebar li").forEach(li => {
    li.onclick = () => loadPage(li.dataset.page);
  });

  loadPage("employees");

  /* ======================
     NAVIGATION
  ====================== */
  function loadPage(page) {
    if (page === "employees") renderEmployees();
    if (page === "attendance") renderAttendance();
    if (page === "payroll") renderPayroll();
    if (page === "reports") renderReports();
  }

  /* ======================
     EMPLOYEE MASTER
  ====================== */
  function renderEmployees() {
    content.innerHTML = `
      <h3>Employee Master</h3>
      <button onclick="addEmployee()">Add Employee</button>
      <button onclick="downloadEmployeeMaster()">Download Master (Excel)</button>
      <div id="empList"></div>
    `;
    drawEmployeeList();
  }

  window.addEmployee = function () {
    content.innerHTML = `
      <h3>Add Employee</h3>

      Name <input id="name"><br><br>
      PAN <input id="pan"><br><br>
      Basic <input type="number" id="basic"><br><br>

      PF Applicable <input type="checkbox" id="pf"><br>
      ESIC Applicable <input type="checkbox" id="esic"><br><br>

      TDS (Monthly) <input type="number" id="tds"><br>
      PT (Monthly) <input type="number" id="pt"><br><br>

      Bank <input id="bank"><br>
      Account <input id="account"><br>
      IFSC <input id="ifsc"><br><br>

      Remarks<br>
      <textarea id="remarks"></textarea><br><br>

      <button onclick="saveEmployee()">Save</button>
    `;
  };

  window.saveEmployee = function () {
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
      },
      bank: { bank: bank.value, account: account.value, ifsc: ifsc.value },
      remarks: remarks.value ? [{ date: new Date().toISOString().split("T")[0], note: remarks.value }] : []
    });
    localStorage.setItem("employees", JSON.stringify(employees));
    renderEmployees();
  };

  function drawEmployeeList() {
    let html = `<table><tr><th>ID</th><th>Name</th><th>Basic</th><th>Action</th></tr>`;
    employees.forEach(e => {
      html += `<tr>
        <td>${e.empId}</td>
        <td>${e.name}</td>
        <td>${e.salary.basic}</td>
        <td>
          <button onclick="downloadEmployeePDF('${e.empId}')">PDF</button>
        </td>
      </tr>`;
    });
    html += `</table>`;
    document.getElementById("empList").innerHTML = html;
  }

  /* ======================
     ATTENDANCE
  ====================== */
  function renderAttendance() {
    content.innerHTML = `
      <h3>Attendance</h3>
      Date <input type="date" id="date"><br><br>
      Employee <select id="emp"></select><br><br>
      In <input type="time" id="inT">
      Out <input type="time" id="outT"><br><br>
      <button onclick="saveAttendance()">Save</button>
    `;
    date.value = new Date().toISOString().split("T")[0];
    emp.innerHTML = employees.map(e =>
      `<option value="${e.empId}">${e.name}</option>`
    ).join("");
  }

  window.saveAttendance = function () {
    attendance.push({
      empId: emp.value,
      date: date.value
    });
    localStorage.setItem("attendance", JSON.stringify(attendance));
    alert("Attendance saved");
  };

  /* ======================
     PAYROLL
  ====================== */
  function renderPayroll() {
    content.innerHTML = `
      <h3>Payroll</h3>
      Month (YYYY-MM) <input id="month">
      <button onclick="runPayroll()">Run</button>
      <div id="payrollArea"></div>
    `;
  }

  window.runPayroll = function () {
    const m = month.value;
    if (payrollLocks[m]) {
      alert("Payroll locked for this month");
      return;
    }

    let rows = employees.map(emp => {
      let days = attendance.filter(a => a.empId === emp.empId && a.date.startsWith(m)).length;
      let basicEarned = (emp.salary.basic / 26) * days;

      let variable = Number(prompt(`Variable Conveyance for ${emp.name}`, 0));
      let gross = basicEarned + variable;

      let pfWage = Math.min(emp.salary.basic, PF_CEILING);
      let pfEmp = emp.statutory.pf ? pfWage * PF_RATE : 0;
      let pfEmpr = pfEmp;

      let esicEmp = (emp.statutory.esic && gross <= ESIC_CEILING) ? gross * ESIC_EMP : 0;
      let esicEmpr = (emp.statutory.esic && gross <= ESIC_CEILING) ? gross * ESIC_EMPR : 0;

      let net = gross - pfEmp - esicEmp - emp.statutory.pt - emp.statutory.tds;

      return {
        empId: emp.empId,
        name: emp.name,
        gross: Math.round(gross),
        pfEmp: Math.round(pfEmp),
        pfEmpr: Math.round(pfEmpr),
        esicEmp: Math.round(esicEmp),
        esicEmpr: Math.round(esicEmpr),
        pt: emp.statutory.pt,
        tds: emp.statutory.tds,
        net: Math.round(net)
      };
    });

    payrollArea.innerHTML = renderPayrollTable(rows) +
      `<button onclick="lockPayroll('${m}')">Lock Payroll</button>
       <button onclick="downloadPayrollExcel()">Excel</button>
       <button onclick="downloadPayrollPDF()">PDF</button>`;
  };

  function renderPayrollTable(rows) {
    let h = `<table><tr>
      <th>ID</th><th>Name</th><th>Gross</th>
      <th>PF(E)</th><th>PF(ER)</th>
      <th>ESIC(E)</th><th>ESIC(ER)</th>
      <th>PT</th><th>TDS</th><th>Net</th>
    </tr>`;
    rows.forEach(r => {
      h += `<tr>
        <td>${r.empId}</td><td>${r.name}</td><td>${r.gross}</td>
        <td>${r.pfEmp}</td><td>${r.pfEmpr}</td>
        <td>${r.esicEmp}</td><td>${r.esicEmpr}</td>
        <td>${r.pt}</td><td>${r.tds}</td><td>${r.net}</td>
      </tr>`;
    });
    h += `</table>`;
    window._payrollRows = rows;
    return h;
  }

  window.lockPayroll = function (m) {
    payrollLocks[m] = true;
    localStorage.setItem("payrollLocks", JSON.stringify(payrollLocks));
    alert("Payroll locked");
  };

  /* ======================
     REPORTS & DOWNLOADS
  ====================== */
  function renderReports() {
    content.innerHTML = `
      <h3>Reports</h3>
      <button onclick="downloadPF()">PF Challan CSV</button>
      <button onclick="downloadESIC()">ESIC Challan CSV</button>
    `;
  }

  window.downloadEmployeeMaster = function () {
    downloadExcel(employees, "employee_master");
  };

  window.downloadEmployeePDF = function (id) {
    const emp = employees.find(e => e.empId === id);
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.text(`Employee Profile: ${emp.name}`, 10, 10);
    doc.text(`PAN: ${emp.pan}`, 10, 20);
    doc.text(`Basic: ${emp.salary.basic}`, 10, 30);
    doc.save(emp.empId + "_profile.pdf");
  };

  window.downloadPayrollExcel = function () {
    downloadExcel(window._payrollRows, "payroll");
  };

  window.downloadPayrollPDF = function () {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.autoTable({
      head: [Object.keys(window._payrollRows[0])],
      body: window._payrollRows.map(Object.values)
    });
    doc.save("payroll.pdf");
  };

  window.downloadPF = function () {
    const pf = window._payrollRows.map(r => ({
      empId: r.empId, name: r.name, pfEmployee: r.pfEmp, pfEmployer: r.pfEmpr
    }));
    downloadCSV(pf, "pf_challan");
  };

  window.downloadESIC = function () {
    const esic = window._payrollRows.map(r => ({
      empId: r.empId, name: r.name, esicEmployee: r.esicEmp, esicEmployer: r.esicEmpr
    }));
    downloadCSV(esic, "esic_challan");
  };

  /* ======================
     UTILITIES
  ====================== */
  function downloadExcel(data, name) {
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, name + ".xlsx");
  }

  function downloadCSV(data, name) {
    const keys = Object.keys(data[0]);
    const rows = data.map(o => keys.map(k => o[k]).join(","));
    const csv = keys.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name + ".csv";
    a.click();
  }

});
