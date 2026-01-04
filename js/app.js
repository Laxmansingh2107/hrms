document.addEventListener("DOMContentLoaded", function () {

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
      `;

      document
        .getElementById("addEmployeeBtn")
        .addEventListener("click", showEmployeeForm);
    }

    if (page === "attendance") {
      content.innerHTML = `
        <h2>Attendance</h2>
        <p>Attendance module coming next.</p>
      `;
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

  let employees = JSON.parse(localStorage.getItem("employees")) || [];

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

      <div id="employeeList"></div>
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
