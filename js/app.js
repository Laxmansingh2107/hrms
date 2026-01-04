// js/app.js
document.addEventListener("DOMContentLoaded", () => {
  let employees = Store.getEmployees();
  let attendance = Store.getAttendance();

  const content = document.getElementById("content");
  const menu = document.querySelectorAll(".sidebar li");

  menu.forEach(li => {
    li.onclick = () => {
      menu.forEach(m => m.classList.remove("active"));
      li.classList.add("active");
      loadPage(li.dataset.page);
    };
  });

  loadPage("dashboard");

  function loadPage(page) {
    if (page === "dashboard") renderDashboard();
    if (page === "employees") renderEmployeeMaster();
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

  function renderEmployeeMaster() {
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
        <tbody id="empBody"></tbody>
      </table>
    `;

    document.getElementById("addEmp").onclick = renderAddEmployee;
    drawEmployeeTable();
  }

  function drawEmployeeTable() {
    const tbody = document.getElementById("empBody");
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

  function renderAddEmployee() {
    content.innerHTML = `
      <h3>Add Employee</h3>

      <div class="form-row">
        <label>Name</label>
        <input id="name" />
      </div>

      <div class="form-row">
        <label>Joining Date</label>
        <input type="date" id="joiningDate" />
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
        <input type="number" id="basic" />
      </div>

      <button id="save">Save</button>
      <button id="cancel" class="secondary">Cancel</button>
    `;

    joiningDate.value = new Date().toISOString().split("T")[0];

    document.getElementById("save").onclick = saveEmployee;
    document.getElementById("cancel").onclick = renderEmployeeMaster;
  }

  function saveEmployee() {
    if (!name.value || !basic.value) return;

    const empId = "EMP" + String(employees.length + 1).padStart(3, "0");

    employees.push({
      empId,
      name: name.value,
      joiningDate: joiningDate.value,
      status: status.value,
      basic: Number(basic.value)
    });

    Store.saveEmployees(employees);
    renderEmployeeMaster();
  }

  function renderEmployeeProfile(empId) {
    const emp = employees.find(e => e.empId === empId);

    content.innerHTML = `
      <h3>Employee Profile</h3>
      <p><b>ID:</b> ${emp.empId}</p>
      <p><b>Name:</b> ${emp.name}</p>
      <p><b>Joining Date:</b> ${emp.joiningDate}</p>
      <p><b>Status:</b> ${emp.status}</p>
      <p><b>Basic:</b> ₹${emp.basic}</p>
      <button id="back" class="secondary">Back</button>
    `;

    document.getElementById("back").onclick = renderEmployeeMaster;
  }

  function renderAttendance() {
    content.innerHTML = `
      <h3>Attendance</h3>

      <div class="form-row">
        <label>Date</label>
        <input type="date" id="attDate" />
      </div>

      <div class="form-row">
        <label>Employee</label>
        <select id="attEmp"></select>
      </div>

      <div class="form-row">
        <label>In Time</label>
        <input type="time" id="inTime" />
      </div>

      <div class="form-row">
        <label>Out Time</label>
        <input type="time" id="outTime" />
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
        <tbody id="attBody"></tbody>
      </table>
    `;

    attDate.value = new Date().toISOString().split("T")[0];
    populateEmployeeDropdown();
    drawAttendanceTable();

    document.getElementById("saveAtt").onclick = saveAttendance;
  }

  function populateEmployeeDropdown() {
    const sel = document.getElementById("attEmp");
    sel.innerHTML = employees.map(e => `<option value="${e.empId}">${e.name}</option>`).join("");
  }

  function saveAttendance() {
    if (!inTime.value || !outTime.value) return;

    const start = toMinutes(inTime.value);
    const end = toMinutes(outTime.value);
    let diff = end - start;
    if (diff < 0) diff += 1440;

    const workHours = Math.min(8, diff / 60);
    const otHours = Math.max(0, diff / 60 - 8);

    attendance = attendance.filter(
      a => !(a.empId === attEmp.value && a.date === attDate.value)
    );

    attendance.push({
      empId: attEmp.value,
      date: attDate.value,
      inTime: inTime.value,
      outTime: outTime.value,
      workHours: Number(workHours.toFixed(2)),
      otHours: Number(otHours.toFixed(2))
    });

    Store.saveAttendance(attendance);
    drawAttendanceTable();
  }

  function drawAttendanceTable() {
    const tbody = document.getElementById("attBody");
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
