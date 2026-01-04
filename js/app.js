function loadPage(page) {
  const content = document.getElementById("content");

  if (page === "dashboard") {
    content.innerHTML = `
      <h2>Dashboard</h2>
      <p>System ready. No data yet.</p>
    `;
  }

  if (page === "employees") {
    content.innerHTML = `
      <h2>Employees</h2>
      <button onclick="showEmployeeForm()">Add Employee</button>
      <div id="employeeSection"></div>
    `;
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
