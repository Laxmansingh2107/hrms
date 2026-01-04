document.addEventListener("DOMContentLoaded", () => {

  let employees = JSON.parse(localStorage.getItem("employees")) || [];
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

  const content = document.getElementById("content");
  const menuItems = document.querySelectorAll(".sidebar li");

  menuItems.forEach(li => {
    li.onclick = () => {
      menuItems.forEach(i => i.classList.remove("active"));
      li.classList.add("active");
      loadPage(li.dataset.page);
    };
  });

  loadPage("dashboard");

  /* ================= DASHBOARD ================= */

  function loadPage(page) {
    if (page === "dashboard") renderDashboard();
    if (page === "employees") renderEmployeeList();
    if (page === "attendance") renderAttendance();
    if (page === "payroll") content.innerHTML = `<h3>Payroll</h3><p>Coming next.</p>`;
    if (page === "reports") content.innerHTML = `<h3>Reports</h3><p>Coming next.</p>`;
  }

  function renderDashboard() {
    content.innerHTML = `
      <h3>Dashboard</h3>
      <p><b>Total Employees:</b> ${employees.length}</p>
      <p><b>Total Attendance Entries:</b> ${attendance.length}</p>
    `;
  }

  /* ================= EMPLOYEE MASTER ================= */

  function renderEmployeeList() {
    content.innerHTML = `
      <h3>Employee Master</h3>
      <button id="addEmp">Add Employee</button>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Name</th>
            <th>Basic</th>
          </tr>
        </thead>
        <tbody id="empTable"></tbody>
      </table>
    `;

    document.getElementById("addEmp").onclick = renderAddEmployeeForm;
    drawEmployeeTable();
  }

  function drawEmployeeTable() {
    const tbody = document.getElementById("empTable");
    tbody.innerHTML = "";

    employees.forEach(emp => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${emp.empId}</td>
        <td>${emp.name}</td>
        <td>${emp.basic}</td>
      `;
      tr.onclick = () => renderEmployeeProfile(emp.empId);
      tbody.appendChild(tr);
    });
  }

  function renderAddEmployeeForm() {
    content.innerHTML = `
      <h3>Add Employee</h3>

      <div class="form-row">
        <label>Name</label>
        <input id="name">
      </div>

      <div class="form-row">
        <label>Basic Salary</label>
        <input type="number" id="basic">
      </div>

      <button id="saveEmp">Save</button>
      <button id="cancel">Cancel</button>
    `;

    document.getElementById("saveEmp").onclick = saveEmployee;
    document.getElementById("cancel").onclick = renderEmployeeList;
  }

  function saveEmployee() {
    employees.push({
      empId: "EMP" + (employees.length + 1),
      name: name.value,
      basic: Number(basic.value)
    });

    localStorage.setItem("employees", JSON.stringify(employees));
    renderEmployeeList();
  }

  function renderEmployeeProfile(empId) {
    const emp = employees.find(e => e.empId === empId);

    content.innerHTML = `
      <h3>Employee Profile</h3>
      <p><b>Employee ID:</b> ${emp.empId}</p>
      <p><b>Name:</b> ${emp.name}</p>
      <p><b>Basic Salary:</b> ₹${emp.basic}</p>

      <button id="back">Back to List</button>
    `;

    document.getElementById("back").onclick = renderEmployeeList;
  }

  /* ================= ATTENDANCE ================= */

  function renderAttendance() {
    content.innerHTML = `
      <h3>Attendance</h3>

      <div class="form-row">
        <label>Date</label>
        <input type="date" id="attDate">
      </div>

      <div class="form-row">
        <label>Employee</label>
        <select id="attEmp"></select>
      </div>

      <div class="form-row">
        <label>In Time</label>
        <input type="time" id="inTime">
      </div>

      <div class="form-row">
        <label>Out Time</label>
        <input type="time" id="outTime">
      </div>

      <button id="mark">Save Attendance</button>

      <h4>Attendance Register</h4>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee</th>
            <th>In</th>
            <th>Out</th>
          </tr>
        </thead>
        <tbody id="attTable"></tbody>
      </table>
    `;

    attDate.value = new Date().toISOString().split("T")[0];
    populateAttendanceEmployees();
    document.getElementById("mark").onclick = saveAttendance;
    drawAttendanceTable();
  }

  function populateAttendanceEmployees() {
    const sel = document.getElementById("attEmp");
    sel.innerHTML = employees.map(e =>
      `<option value="${e.empId}">${e.name}</option>`
    ).join("");
  }

  function saveAttendance() {
    attendance.push({
      date: attDate.value,
      empId: attEmp.value,
      in: inTime.value,
      out: outTime.value
    });
    localStorage.setItem("attendance", JSON.stringify(attendance));
    drawAttendanceTable();
  }

  function drawAttendanceTable() {
    const tbody = document.getElementById("attTable");
    tbody.innerHTML = "";

    attendance.forEach(a => {
      const emp = employees.find(e => e.empId === a.empId);
      tbody.innerHTML += `
        <tr>
          <td>${a.date}</td>
          <td>${emp ? emp.name : ""}</td>
          <td>${a.in}</td>
          <td>${a.out}</td>
        </tr>
      `;
    });
  }

});
