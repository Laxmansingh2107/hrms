document.addEventListener("DOMContentLoaded", function () {
  // =========================
  // Global state
  // =========================
  let employees = JSON.parse(localStorage.getItem("employees")) || [];
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

  const content = document.getElementById("content");

  function loadPage(page) {
    if (page === "dashboard") {
      content.innerHTML = `
        <h2>Dashboard</h2>
        <p>System ready. No data yet.</p>
      `;
    }

    if (page === "employees") {
  content.innerHTML = `
    <h2>Employees</h2>
    <button id="addEmployeeBtn">Add Employee</button>

    <div id="employeeSection"></div>
    <div id="employeeList"></div>
  `;

  document
    .getElementById("addEmployeeBtn")
    .addEventListener("click", showEmployeeForm);

  // 👇 ALWAYS show existing employees
  displayEmployees();
}

    if (page === "attendance") {
  content.innerHTML = `
    <h2>Attendance</h2>

    <form id="attendanceForm">
      <label>Date</label><br />
      <input type="date" id="attDate" required /><br /><br />

      <label>Employee</label><br />
      <select id="attEmployee"></select><br /><br />

      <label>Status</label><br />
      <select id="attStatus">
        <option value="Present">Present</option>
        <option value="Absent">Absent</option>
        <option value="Leave">Leave</option>
      </select><br /><br />

      <label>Work Hours</label><br />
      <input type="number" id="attHours" value="8" /><br /><br />

      <label>Overtime Hours</label><br />
      <input type="number" id="attOT" value="0" /><br /><br />

      <button type="submit">Save Attendance</button>
    </form>

    <h3>Attendance Register</h3>
    <div id="attendanceList"></div>
  `;

  populateEmployeeDropdown();
  document
    .getElementById("attendanceForm")
    .addEventListener("submit", saveAttendance);

  displayAttendance();
}

    if (page === "payroll") {
      content.innerHTML = `
        <h2>Payroll</h2>
        <p>Payroll module coming next.</p>
      `;
    }

    if (page === "reports") {
      content.innerHTML = `
        <h2>Reports</h2>
        <p>Reports module coming next.</p>
      `;
    }
  }

  // Sidebar navigation binding
  document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", function () {
      const page = this.getAttribute("data-page");
      loadPage(page);
    });
  });

  // Default page
  loadPage("dashboard");
  displayEmployees();

  // =========================
  // Employee logic
  // =========================


  function showEmployeeForm() {
    const section = document.getElementById("employeeSection");

    section.innerHTML = `
      <h3>Add Employee</h3>
      <form id="employeeForm">
        <label>Name</label><br />
        <input type="text" id="name" required /><br /><br />

        <label>Employee Type</label><br />
        <select id="type">
          <option value="On-roll">On-roll</option>
          <option value="Contractual">Contractual</option>
        </select><br /><br />

        <label>Designation</label><br />
        <input type="text" id="designation" /><br /><br />

        <button type="submit">Save</button>
      </form>
    `;

    document
      .getElementById("employeeForm")
      .addEventListener("submit", saveEmployee);
  }

  function saveEmployee(event) {
  event.preventDefault();

  const employee = {
    name: document.getElementById("name").value,
    type: document.getElementById("type").value,
    designation: document.getElementById("designation").value
  };

  employees.push(employee);

  // SAVE TO LOCAL STORAGE
  localStorage.setItem("employees", JSON.stringify(employees));

  displayEmployees();
}

  function displayEmployees() {
    const list = document.getElementById("employeeList");

    let html = "<h3>Employee List</h3><ul>";
    employees.forEach((emp, index) => {
      html += `<li>${index + 1}. ${emp.name} – ${emp.type} – ${emp.designation}</li>`;
    });
    html += "</ul>";

    list.innerHTML = html;
  }

});
function populateEmployeeDropdown() {
  const dropdown = document.getElementById("attEmployee");
  dropdown.innerHTML = "";

  employees.forEach(emp => {
    const option = document.createElement("option");
    option.value = emp.name;
    option.textContent = emp.name;
    dropdown.appendChild(option);
  });
}

function saveAttendance(event) {
  event.preventDefault();

  const record = {
    date: document.getElementById("attDate").value,
    employee: document.getElementById("attEmployee").value,
    status: document.getElementById("attStatus").value,
    workHours: Number(document.getElementById("attHours").value),
    overtime: Number(document.getElementById("attOT").value)
  };

  attendance.push(record);
  localStorage.setItem("attendance", JSON.stringify(attendance));

  displayAttendance();
}

function displayAttendance() {
  const container = document.getElementById("attendanceList");

  let html = `
    <table border="1" cellpadding="5">
      <tr>
        <th>Date</th>
        <th>Employee</th>
        <th>Status</th>
        <th>Work Hours</th>
        <th>OT</th>
      </tr>
  `;

  attendance.forEach(a => {
    html += `
      <tr>
        <td>${a.date}</td>
        <td>${a.employee}</td>
        <td>${a.status}</td>
        <td>${a.workHours}</td>
        <td>${a.overtime}</td>
      </tr>
    `;
  });

  html += "</table>";
  container.innerHTML = html;
}
