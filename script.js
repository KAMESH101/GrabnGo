
    function toggleDropdown() {
      document.getElementById("dropdownContent").classList.toggle("show");
    }

    window.onclick = function(event) {
      if (!event.target.matches('.dropbtn')) {
        let dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
          let openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    };
  
 function toggleDropdown() {
      document.getElementById("dropdownContent").classList.toggle("show");
    }

    function toggleAuthModal() {
      document.getElementById("authModal").classList.toggle("hidden");
    }

    function showForm(type) {
      const loginForm = document.getElementById("loginForm");
      const signupForm = document.getElementById("signupForm");
      document.getElementById("responseMsg").textContent = '';
      if (type === 'login') {
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
      } else {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
      }
    }

    document.getElementById("loginForm").addEventListener("submit", async function(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      const res = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      document.getElementById("responseMsg").textContent = result.message;
    });

    document.getElementById("signupForm").addEventListener("submit", async function(e) {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(this));
      const res = await fetch("/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const result = await res.json();
      document.getElementById("responseMsg").textContent = result.message;
    });
