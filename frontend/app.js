// Change this to the deployed Render API URL when you deploy.
const API_BASE_URL = "https://student-management-system-k54x.onrender.com";
const form = document.getElementById("studentForm");
const rows = document.getElementById("studentRows");
const message = document.getElementById("message");
const search = document.getElementById("search");
let students = [];

function showMessage(text, type = "") {
  message.textContent = text;
  message.className = `message ${type}`;
}
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Request failed (${response.status})`);
  return result;
}
async function checkAPI() {
  const status = document.getElementById("apiStatus");
  try {
    const result = await request("/api/health");
    status.textContent = result.database === "connected" ? "API connected · Database connected" : "API online · Database not connected";
  } catch {
    status.textContent = "API not reachable · Start the backend first";
  }
}
async function loadStudents() {
  rows.innerHTML = '<tr><td colspan="7" class="empty">Loading records…</td></tr>';
  try {
    const result = await request("/api/students");
    students = result.data || [];
    renderStudents();
    await checkAPI();
  } catch (error) {
    rows.innerHTML = `<tr><td colspan="7" class="empty">${escapeHTML(error.message)}. Check that the backend is running.</td></tr>`;
    document.getElementById("count").textContent = "";
  }
}
function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}
function renderStudents() {
  const query = search.value.trim().toLowerCase();
  const filtered = students.filter(s => [s.studentId,s.name,s.email,s.department,s.semester,s.contact]
    .some(v => String(v ?? "").toLowerCase().includes(query)));
  if (!filtered.length) {
    rows.innerHTML = `<tr><td colspan="7" class="empty">${students.length ? "No matching students." : "No students yet. Add your first student above."}</td></tr>`;
  } else {
    rows.innerHTML = filtered.map(s => `<tr>
      <td>${escapeHTML(s.studentId)}</td><td>${escapeHTML(s.name)}</td><td>${escapeHTML(s.email)}</td>
      <td>${escapeHTML(s.department)}</td><td>${escapeHTML(s.semester)}</td><td>${escapeHTML(s.contact || "—")}</td>
      <td><div class="actions"><button class="small-button edit" data-edit="${escapeHTML(s._id)}">Edit</button><button class="small-button delete" data-delete="${escapeHTML(s._id)}">Delete</button></div></td>
    </tr>`).join("");
  }
  document.getElementById("count").textContent = `${filtered.length} of ${students.length} student(s)`;
}
form.addEventListener("submit", async event => {
  event.preventDefault();
  const editId = document.getElementById("editId").value;
  const data = {
    studentId: document.getElementById("studentId").value.trim(),
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    department: document.getElementById("department").value.trim(),
    semester: Number(document.getElementById("semester").value),
    contact: document.getElementById("contact").value.trim()
  };
  if (data.semester < 1 || data.semester > 12) return showMessage("Semester must be between 1 and 12.", "error");
  const button = document.getElementById("submitButton");
  button.disabled = true;
  try {
    const result = await request(editId ? `/api/students/${editId}` : "/api/students", {
      method: editId ? "PUT" : "POST", body: JSON.stringify(data)
    });
    showMessage(result.message || "Saved successfully.", "success");
    resetForm();
    await loadStudents();
  } catch (error) { showMessage(error.message, "error"); }
  finally { button.disabled = false; }
});
function resetForm() {
  form.reset();
  document.getElementById("editId").value = "";
  document.getElementById("formTitle").textContent = "Add a student";
  document.getElementById("submitButton").textContent = "Add student";
  document.getElementById("cancelEdit").classList.add("hidden");
}
rows.addEventListener("click", async event => {
  const editButton = event.target.closest("[data-edit]");
  const deleteButton = event.target.closest("[data-delete]");
  if (editButton) {
    const student = students.find(s => s._id === editButton.dataset.edit);
    if (!student) return;
    document.getElementById("editId").value = student._id;
    for (const key of ["studentId","name","email","department","semester","contact"]) {
      document.getElementById(key).value = student[key] ?? "";
    }
    document.getElementById("formTitle").textContent = "Edit student";
    document.getElementById("submitButton").textContent = "Save changes";
    document.getElementById("cancelEdit").classList.remove("hidden");
    window.scrollTo({top: 0, behavior: "smooth"});
  }
  if (deleteButton) {
    const student = students.find(s => s._id === deleteButton.dataset.delete);
    if (!student || !confirm(`Delete student ${student.name} (${student.studentId})?`)) return;
    try {
      const result = await request(`/api/students/${student._id}`, {method: "DELETE"});
      showMessage(result.message || "Student deleted.", "success");
      await loadStudents();
    } catch (error) { showMessage(error.message, "error"); }
  }
});
document.getElementById("cancelEdit").addEventListener("click", resetForm);
document.getElementById("refreshButton").addEventListener("click", loadStudents);
search.addEventListener("input", renderStudents);
checkAPI();
loadStudents();