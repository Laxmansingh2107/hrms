document.addEventListener("DOMContentLoaded", () => {

  let employees = JSON.parse(localStorage.getItem("employees")) || [];
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

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

  function loadPage(page) {
    if (page === "employees") renderEmployees();
    if (page === "attendance") renderAttendance();
    if (page === "payroll") renderPayroll();
  }

  /* ================= EMPLOYEE MASTER ================= */

  function renderEmployees() {
    content.innerHTML = `
      <h3>Employee Master</h3>
      <button onclick="addEmployee()">Add Employee</button>
      <div id="empList"></div>
    `;
    drawEmployeeList();
  }

  window.addEmployee = function () {
    content.innerHTML = `
      <h3>Add Employee</h3>
      Name <input id="name"><br><br>
      Basic <input id="basic" type="number"><br><br>
      PF Applicable <input type="checkbox" id="pf"><br>
      ESIC Applicable <input type="checkbox" id="esic"><br><br>
      TDS (Monthly) <input id="tds" type="number"><br><br>
      PT (Monthly) <input id="pt" type="number"><br><br>
      <button onclick="saveEmployee()">Save</button>
    `;
  };

  window.saveEmployee = function () {
    employees.push({
      empId: "EMP" + (employees.length + 1),
      name: name.value,
      statutory: {
        pfApplicable: pf.checked,
        esicApplicable: esic.checked,
        tdsMonthly: Number(tds.value || 0),
        ptMonthly: Number(pt.value || 0)
      },
      salary: {
        basic: Number(basic.value),
        hra: 0,
        allowance: 0
      }
    });
    localStorage.setItem("employees", JSON.stringify(employees));
    renderEmployees();
  };

  function drawEmployeeList() {
    let html = `<table><tr><th>ID</th><th>Name</th><th>Basic</th></tr>`;
    employees.forEach(e => {
      html += `<tr><td>${e.empId}</td><td>${e.name}</td><td>${e.salary.basic}</td></tr>`;
    });
    html += `</table>`;
    document.getElementById("empList").innerHTML = html;
  }

  /* ================= ATTENDANCE ================= */

  function renderAttendance() {
    content.innerHTML = `
      <h3>Attendance</h3>
      Employee <select id="emp"></select><br><br>
      Date <input type="date" id="date"><br><br>
      <button onclick="saveAttendance()">Mark Present</button>
    `;
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
    alert("Saved");
  };

  /* ================= PAYROLL ================= */

  function renderPayroll() {
    content.innerHTML = `
      <h3>Payroll</h3>
      Month (YYYY-MM) <input id="month">
      <button onclick="runPayroll()">Run</button>
      <div id="payrollArea"></div>
    `;
  }

  window.runPayroll = function () {
    let m = month.value;
    let rows = employees.map(emp => {

      let days = attendance.filter(a =>
        a.empId === emp.empId && a.date.startsWith(m)
      ).length;

      let basicEarned = (emp.salary.basic / 26) * days;

      let variableConv = Number(prompt(`Variable Conveyance for ${emp.name}`, 0));

      let gross = basicEarned + variableConv;

      let pfWage = Math.min(emp.salary.basic, PF_CEILING);
      let pfEmp = emp.statutory.pfApplicable ? pfWage * PF_RATE : 0;
      let pfEmpr = pfEmp;

      let esicEmp = (emp.statutory.esicApplicable && gross <= ESIC_CEILING)
        ? gross * ESIC_EMP : 0;
      let esicEmpr = (emp.statutory.esicApplicable && gross <= ESIC_CEILING)
        ? gross * ESIC_EMPR : 0;

      let net = gross - pfEmp - esicEmp - emp.statutory.ptMonthly - emp.statutory.tdsMonthly;

      return {
        emp: emp.name,
        gross: Math.round(gross),
        pfEmp: Math.round(pfEmp),
        pfEmpr: Math.round(pfEmpr),
        esicEmp: Math.round(esicEmp),
        esicEmpr: Math.round(esicEmpr),
        pt: emp.statutory.ptMonthly,
        tds: emp.statutory.tdsMonthly,
        net: Math.round(net)
      };
    });

    drawPayroll(rows);
  };

  function drawPayroll(rows) {
    let html = `<table>
      <tr>
        <th>Name</th><th>Gross</th>
        <th>PF (Emp)</th><th>PF (Empr)</th>
        <th>ESIC (Emp)</th><th>ESIC (Empr)</th>
        <th>PT</th><th>TDS</th><th>Net</th>
      </tr>`;
    rows.forEach(r => {
      html += `<tr>
        <td>${r.emp}</td><td>${r.gross}</td>
        <td>${r.pfEmp}</td><td>${r.pfEmpr}</td>
        <td>${r.esicEmp}</td><td>${r.esicEmpr}</td>
        <td>${r.pt}</td><td>${r.tds}</td><td>${r.net}</td>
      </tr>`;
    });
    html += `</table>`;
    payrollArea.innerHTML = html;
  }

});
