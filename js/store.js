const Store = {
  getEmployees() {
    return JSON.parse(localStorage.getItem("employees")) || [];
  },

  saveEmployees(data) {
    localStorage.setItem("employees", JSON.stringify(data));
  },

  getAttendance() {
    return JSON.parse(localStorage.getItem("attendance")) || [];
  },

  saveAttendance(data) {
    localStorage.setItem("attendance", JSON.stringify(data));
  }
};
