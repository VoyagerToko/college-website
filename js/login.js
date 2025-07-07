document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("myform");
    if (loginForm) {
        loginForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const username = document.getElementById("login-username").value;
            const password = document.getElementById("login-password").value;

            fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    localStorage.setItem("username", username);
                    window.location.href = "courses.html";
                }
            })
            .catch(err => console.error(err));
        });
    }

    // Signup form
    const signupForm = document.getElementById("myform2");
    if (signupForm) {
        signupForm.addEventListener("submit", function (e) {
            e.preventDefault();
            const name = document.getElementById("signup-name").value;
            const username = document.getElementById("signup-username").value;
            const password = document.getElementById("signup-password").value;

            fetch('http://localhost:3000/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, username, password })
            })
            .then(res => res.json())
            .then(data => alert(data.message))
            .catch(err => console.error(err));
        });
    }

    const signUpBtn = document.getElementById("SignUpButton");
    const signInBtn = document.getElementById("SignInButton");

    if (signUpBtn && signInBtn) {
        signUpBtn.addEventListener("click", () => {
            document.getElementById("login").style.display = "none";
            document.getElementById("register").style.display = "block";
        });

        signInBtn.addEventListener("click", () => {
            document.getElementById("login").style.display = "block";
            document.getElementById("register").style.display = "none";
        });
    }

    document.querySelectorAll('.bookmark-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const username = localStorage.getItem("username");
            if (!username) {
                alert("Please log in to bookmark a course.");
                return;
            }

            const courseDiv = btn.closest('.col-4');
            const courseId = courseDiv.getAttribute("data-course-id");

            try {
                const res = await fetch('http://localhost:3000/api/bookmark', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ courseId, username })
                });

                const data = await res.json();

                if (res.ok && data.success) {
                    alert("✅ Bookmarked successfully!");
                    btn.textContent = "✅ Bookmarked";
                    btn.disabled = true;
                } else {
                    alert(data.message || "Bookmarking failed.");
                }
            } catch (err) {
                console.error(err);
                alert("Something went wrong!");
            }
        });
    });

    (async () => {
        const username = localStorage.getItem("username");
        if (!username) return;

        try {
            const res = await fetch(`http://localhost:3000/api/bookmarks?username=${username}`);
            const data = await res.json();

            if (res.ok && Array.isArray(data.bookmarks)) {
                data.bookmarks.forEach(courseId => {
                    const courseDiv = document.querySelector(`.col-4[data-course-id="${courseId}"]`);
                    if (courseDiv) {
                        const btn = courseDiv.querySelector('.bookmark-btn');
                        if (btn) {
                            btn.textContent = "✅ Bookmarked";
                            btn.disabled = true;
                        }
                    }
                });
            }
        } catch (err) {
            console.error("Failed to load bookmarks", err);
        }
    })();

    const sortSelect = document.getElementById("sort");
    if (sortSelect) {
        sortSelect.addEventListener("change", sortCourses);
    }
});

function logout() {
    localStorage.removeItem("username");
    alert("You have been logged out successfully.");
    window.location.href = "login.html";
}

function sortCourses() {
    let container = document.getElementById("courses-container");
    let courses = Array.from(container.getElementsByClassName("col-4"));
    let sortBy = document.getElementById("sort").value;

    courses.sort((a, b) => {
        if (sortBy === "rating") {
            return b.getAttribute("data-rating") - a.getAttribute("data-rating");
        } else if (sortBy === "package") {
            return b.getAttribute("data-package") - a.getAttribute("data-package");
        } else {
            return 0;
        }
    });

    courses.forEach(course => container.appendChild(course));
}
