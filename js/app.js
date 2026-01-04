document.addEventListener("DOMContentLoaded", () => {

  let employees = JSON.parse(localStorage.getItem("employees")) || [];
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

  const content = document.getElementById("content");
  const menuItems = document.querySelectorAll(".sidebar li");

  menuItems.forEach(item => {
    item.onclick = () => {
      menuItems.forEach(i => i.classList.remove("active"));
      item.classList.add("active");
      loadPage(item.dataset.page);
    };
  });

  loadPage("dashboard");

  /* ================= DASHBOARD ================= */

  function loadPage(page) {
    if (page === "dashboard") renderDashboard();
    if (page === "employees") renderEmployeeList();
    if (page === "attendance") renderAttendance();
  }

  function renderDashboard() {
    const today = new Date().toISOString().split("T")[0];
    const month = today.slice(0, 7);

    const todayCount = attendance.filter(a => a.date === today).length;
    const monthCount = attendance.filter(a => a.date.startsWith(month)).length;

    content.innerHTML = `
      <h3>Dashboard</h3>
      <p><b>Total Employees:</b> ${employees.length}</p>
      <p><b>Attendance Today:</b> ${todayCount}</p>
      <p><b>Attendance This Month:</b> ${monthCount}</p>
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
            <th>Employee ID</th>
            <th>Name</th>
            <th>Joining Date</th>
            <th>Status</th>
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
        <td>${emp.joiningDate}</td>
        <td>${emp.status}</td>
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
        <label>Joining Date</label>
        <input type="date" id="joiningDate">
      </div>

      <div class="form-row">
        <label>Status</label>
        <select id="status">
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      <div class="form-row">
        <label>Basic Salary</label>
        <input type="number" id="basic">
      </div>

      <button id="save">Save</button>
      <button id="cancel">Cancel</button>
    `;

    joiningDate.value = new Date().toISOString().split("T")[0];

    document.getElementById("save").onclick = saveEmployee;
    document.getElementById("cancel").onclick = renderEmployeeList;
  }

  function saveEmployee() {
    if (!name.value || !basic.value) {
      alert("Name and Basic Salary are mandatory");
      return;
    }

    const empId = "EMP" + String(employees.length + 1).padStart(3, "0");

    employees.push({
      empId,
      name: name.value,
      joiningDate: joiningDate.value,
      status: status.value,
      basic: Number(basic.value)
    });

    localStorage.setItem("employees", JSON.stringify(employees));
    renderEmployeeList();
  }

  function renderEmployeeProfile(empId) {
    const emp = employees.find(e => e.empId === empId);

    content.innerHTML = `
      <h3>Employee Profile</h3>
      <p><b>ID:</b> ${emp.empId}</p>
      <p><b>Name:</b> ${emp.name}</p>
      <p><b>Joining Date:</b> ${emp.joiningDate}</p>
      <p><b>Status:</b> ${emp.status}</p>
      <p><b>Basic Salary:</b> ₹${emp.basic}</p>

      <button id="back">Back to Employee List</button>
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

      <button id="saveAtt">Save Attendance</button>

      <h4>Attendance Register</h4>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Employee</th>
            <th>In</th>
            <th>Out</th>
            <th>WH</th>
            <th>OT</th>
          </tr>
        </thead>
        <tbody id="attTable"></tbody>
      </table>
    `;

    attDate.value = new Date().toISOString().split("T")[0];
    populateAttendanceEmployees();
    drawAttendanceTable();

    document.getElementById("saveAtt").onclick = saveAttendance;
  }

  function populateAttendanceEmployees() {
    attEmp.innerHTML = employees.map(e =>
      `<option value="${e.empId}">${e.name}</option>`
    ).join("");
  }

  function saveAttendance() {
    if (!inTime.value || !outTime.value) {
      alert("In Time and Out Time are mandatory");
      return;
    }

    const start = toMinutes(inTime.value);
    const end = toMinutes(outTime.value < inTime.value ? outTime.value : outTime.value);
    const diff = ((end + (end < start ? 1440 : 0)) - start) / 60;

    const workHours = Math.min(8, diff);
    const otHours = Math.max(0, diff - 8);

    attendance = attendance.filter(a =>
      !(a.empId === attEmp.value && a.date === attDate.value)
    );

    attendance.push({
      empId: attEmp.value,
      date: attDate.value,
      inTime: inTime.value,
      outTime: outTime.value,
      workHours: Number(workHours.toFixed(2)),
      otHours: Number(otHours.toFixed(2))
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
          <td>${a.inTime}</td>
          <td>${a.outTime}</td>
          <td>${a.workHours}</td>
          <td>${a.otHours}</td>
        </tr>
      `;
    });
  }

  function toMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

});
