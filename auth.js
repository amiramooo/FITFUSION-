console.log("FitFusion auth.js loaded");

async function sendAuthentication(url, data) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    credentials: "same-origin",
    body: JSON.stringify(data)
  });
  const result = await response.json(); 

  if(!response.ok) {
         throw new Error(result.message || "request failed");

  }

  return result;
}

document.addEventListener("DOMContentLoaded", () => {
  const registerForm = document.getElementById("registerForm");
  const loginForm = document.getElementById("loginForm");
  const logoutButton = document.getElementById("logoutButton");
  
  console.log("logout button found:", logoutButton);
  console.log("Registration form found:", registerForm);
  console.log("Login form found:", loginForm);

  if(registerForm) {
    registerForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      console.log("Registration form submittted");

      const message = document.getElementById("registerMessage");

      try {
        const result = await sendAuthentication("/api/auth/register", {
          fullName : document.getElementById("fullName").value.trim(),
          email : document.getElementById("registerEmail").value.trim(),
          password : document.getElementById("registerPassword").value
        });

        if(message) {
          message.textContent = result.message || "Account created successfully!";

        }

        registerForm.reset();
      }
      catch (error) {
        console.error("registration error:", error);
        if(message) {
          message.textContent = error.message;
        }
      }
    });
  }

  if(loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const message = document.getElementById("loginMessage");

      try {
        await sendAuthentication("/api/auth/login", {
          email: document.getElementById("loginEmail").value.trim(),
          password: document.getElementById("loginPassword").value
        });

        window.location.href = "index.html";

      }

      catch (error) {
        console.error("Login error:", error);
        if (message) {
          message.textContent = error.message;
        }
      }
    });
  }

  
if (logoutButton) {
  logoutButton.addEventListener("click", async () => {
    try {
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "same-origin"
      });

      if(!response.ok) {
        throw new Error("logout failed");
      }
      window.location.href = "login.html";

    }
    catch (error) {
      console.error("logout error:", error);
      alert("could not log out. please try again.");
    }
  });
}

});   




registerForm = document.getElementById("registerForm");

console.log("Registration form found:", registerForm);

