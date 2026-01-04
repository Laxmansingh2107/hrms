document.addEventListener("DOMContentLoaded", function () {

  /* =========================
     GLOBAL STATE
  ========================== */
  let employees = JSON.parse(localStorage.getItem("employees")) || [];
  let attendance = JSON.parse(localStorage.getItem("attendance")) || [];

  const STANDARD_HOURS = 8;
  const BASIC_DAILY_RATE = 600;   // can be changed per employee later
  const OT_RATE_PER_HOUR = 100;

  const content = document.getElementById("content");

  /* =========================
     NAVIGATION
  ========================== */
  document.querySelectorAll(".sidebar li").forEach(item => {
    item.addEventListener("click", () => {
      loadPage(item.dataset.page);
    });
  });

  loadPage("dashboard");

  /* =========================
     PAGE LOADER
  ========================== */
  function loadPage(page) {

    if (page === "dashboard") {
      content.innerHTML = `
        <h2>Dashboard</h2>
        <p>Total Employees: ${employees.length}</p>
        <p>Total Attendance Records: ${attendance.length}</p>
      `;
    }

    if (page === "employees") {
      content.innerHTML = `
        <h2>Employees</h2>
        <button id="addEmployeeBtn">Add Employee</button>
        <div id="employeeSection"></div>
        <div id="employeeList"></div>
      `;
      document.getElementById("addEmployeeBtn")
        .addEventListener("click", showEmployeeForm);
      displayEmployees();
    }

    if (page === "attendance") {
      content.innerHTML = `
        <h2>Attendance</h2>

        <form id="attendanceForm">
          <label>Date</label><br/>
          <input type="date" id="attDate" required /><br/><br/>

          <label>Employee</label><br/>
          <select id="attEmployee"></select><br/><br/>

          <label>Status</label><br/>
          <select id="attStatus">
            <option value="Present">Present</option>
            <option value="Absent">Absent</option>
            <option value="Leave">Leave</option>
          </select><br/><br/>

          <label>In Time</label><br/>
          <input type="time" id="inTime"/><br/><br/>

          <label>Out Time</label><br/>
          <input type="time" id="outTime"/><br/><br/>

          <label>Work Hours</label><br/>
          <input type="number" id="attHours" readonly /><br/><br/>

          <label>Overtime Hours</label><br/>
          <input type="number" id="attOT" readonly /><br/><br/>

          <button type="submit">Save Attendance</button>
        </form>

        <h3>Attendance Register</h3>
        <div id="attendanceList"></div>
      `;

      document.getElementById("attDate").value =
        new Date().toISOString().split("T")[0];

      populateEmployeeDropdown();
      document.getElementById("inTime").addEventListener("change", calculateHours);
      document.getElementById("outTime").addEventListener("change", calculateHours);
      document.getElementById("attendanceForm")
        .addEventListener("submit", saveAttendance);

      displayAttendance();
    }

    if (page === "payroll") {
      generatePayroll();
    }

    if (page === "reports") {
      content.innerHTML = `
        <h2>Reports</h2>
        <p>Attendance Register and Payroll Sheet are audit-ready.</p>
        <p>CSV / Excel export can be added next.</p>
      `;
    }
  }

  /* =========================
     EMPLOYEES
  ========================== */
  function showEmployeeForm() {
    document.getElementById("employeeSection").innerHTML = `
      <form id="employeeForm">
        <label>Name</label><br/>
        <input type="text" id="name" required /><br/><br/>

        <label>Type</label><br/>
        <select id="type">
          <option>On-roll</option>
          <option>Contractual</option>
        </select><br/><br/>

        <label>Designation</label><br/>
        <input type="text" id="designation" /><br/><br/>

        <button type="submit">Save</button>
      </form>
    `;
    document.getElementById("employeeForm")
      .addEventListener("submit", saveEmployee);
  }

  function saveEmployee(e) {
    e.preventDefault();
    employees.push({
      name: name.value,
      type: type.value,
      designation: designation.value
    });
    localStorage.setItem("employees", JSON.stringify(employees));
    displayEmployees();
  }

  function displayEmployees() {
    const list = document.getElementById("employeeList");
    if (!list) return;
    list.innerHTML = "<h3>Employee List</h3><ul>" +
      employees.map((e,i)=>`<li>${i+1}. ${e.name} – ${e.type}</li>`).join("")
      + "</ul>";
  }

  /* =========================
     ATTENDANCE
  ========================== */
  function populateEmployeeDropdown() {
    const d = document.getElementById("attEmployee");
    d.innerHTML = "";
    employees.forEach(e=>{
      const o=document.createElement("option");
      o.textContent=e.name;
      d.appendChild(o);
    });
  }

  function calculateHours() {
    if (!inTime.value || !outTime.value) return;

    let [ih,im]=inTime.value.split(":").map(Number);
    let [oh,om]=outTime.value.split(":").map(Number);

    let start = ih*60+im;
    let end = oh*60+om;
    if (end < start) end += 1440; // night shift

    let hours=(end-start)/60;
    attHours.value=Math.min(hours,STANDARD_HOURS).toFixed(2);
    attOT.value=Math.max(hours-STANDARD_HOURS,0).toFixed(2);
  }

  function saveAttendance(e) {
    e.preventDefault();
    attendance.push({
      date: attDate.value,
      employee: attEmployee.value,
      status: attStatus.value,
      inTime: inTime.value,
      outTime: outTime.value,
      workHours: Number(attHours.value),
      overtime: Number(attOT.value)
    });
    localStorage.setItem("attendance", JSON.stringify(attendance));
    displayAttendance();
  }

  function displayAttendance() {
    const c=document.getElementById("attendanceList");
    if (!c) return;
    if (!attendance.length) {
      c.innerHTML="<p>No attendance records.</p>";
      return;
    }
    c.innerHTML=`
      <table border="1">
        <tr>
          <th>Date</th><th>Employee</th><th>Status</th>
          <th>In</th><th>Out</th><th>Work</th><th>OT</th>
        </tr>
        ${attendance.map(a=>`
          <tr>
            <td>${a.date}</td><td>${a.employee}</td><td>${a.status}</td>
            <td>${a.inTime||"-"}</td><td>${a.outTime||"-"}</td>
            <td>${a.workHours}</td><td>${a.overtime}</td>
          </tr>`).join("")}
      </table>`;
  }

  /* =========================
     PAYROLL (MONTHLY)
  ========================== */
  function generatePayroll() {
    let payroll = {};

    attendance.forEach(a=>{
      if (a.status!=="Present") return;
      if (!payroll[a.employee])
        payroll[a.employee]={days:0,ot:0};
      payroll[a.employee].days+=1;
      payroll[a.employee].ot+=a.overtime;
    });

    content.innerHTML=`
      <h2>Payroll Sheet</h2>
      <table border="1">
        <tr>
          <th>Employee</th>
          <th>Days Worked</th>
          <th>Basic Pay</th>
          <th>OT Pay</th>
          <th>Gross Pay</th>
        </tr>
        ${Object.entries(payroll).map(([e,p])=>{
          let basic=p.days*BASIC_DAILY_RATE;
          let ot=p.ot*OT_RATE_PER_HOUR;
          return `<tr>
            <td>${e}</td>
            <td>${p.days}</td>
            <td>${basic}</td>
            <td>${ot}</td>
            <td>${basic+ot}</td>
          </tr>`;
        }).join("")}
      </table>
    `;
  }

});
